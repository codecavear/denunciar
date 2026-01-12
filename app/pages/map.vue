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
const overlay = useOverlay()
const issueModal = overlay.create(LazyIssueCreateModal)

const mapContainer = ref<HTMLDivElement>()
const map = ref<google.maps.Map>()
const markers = ref<google.maps.marker.AdvancedMarkerElement[]>([])
const isMapLoaded = ref(false)

const selectedIssue = ref<PublicIssue | null>(null)
const isConfirming = ref(false)

const { data: issues, refresh: refreshIssues } = await useFetch<PublicIssue[]>('/api/issues/public')
const { data: myConfirmations, refresh: refreshConfirmations } = await useFetch<string[]>('/api/issues/my-confirmations')

const defaultCenter = { lat: -31.4201, lng: -64.1888 } // Cordoba, Argentina

const statusColors: Record<string, string> = {
  pending: '#f59e0b',
  in_progress: '#3b82f6',
  resolved: '#22c55e',
  closed: '#6b7280'
}

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed'
}

// Entity icon mapping (fallback for entities without custom icon)
const entityIcons: Record<string, string> = {
  'Water & Sewage': 'droplets',
  'Roads & Infrastructure': 'road',
  'Public Lighting': 'lightbulb',
  'Waste Management': 'trash-2',
  'Parks & Recreation': 'trees',
  'Public Safety': 'shield-alert',
  'Building & Permits': 'building'
}

function getIconName(entity: Entity | null): string {
  if (entity?.icon) {
    return entity.icon.replace('i-lucide-', '')
  }
  if (entity?.name && entityIcons[entity.name]) {
    return entityIcons[entity.name]
  }
  return 'alert-circle'
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

  const mapId = 'denunciar-map'

  map.value = new google.maps.Map(mapContainer.value, {
    center: defaultCenter,
    zoom: 14,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    mapId
  })

  // Click on map to create issue at location
  map.value.addListener('click', async (e: google.maps.MapMouseEvent) => {
    if (e.latLng && loggedIn.value) {
      const location = { lat: e.latLng.lat(), lng: e.latLng.lng() }
      const result = await issueModal.open({ initialLocation: location }).result
      if (result) {
        await onIssueCreated()
      }
    }
  })

  isMapLoaded.value = true
  addMarkers()

  // Try to get user's location
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
  const color = statusColors[issue.status]
  const iconName = getIconName(issue.entity)

  const container = document.createElement('div')
  container.className = 'marker-container'
  container.innerHTML = `
    <div style="
      width: 40px;
      height: 40px;
      background: ${color};
      border: 3px solid white;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      cursor: pointer;
    ">
      <svg style="
        width: 18px;
        height: 18px;
        transform: rotate(45deg);
        fill: none;
        stroke: white;
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
      " viewBox="0 0 24 24">
        ${getIconSvgPath(iconName)}
      </svg>
    </div>
  `
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
    'alert-circle': '<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>'
  }
  return paths[iconName] || paths['alert-circle']
}

