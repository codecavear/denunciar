<script setup lang="ts">
import type { Issue, Entity } from '#shared/types'
import { LazyIssueCreateModal } from '#components'

definePageMeta({
  layout: 'map'
})

type PublicIssue = Issue & {
  entity: Entity | null
  user: { id: string; name: string; avatarUrl: string | null } | null
  confirmationCount: number
}

const config = useRuntimeConfig()
const { loggedIn, user, clear } = useUserSession()
const toast = useToast()
const { t } = useI18n()
const overlay = useOverlay()
const issueModal = overlay.create(LazyIssueCreateModal)

const mapContainer = ref<HTMLDivElement>()
const map = shallowRef<google.maps.Map>()
const markers = shallowRef<(google.maps.marker.AdvancedMarkerElement | google.maps.Marker)[]>([])
const isMapLoaded = ref(false)

const selectedIssue = ref<PublicIssue | null>(null)
const isConfirming = ref(false)

const { data: issues, refresh: refreshIssues } = await useFetch<PublicIssue[]>('/api/issues/public')
const { data: myConfirmations, refresh: refreshConfirmations } = await useFetch<string[]>('/api/issues/my-confirmations')

const defaultCenter = { lat: -31.4201, lng: -64.1888 } // Cordoba, Argentina

// Hardcoded status labels to avoid i18n SSR hydration issues
const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  in_progress: 'En Progreso',
  resolved: 'Resuelto',
  closed: 'Cerrado',
  rejected: 'Rechazado'
}

// Definition of Category Configuration (Icon + Label only, color from composable)
const { getPinSvg, getPinDataUrl, categoryColors, statusColors, anchorPoint, size } = useMarkerIcon()

// Hardcoded labels to avoid i18n SSR hydration issues
const categoryConfig: Record<string, { icon: string, label: string }> = {
  pothole: { icon: 'alert-triangle', label: 'Bache' },
  trash: { icon: 'trash-2', label: 'Basura' },
  lighting: { icon: 'lightbulb', label: 'Alumbrado' },
  security: { icon: 'shield-alert', label: 'Seguridad' },
  trees: { icon: 'trees', label: 'Arbolado' },
  water: { icon: 'droplets', label: 'Agua' },
  infrastructure: { icon: 'construction', label: 'Infraestructura' },
  other: { icon: 'help-circle', label: 'Otro' }
}

function getCategoryIcon(category: string | null | undefined): string {
  const cat = category || 'other'
  const icon = categoryConfig[cat]?.icon || 'help-circle'
  return `i-lucide-${icon}`
}

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
  const { AdvancedMarkerElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary

  const mapOptions: google.maps.MapOptions = {
    center: defaultCenter,
    zoom: 14,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    clickableIcons: false,
    styles: [
      {
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }]
      }
    ]
  }

  // Only pass mapId if it exists to avoid "Map ID not found" warnings from Google
  if (config.public.googleMapsMapId) {
    mapOptions.mapId = config.public.googleMapsMapId as string
  }

  map.value = new Map(mapContainer.value, mapOptions)

  isMapLoaded.value = true
  addMarkers()

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        map.value?.setCenter({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
      },
      () => {}
    )
  }
}

// Category Filter & View Options
const activeCategories = ref<Set<string>>(new Set(Object.keys(categoryColors)))
const showPois = ref(false) // Default off

function toggleCategory(category: string) {
  if (activeCategories.value.has(category)) {
    activeCategories.value.delete(category)
  } else {
    activeCategories.value.add(category)
  }
  activeCategories.value = new Set(activeCategories.value)
}

function togglePois() {
  showPois.value = !showPois.value
}

// Watchers
watch(showPois, (visible) => {
  if (!map.value) return
  
  // Note: If Map ID is used (Advanced Markers), Google Cloud formatting overrides this JSON style.
  // This JSON style only works for standard maps or if Cloud style doesn't enforce POI visibility.
  const styles = [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: visible ? 'on' : 'off' }]
    }
  ]
  map.value.setOptions({ styles })
})

function centerMap() {
  if (!map.value || !navigator.geolocation) return

  navigator.geolocation.getCurrentPosition(
    (position) => {
      map.value?.setCenter({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      })
      map.value?.setZoom(16)
    },
    (error) => {
      console.error('Error getting location', error)
      toast.add({ title: t('map.locationError'), color: 'error' })
    }
  )
}

