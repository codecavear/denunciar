<script setup lang="ts">
const props = defineProps<{
  latitude?: number | null
  longitude?: number | null
  address?: string | null
}>()

const emit = defineEmits<{
  'update:latitude': [value: number | null]
  'update:longitude': [value: number | null]
  'update:address': [value: string | null]
}>()

const config = useRuntimeConfig()
const mapContainer = ref<HTMLDivElement>()
const map = ref<google.maps.Map>()
const marker = ref<google.maps.Marker>()
const geocoder = ref<google.maps.Geocoder>()
const addressInput = ref(props.address || '')
const isLoadingLocation = ref(false)
const isMapLoaded = ref(false)

const defaultCenter = { lat: 40.4168, lng: -3.7038 }

const { load: loadGoogleMaps } = useGoogleMaps()

onMounted(async () => {
  if (!config.public.googleMapsApiKey) {
    console.warn('Google Maps API key not configured')
    return
  }

  await loadGoogleMaps()
  await initMap()
})

async function initMap() {
  if (!mapContainer.value) return

  const { Map } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary
  const { Marker } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary
  const { Geocoder } = await google.maps.importLibrary("geocoding") as google.maps.GeocodingLibrary

  const center = props.latitude && props.longitude
    ? { lat: props.latitude, lng: props.longitude }
    : defaultCenter

  map.value = new Map(mapContainer.value, {
    center,
    zoom: 15,
    mapId: config.public.googleMapsMapId as string,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false
  })

  geocoder.value = new Geocoder()

  marker.value = new Marker({
    map: map.value,
    draggable: true,
    position: props.latitude && props.longitude ? center : undefined,
    visible: !!(props.latitude && props.longitude)
  })

  map.value.addListener('click', (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      setLocation(e.latLng.lat(), e.latLng.lng())
    }
  })

  marker.value.addListener('dragend', () => {
    const pos = marker.value?.getPosition()
    if (pos) {
      setLocation(pos.lat(), pos.lng())
    }
  })

  isMapLoaded.value = true
}

async function setLocation(lat: number, lng: number) {
  emit('update:latitude', lat)
  emit('update:longitude', lng)

  marker.value?.setPosition({ lat, lng })
  marker.value?.setVisible(true)

  if (geocoder.value) {
    try {
      const response = await geocoder.value.geocode({ location: { lat, lng } })
      if (response.results[0]) {
        const formattedAddress = response.results[0].formatted_address
        addressInput.value = formattedAddress
        emit('update:address', formattedAddress)
      }
    } catch (e) {
      console.error('Geocoding error:', e)
    }
  }
}

async function searchAddress() {
  if (!addressInput.value || !geocoder.value) return

  try {
    const response = await geocoder.value.geocode({ address: addressInput.value })
    if (response.results[0]) {
      const location = response.results[0].geometry.location
      const lat = location.lat()
      const lng = location.lng()

      map.value?.setCenter({ lat, lng })
      setLocation(lat, lng)
    }
  } catch (e) {
    console.error('Address search error:', e)
  }
}

function getCurrentLocation() {
  if (!navigator.geolocation) {
    alert('Geolocation is not supported by your browser')
    return
  }

  isLoadingLocation.value = true

  const successCallback = (position: GeolocationPosition) => {
    const lat = position.coords.latitude
    const lng = position.coords.longitude
    map.value?.setCenter({ lat, lng })
    setLocation(lat, lng)
    isLoadingLocation.value = false
  }

  const errorCallback = (error: GeolocationPositionError) => {
    // macOS/Browser environment often throws Code 2 (Position Unavailable) when WiFi location is fluctuating or disabled.
    // We suppress the alert for Code 2 to avoid user annoyance, as the map is still usable manually.
    if (error.code === error.POSITION_UNAVAILABLE) {
      console.warn('Geolocation unavailable (Code 2). Using manual location selection.', error.message)
      isLoadingLocation.value = false
      return
    }

    console.error('Geolocation error (High Accuracy):', error)
    
    if (error.code === error.TIMEOUT) {
      console.log('Timeout. Retrying with low accuracy...')
      navigator.geolocation.getCurrentPosition(
        successCallback,
        (fallbackError) => {
          console.warn('Geolocation fallback failed:', fallbackError)
          // Silent failure on fallback to prevent spam, just stop loading
          isLoadingLocation.value = false
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
      )
    } else {
      // Permission denied (Code 1) or other errors -> Show alert
      alert(`Unable to get location: ${error.message}. Please select location manually on the map.`)
      isLoadingLocation.value = false
    }
  }

  navigator.geolocation.getCurrentPosition(
    successCallback,
    errorCallback,
    { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
  )
}

watch(() => props.address, (newAddress) => {
  if (newAddress && newAddress !== addressInput.value) {
    addressInput.value = newAddress
  }
})
</script>

<template>
  <div class="space-y-3">
    <div class="flex gap-2">
      <UInput
        v-model="addressInput"
        placeholder="Enter address or click on map"
        class="flex-1"
        @keyup.enter="searchAddress"
      />
      <UButton
        icon="i-lucide-search"
        color="neutral"
        variant="outline"
        @click="searchAddress"
      />
      <UButton
        icon="i-lucide-locate"
        color="neutral"
        variant="outline"
        :loading="isLoadingLocation"
        @click="getCurrentLocation"
      />
    </div>

    <div class="relative w-full h-64 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden">
      <ClientOnly>
        <div ref="mapContainer" class="w-full h-full" />
        <div v-if="!isMapLoaded" class="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 z-10">
          <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </ClientOnly>
    </div>

    <p v-if="latitude && longitude" class="text-xs text-gray-500">
      Coordinates: {{ latitude.toFixed(6) }}, {{ longitude.toFixed(6) }}
    </p>
  </div>
</template>
