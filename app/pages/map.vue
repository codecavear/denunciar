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
const { loggedIn, user } = useUserSession()
const toast = useToast()
const { t } = useI18n()
const overlay = useOverlay()
const issueModal = overlay.create(LazyIssueCreateModal)

const mapContainer = ref<HTMLDivElement>()
const map = ref<google.maps.Map>()
const markers = ref<(google.maps.marker.AdvancedMarkerElement | google.maps.Marker)[]>([])
const isMapLoaded = ref(false)

const selectedIssue = ref<PublicIssue | null>(null)
const isConfirming = ref(false)

const { data: issues, refresh: refreshIssues } = await useFetch<PublicIssue[]>('/api/issues/public')
const { data: myConfirmations, refresh: refreshConfirmations } = await useFetch<string[]>('/api/issues/my-confirmations')

const defaultCenter = { lat: -31.4201, lng: -64.1888 } // Cordoba, Argentina

const statusColors: Record<string, string> = {
  pending: '#f59e0b', // Orange (Warning)
  in_progress: '#3b82f6', // Blue (Info)
  resolved: '#22c55e', // Green (Success)
  closed: '#9ca3af' // Gray (Neutral)
}

const statusLabels = computed<Record<string, string>>(() => ({
  pending: t('status.pending'),
  in_progress: t('status.in_progress'),
  resolved: t('status.resolved'),
  closed: t('status.closed')
}))

// Definition of Category Configuration (Icon + Label only, color from composable)
const { getPinSvg, getPinDataUrl, categoryColors, anchorPoint, size } = useMarkerIcon()

// IMPORTANT: These paths must perfectly match the ones in useMarkerIcon and EntitySelector
const categoryConfig: Record<string, { icon: string, label: string }> = {
  pothole: { icon: 'alert-triangle', label: 'Pothole' },
  trash: { icon: 'trash-2', label: 'Trash' },
  lighting: { icon: 'lightbulb', label: 'Lighting' },
  security: { icon: 'shield-alert', label: 'Security' }, // Was 'safety'
  trees: { icon: 'trees', label: 'Trees' }, // Added
  water: { icon: 'droplets', label: 'Water Leak' },
  infrastructure: { icon: 'construction', label: 'Infrastructure' },
  other: { icon: 'help-circle', label: 'Other' }
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
    clickableIcons: false
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

// Category Filter
const activeCategories = ref<Set<string>>(new Set(Object.keys(categoryColors)))

function toggleCategory(category: string) {
  if (activeCategories.value.has(category)) {
    activeCategories.value.delete(category)
  } else {
    activeCategories.value.add(category)
  }
  // Trigger reactivity for set
  activeCategories.value = new Set(activeCategories.value)
  addMarkers()
}

  function addMarkers() {
  if (!map.value || !issues.value) return

  // Clear existing markers
  markers.value.forEach((m: any) => {
    if (m.map !== undefined) m.map = null
  })
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
      contentEl.innerHTML = getPinSvg(issue.category)
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
          url: getPinDataUrl(issue.category),
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
})

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

    <!-- Legend (Using Categories now) -->
    <div class="absolute bottom-4 left-4 bg-white dark:bg-gray-900 rounded-lg shadow-lg p-2 md:p-3 z-40 max-h-[300px] overflow-y-auto">
      <div class="text-[10px] md:text-xs font-medium text-gray-500 mb-1 md:mb-2">{{ t('map.legend') }}</div>
      
      <!-- Category Filter -->
      <div class="mb-3 space-y-1">
        <div class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Filter by Type</div>
        <button
          v-for="(config, key) in categoryConfig"
          :key="key"
          class="flex items-center gap-1.5 md:gap-2 text-[11px] md:text-sm w-full hover:bg-gray-50 dark:hover:bg-gray-800 rounded px-1 transition-colors"
          :class="activeCategories.has(key) ? 'opacity-100' : 'opacity-40 grayscale'"
          @click="toggleCategory(key)"
        >
           <UIcon :name="'i-lucide-' + config.icon" class="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-600 dark:text-gray-400" />
           <span>{{ config.label }}</span>
        </button>
      </div>

      <!-- Status Legend -->
      <div class="space-y-1 pt-2 border-t border-gray-100 dark:border-gray-800">
        <div class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Status</div>
        <div v-for="(color, status) in statusColors" :key="status" class="flex items-center gap-1.5 md:gap-2 text-[11px] md:text-sm">
          <div class="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full border border-gray-300 dark:border-gray-600" :style="{ backgroundColor: color }" />
          <span>{{ statusLabels[status] }}</span>
        </div>
      </div>
    </div>

    <!-- Report button -->
    <div class="absolute bottom-4 right-4 z-40">
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
              color="success"
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