async function logout() {
  await clear()
  navigateTo('/auth/login')
}

  function addMarkers() {
  if (!map.value || !issues.value) return

  // Clear existing markers robustly
  if (markers.value.length > 0) {
    for (const m of markers.value) {
      try {
        if (typeof (m as any).setMap === 'function') {
          (m as any).setMap(null)
        } 
        // @ts-expect-error - AdvancedMarkerElement uses .map
        if (m.map) {
          m.map = null
        }
      } catch (e) {
        console.error('Error clearing marker:', e)
      }
    }
  }
  // Reset array completely
  markers.value = []

  // Check support for AdvancedMarkerElement AND valid Map ID
  // Advanced Markers require a valid mapId to be rendered.
  const hasMapId = !!config.public.googleMapsMapId
  const useAdvancedMarkers = !!google.maps.marker?.AdvancedMarkerElement && hasMapId

  if (!hasMapId) {
    console.warn('Google Maps "mapId" is missing. Advanced Markers (custom HTML icons) will be disabled. Using legacy markers fallback.')
  }

  issues.value.forEach((issue) => {
    if (!issue.latitude || !issue.longitude) return

    const category = issue.category || 'other'
    // Filter out issues if their category is unchecked
    if (!activeCategories.value.has(category)) return

    const position = {
      lat: Number(issue.latitude),
      lng: Number(issue.longitude)
    }

    if (useAdvancedMarkers) {
      // Create a DOM element for the marker content
      const contentEl = document.createElement('div')
      // Pass category AND status to get the correct icon (white on status-colored pin)
      contentEl.innerHTML = getPinSvg(issue.category, issue.status)
      contentEl.style.cursor = 'pointer'

      // Add simple hover scale effect
      contentEl.onmouseenter = () => { contentEl.style.transform = 'scale(1.1)'; contentEl.style.transition = 'transform 0.2s'; }
      contentEl.onmouseleave = () => { contentEl.style.transform = 'scale(1.0)' }

      const marker = new google.maps.marker.AdvancedMarkerElement({
        position,
        map: map.value,
        content: contentEl,
        title: issue.title
      })
      marker.addListener('click', () => {
        selectedIssue.value = issue
      })
      markers.value.push(marker)
    } else {
      // Robust Fallback: Standard Google Maps Marker with SVG Icon
      const marker = new google.maps.Marker({
        position,
        map: map.value,
        title: issue.title,
        icon: {
          url: getPinDataUrl(issue.category, issue.status),
          anchor: new google.maps.Point(anchorPoint.x, anchorPoint.y), // Updated for 3D Bubble
          scaledSize: new google.maps.Size(size.width, size.height)
        }
      })
      marker.addListener('click', () => {
        selectedIssue.value = issue
      })
      markers.value.push(marker)
    }
  })
}

watch(issues, () => {
  if (isMapLoaded.value) {
    addMarkers()
  }
}, { immediate: true })

// Fix for filter reactivity: Explicitly watch the Set size/content changes or just the ref itself
// Since we re-assign the Set in toggleCategory, deep watch or standard watch should work.
watch(activeCategories, () => {
  if (isMapLoaded.value) {
    addMarkers()
  }
}, { deep: true })

function isOwner(issue: PublicIssue) {
  return user.value?.id === issue.userId
}

function hasConfirmed(issue: PublicIssue) {
  return myConfirmations.value?.includes(issue.id) || false
}

async function toggleConfirm(issue: PublicIssue) {
  if (!loggedIn.value) {
    toast.add({ title: t('auth.signInAccess'), color: 'warning' })
    return
  }

  isConfirming.value = true
  try {
    await $fetch(`/api/issues/${issue.id}/confirm`, { method: 'POST' })
    await refreshIssues()
    await refreshConfirmations()

    if (selectedIssue.value?.id === issue.id) {
      selectedIssue.value = issues.value?.find(i => i.id === issue.id) || null
    }
  } catch (e) {
    toast.add({ title: t('issue.confirmFailed'), color: 'error' })
  } finally {
    isConfirming.value = false
  }
}

async function markResolved(issue: PublicIssue) {
  try {
    await $fetch(`/api/issues/${issue.id}`, {
      // @ts-expect-error - Nuxt typed routes restricts method types incorrectly
      method: 'PUT',
      body: { status: 'resolved' }
    })
    await refreshIssues()
    selectedIssue.value = null
    toast.add({ title: t('map.issueMarkedResolved'), color: 'success' })
  } catch (e) {
    toast.add({ title: t('issue.reportFailed'), color: 'error' })
  }
}

async function deleteIssue(issue: PublicIssue) {
  try {
    // @ts-expect-error - Nuxt typed routes restricts method types incorrectly
    await $fetch(`/api/issues/${issue.id}`, { method: 'DELETE' })
    await refreshIssues()
    addMarkers()
    selectedIssue.value = null
    toast.add({ title: t('issue.issueDeleted'), color: 'success' })
  } catch (e) {
    toast.add({ title: t('issue.deleteFailed'), color: 'error' })
  }
}