function addMarkers() {
  if (!map.value || !issues.value) return

  // Clear existing markers
  markers.value.forEach(m => m.map = null)
  markers.value = []

  issues.value.forEach((issue) => {
    if (!issue.latitude || !issue.longitude) return

    const marker = new google.maps.marker.AdvancedMarkerElement({
      position: {
        lat: Number(issue.latitude),
        lng: Number(issue.longitude)
      },
      map: map.value,
      content: createMarkerContent(issue),
      title: issue.title
    })

    marker.addListener('click', () => {
      selectedIssue.value = issue
    })

    markers.value.push(marker)
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
    toast.add({ title: 'Please login to confirm issues', color: 'warning' })
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
    toast.add({ title: 'Failed to confirm issue', color: 'error' })
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
    toast.add({ title: 'Issue marked as resolved', color: 'success' })
  } catch (e) {
    toast.add({ title: 'Failed to update issue', color: 'error' })
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
  addMarkers()
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

    <!-- Legend -->
    <div class="absolute bottom-4 left-4 bg-white dark:bg-gray-900 rounded-lg shadow-lg p-3 z-40">
      <div class="text-xs font-medium text-gray-500 mb-2">Status</div>
      <div class="space-y-1">
        <div v-for="(color, status) in statusColors" :key="status" class="flex items-center gap-2 text-sm">
          <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: color }" />
          <span>{{ statusLabels[status] }}</span>
        </div>
      </div>
      <div class="text-xs text-gray-400 mt-3">
        Click map to report
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
        Report Issue
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
        class="absolute top-0 right-0 bottom-0 w-full max-w-md bg-white dark:bg-gray-900 shadow-xl z-40 overflow-y-auto"
      >
        <!-- Header image -->
        <div class="relative">
          <img
            v-if="selectedIssue.imageUrl"
            :src="selectedIssue.imageUrl"
            :alt="selectedIssue.title"
            class="w-full h-48 object-cover"
          >
          <div v-else class="w-full h-32 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <UIcon
              :name="selectedIssue.entity?.icon || 'i-lucide-alert-circle'"
              class="w-12 h-12 text-gray-400"
            />
          </div>

          <UButton
            icon="i-lucide-x"
            color="neutral"
            variant="solid"
            size="sm"
            class="absolute top-3 right-3"
            @click="closePanel"
          />
        </div>

        <div class="p-4 space-y-4">
          <!-- Title and status -->
          <div>
            <div class="flex items-start justify-between gap-2">
              <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                {{ selectedIssue.title }}
              </h2>
              <UBadge :color="selectedIssue.status === 'pending' ? 'warning' : selectedIssue.status === 'in_progress' ? 'info' : 'success'" variant="subtle">
                {{ statusLabels[selectedIssue.status] }}
              </UBadge>
            </div>
            <p class="text-sm text-gray-500 mt-1">
              Reported by {{ selectedIssue.user?.name || 'Anonymous' }} on {{ formatDate(selectedIssue.createdAt) }}
            </p>
          </div>

          <!-- Description -->
          <p class="text-gray-700 dark:text-gray-300">
            {{ selectedIssue.description }}
          </p>

          <!-- Details -->
          <div class="space-y-2 text-sm">
            <div v-if="selectedIssue.entity" class="flex items-center gap-2 text-gray-500">
              <UIcon :name="selectedIssue.entity.icon || 'i-lucide-building-2'" class="w-4 h-4" />
              <span>{{ selectedIssue.entity.name }}</span>
            </div>
            <div v-if="selectedIssue.address" class="flex items-center gap-2 text-gray-500">
              <UIcon name="i-lucide-map-pin" class="w-4 h-4" />
              <span>{{ selectedIssue.address }}</span>
            </div>
          </div>

          <!-- Confirmation count -->
          <div class="flex items-center gap-2 py-3 border-t border-b border-gray-200 dark:border-gray-700">
            <UIcon name="i-lucide-users" class="w-5 h-5 text-gray-400" />
            <span class="text-gray-600 dark:text-gray-400">
              <strong class="text-gray-900 dark:text-white">{{ selectedIssue.confirmationCount }}</strong>
              {{ selectedIssue.confirmationCount === 1 ? 'person' : 'people' }} confirmed this issue
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
              {{ hasConfirmed(selectedIssue) ? 'Confirmed' : 'Confirm Issue' }}
            </UButton>

            <UButton
              v-if="isOwner(selectedIssue) && selectedIssue.status !== 'resolved'"
              color="success"
              class="flex-1"
              @click="markResolved(selectedIssue)"
            >
              <UIcon name="i-lucide-check-circle" class="w-4 h-4 mr-1" />
              Mark Resolved
            </UButton>

            <UButton
              v-if="isOwner(selectedIssue)"
              color="neutral"
              variant="outline"
              :to="`/issues/${selectedIssue.id}`"
            >
              Edit
            </UButton>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>
