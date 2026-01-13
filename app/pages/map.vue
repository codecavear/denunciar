<script setup lang="ts">
import type { Issue, Entity } from '~/server/database/schema'
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

const statusLabels = computed(() => ({
  pending: t('status.pending'),
  in_progress: t('status.in_progress'),
  resolved: t('status.resolved'),
  closed: t('status.closed')
}))

// Definition of Category Configuration (Icon + Color override/fallback)
// Using Waze-style intuitive icons
// IMPORTANT: These paths must perfectly match the ones in CategorySelector or be imported from a shared source. 
// For now duplicating for simplicity in this MVP.
const categoryConfig: Record<string, { icon: string, label: string }> = {
  pothole: { icon: 'alert-triangle', label: 'Pothole' },
  trash: { icon: 'trash-2', label: 'Trash' },
  lighting: { icon: 'lightbulb', label: 'Lighting' },
  safety: { icon: 'shield-alert', label: 'Safety' },
  water: { icon: 'droplets', label: 'Water Leak' },
  infrastructure: { icon: 'construction', label: 'Infrastructure' },
  other: { icon: 'help-circle', label: 'Other' }
}

function getIconPath(category: string): string {
  const iconName = categoryConfig[category]?.icon || 'help-circle'
  // Return SVG path data for each icon
  return getIconSvgPath(iconName)
}

onMounted(async () => {
  if (!config.public.googleMapsApiKey) {
    console.warn('Google Maps API key not configured')
    return
  }

  await loadGoogleMaps()
  initMap()
})

async function loadGoogleMaps() {
  if (window.google?.maps?.marker) return

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${config.public.googleMapsApiKey}&libraries=places,marker`
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google Maps'))
    document.head.appendChild(script)
  })
}

function initMap() {
  if (!mapContainer.value) return

  const mapOptions: google.maps.MapOptions = {
    center: defaultCenter,
    zoom: 14,
    mapId: config.public.googleMapsMapId as string, // Required for AdvancedMarker
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    clickableIcons: false
  }

  map.value = new google.maps.Map(mapContainer.value, mapOptions)

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

function createMarkerContent(issue: PublicIssue): HTMLElement {
  const statusColor = statusColors[issue.status] || statusColors.pending
  const category = issue.category || 'other'
  const iconPath = getIconPath(category)

  const container = document.createElement('div')
  container.className = 'marker-container'
  // Waze-style: Round balloon with icon inside. Border color indicates status.
  container.innerHTML = `
    <div style="
      position: relative;
      width: 44px;
      height: 44px;
      background: white;
      border: 4px solid ${statusColor};
      border-radius: 50% 50% 50% 10%;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
      cursor: pointer;
      transition: transform 0.2s;
    ">
      <div style="transform: rotate(45deg); display: flex; align-items: center; justify-content: center;">
        <svg style="
          width: 24px;
          height: 24px;
          fill: none;
          stroke: #374151; /* Gray-700 */
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
        " viewBox="0 0 24 24">
          ${iconPath}
        </svg>
      </div>
    </div>
  `
  
  // Add hover effect via event listeners if needed, or simple CSS class (but style is inline here)
  container.onmouseenter = () => { container.firstElementChild!.setAttribute('style', container.firstElementChild!.getAttribute('style') + ' transform: rotate(-45deg) scale(1.1);') }
  container.onmouseleave = () => { container.firstElementChild!.setAttribute('style', container.firstElementChild!.getAttribute('style')!.replace(' scale(1.1)', '')) }

  return container
}

function getIconSvgPath(iconName: string): string {
  const paths: Record<string, string> = {
    'droplets': '<path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/><path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/>',
    'road': '<path d="M4 19h4v-6h8v6h4M12 3v8M8 13h8"/>',
    'lightbulb': '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
    'trash-2': '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>',
    'trees': '<path d="M10 10v.2A3 3 0 0 1 8.9 16v0H5v0h0a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0z"/><path d="M7 16v6"/><path d="M13 19v3"/><path d="M10.9 12.9a8 8 0 0 1 10.1 7.1h0a3 3 0 0 1-3 3h0H8"/>',
    'shield-alert': '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 8v4"/><path d="M12 16h.01"/>',
    'building': '<rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/>',
    'alert-circle': '<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>',
    'alert-triangle': '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/>',
    'construction': '<rect x="2" y="6" width="20" height="8" rx="1"/><path d="M17 14v7"/><path d="M7 14v7"/><path d="M17 3v3"/><path d="M7 3v3"/><path d="M10 14 2.3 6.3"/><path d="m14 6 7.7 7.7"/><path d="m8 6 8 8"/>',
    'help-circle': '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>'
  }
  return paths[iconName] || paths['alert-circle']
}

// Category Filter
const activeCategories = ref<Set<string>>(new Set(Object.keys(categoryConfig)))

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

  // Check support for AdvancedMarkerElement
  const useAdvancedMarkers = !!google.maps.marker?.AdvancedMarkerElement

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
      const marker = new google.maps.marker.AdvancedMarkerElement({
        position,
        map: map.value,
        content: createMarkerContent(issue),
        title: issue.title
      })
      marker.addListener('click', () => {
        selectedIssue.value = issue
      })
      markers.value.push(marker)
    } else {
      // Fallback for no Advanced Markers support
      const color = statusColors[issue.status]
      const marker = new google.maps.Marker({
        position,
        map: map.value,
        title: issue.title,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: 'white',
          strokeWeight: 2
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
    <!-- Map container -->
    <div ref="mapContainer" class="w-full h-full">
      <div v-if="!isMapLoaded" class="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-900">
        <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
      </div>
    </div>

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
<<<<<<< Updated upstream
              :name="selectedIssue.entity?.icon || 'i-lucide-alert-circle'"
              class="w-12 h-12 text-muted"
=======
              :name="'i-lucide-' + (categoryConfig[selectedIssue.category || 'other']?.icon || 'help-circle')"
              class="w-12 h-12 text-gray-400"
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
            <div v-if="selectedIssue.entity" class="flex items-center gap-2 text-muted">
              <UIcon :name="selectedIssue.entity.icon || 'i-lucide-building-2'" class="w-4 h-4" />
              <span>{{ selectedIssue.entity.name }}</span>
=======
            <div v-if="selectedIssue.category" class="flex items-center gap-2 text-gray-500">
              <UIcon :name="'i-lucide-' + (categoryConfig[selectedIssue.category || 'other']?.icon || 'help-circle')" class="w-4 h-4" />
              <span class="capitalize">{{ categoryConfig[selectedIssue.category || 'other']?.label || selectedIssue.category }}</span>
>>>>>>> Stashed changes
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