function closePanel() {
  selectedIssue.value = null
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

async function onIssueCreated() {
  await refreshIssues()
}

async function openCreateModal() {
  const result = await issueModal.open({}).result
  if (result) {
    await onIssueCreated()
  }
}
</script>

<template>
  <div class="relative w-full h-full">
    <ClientOnly>
      <!-- Map container -->
      <div ref="mapContainer" class="w-full h-full" />

      <!-- Map Loading Overlay -->
      <div v-if="!isMapLoaded" class="absolute inset-0 z-10 flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
      </div>
    </ClientOnly>

    <!-- Category Filters (Interactive) - ClientOnly to prevent i18n hydration mismatch -->
    <ClientOnly>
      <div class="absolute top-20 left-4 bg-white dark:bg-gray-900 rounded-lg shadow-lg p-3 z-40 max-w-[160px]">

        <!-- Card Title -->
        <div class="text-xs font-semibold text-gray-700 dark:text-gray-200 mb-3">{{ t('map.filters') }}</div>

        <!-- View Options -->
        <div class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{{ t('map.view') }}</div>
        <button
          class="flex items-center gap-2 text-xs w-full hover:bg-gray-50 dark:hover:bg-gray-800 rounded px-1.5 py-1 transition-all duration-200 mb-2"
          :class="showPois ? 'bg-gray-50 dark:bg-gray-800 font-medium' : 'opacity-70'"
          @click="togglePois()"
        >
           <UIcon name="i-lucide-map-pin" class="w-4 h-4 text-gray-500" />
           <span>Lugares</span>
           <UIcon v-if="showPois" name="i-lucide-eye" class="w-3 h-3 ml-auto text-primary" />
           <UIcon v-else name="i-lucide-eye-off" class="w-3 h-3 ml-auto text-gray-400" />
        </button>

        <div class="h-px bg-gray-100 dark:bg-gray-800 my-2" />

        <div class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{{ t('map.type') }}</div>
        <div class="space-y-1">
          <button
            v-for="(config, key) in categoryConfig"
            :key="key"
            class="flex items-center gap-2 text-xs w-full hover:bg-gray-50 dark:hover:bg-gray-800 rounded px-1.5 py-1 transition-all duration-200"
            :class="activeCategories.has(key) ? 'bg-gray-50 dark:bg-gray-800 font-medium' : 'opacity-50 grayscale'"
            @click="toggleCategory(key)"
          >
             <UIcon :name="'i-lucide-' + config.icon" class="w-4 h-4" :style="{ color: activeCategories.has(key) ? categoryColors[key] : 'currentColor' }" />
             <span>{{ config.label }}</span>
             <UIcon v-if="activeCategories.has(key)" name="i-lucide-check" class="w-3 h-3 ml-auto text-primary" />
          </button>
        </div>
      </div>
    </ClientOnly>

    <!-- Status Legend (Static/Informational) -->
    <div class="absolute bottom-4 left-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur rounded-lg shadow-lg p-3 z-40 border border-gray-100 dark:border-gray-800">
      <div class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{{ t('map.status') }}</div>
      <div class="flex flex-col gap-1.5">
        <!-- Simplified Legend: Pending, Resolved, Closed -->
        <div class="flex items-center gap-2 text-xs">
          <div class="w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-gray-900 shadow-sm" :style="{ backgroundColor: statusColors.pending }" />
          <span class="text-gray-600 dark:text-gray-300">Pendiente</span>
        </div>
        <div class="flex items-center gap-2 text-xs">
          <div class="w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-gray-900 shadow-sm" :style="{ backgroundColor: statusColors.resolved }" />
          <span class="text-gray-600 dark:text-gray-300">Resuelto</span>
        </div>
        <div class="flex items-center gap-2 text-xs">
          <div class="w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-gray-900 shadow-sm" :style="{ backgroundColor: statusColors.closed }" />
          <span class="text-gray-600 dark:text-gray-300">Cerrado</span>
        </div>
      </div>
    </div>

    <!-- Report button -->
    <!-- Top Right Controls (Logout) -->
    <div class="absolute top-4 right-4 z-40">
      <UButton
        v-if="loggedIn"
        icon="i-lucide-log-out"
        color="neutral"
        variant="solid"
        class="shadow-md bg-white dark:bg-gray-800"
        @click="logout"
      />
    </div>

    <!-- Bottom Right Controls (Location & Report) -->
    <div class="absolute bottom-4 right-4 z-40 flex flex-col items-end gap-2">
      <UButton
        icon="i-lucide-crosshair"
        color="neutral"
        variant="outline"
        square
        class="shadow-md !bg-white !text-gray-700 border-gray-200"
        @click="centerMap"
      />
      <UButton
        icon="i-lucide-plus"
        size="lg"
        color="primary"
        class="shadow-lg"
        @click="openCreateModal"
      >
        {{ t('map.reportIssue') }}
      </UButton>
    </div>

    <!-- Issue detail panel -->
    <Transition
      enter-active-class="transition-transform duration-300 ease-out"
      leave-active-class="transition-transform duration-200 ease-in"
      enter-from-class="translate-x-full"
      leave-to-class="translate-x-full"
    >
      <div
        v-if="selectedIssue"
        class="absolute top-0 right-0 bottom-0 w-full max-w-md bg-default shadow-xl z-40 overflow-y-auto ring ring-default"
      >
        <!-- Header image -->
        <div class="relative">
          <img
            v-if="selectedIssue.imageUrl"
            :src="selectedIssue.imageUrl"
            :alt="selectedIssue.title"
            class="w-full h-48 object-cover"
          >
          <div v-else class="w-full h-32 bg-elevated flex items-center justify-center">
             <UIcon
              :name="getCategoryIcon(selectedIssue.category)"
              class="w-12 h-12 text-gray-400"
            />
          </div>

          <UButton
            icon="i-lucide-x"
            color="neutral"
            variant="solid"
            size="sm"
            class="absolute top-3 right-3 z-10"
            @click="closePanel"
          />
        </div>

        <div class="p-4 space-y-4">
          <!-- Title and status -->
          <div>
            <div class="flex items-start justify-between gap-2">
              <h2 class="text-xl font-semibold text-highlighted">
                {{ selectedIssue.title }}
              </h2>
              <UBadge :color="selectedIssue.status === 'pending' ? 'warning' : selectedIssue.status === 'in_progress' ? 'info' : 'success'" variant="subtle">
                {{ statusLabels[selectedIssue.status] }}
              </UBadge>
            </div>
            <p class="text-sm text-muted mt-1">
              {{ t('map.reportedBy') }} {{ selectedIssue.user?.name || t('map.anonymous') }} {{ t('map.on') }} {{ formatDate(selectedIssue.createdAt) }}
            </p>
          </div>

          <!-- Description -->
          <p class="text-default">
            {{ selectedIssue.description }}
          </p>

          <!-- Details -->
          <div class="space-y-2 text-sm">
            <div v-if="selectedIssue.category" class="flex items-center gap-2 text-gray-500">
              <UIcon :name="getCategoryIcon(selectedIssue.category)" class="w-4 h-4" />
              <span class="capitalize">{{ categoryConfig[selectedIssue.category || 'other']?.label || selectedIssue.category }}</span>
            </div>
            <div v-if="selectedIssue.address" class="flex items-center gap-2 text-muted">
              <UIcon name="i-lucide-map-pin" class="w-4 h-4" />
              <span>{{ selectedIssue.address }}</span>
            </div>
          </div>

          <!-- Confirmation count -->
          <div class="flex items-center gap-2 py-3 border-y border-default">
            <UIcon name="i-lucide-users" class="w-5 h-5 text-muted" />
            <span class="text-muted">
              <strong class="text-highlighted">{{ selectedIssue.confirmationCount }}</strong>
              {{ selectedIssue.confirmationCount === 1 ? t('map.personConfirmed') : t('map.peopleConfirmed') }}
            </span>
          </div>

          <!-- Actions -->
          <div class="flex gap-2">
            <UButton
              v-if="!isOwner(selectedIssue)"
              :color="hasConfirmed(selectedIssue) ? 'success' : 'neutral'"
              :variant="hasConfirmed(selectedIssue) ? 'solid' : 'outline'"
              :loading="isConfirming"
              class="flex-1"
              @click="toggleConfirm(selectedIssue)"
            >
              <UIcon :name="hasConfirmed(selectedIssue) ? 'i-lucide-check' : 'i-lucide-thumbs-up'" class="w-4 h-4 mr-1" />
              {{ hasConfirmed(selectedIssue) ? t('map.confirmed') : t('map.confirmIssue') }}
            </UButton>

            <UButton
              v-if="isOwner(selectedIssue) && selectedIssue.status !== 'resolved'"
              color="primary"
              class="flex-1"
              @click="markResolved(selectedIssue)"
            >
              <UIcon name="i-lucide-check-circle" class="w-4 h-4 mr-1" />
              {{ t('map.markResolved') }}
            </UButton>

            <UButton
              v-if="isOwner(selectedIssue)"
              color="error"
              variant="outline"
              icon="i-lucide-trash-2"
              @click="deleteIssue(selectedIssue)"
            />
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>
