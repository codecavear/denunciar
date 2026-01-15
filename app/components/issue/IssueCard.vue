<script setup lang="ts">
import type { Issue, Entity } from '#shared/types'
import { CONFIRMATION_THRESHOLD } from '#shared/constants'
import { LazyAuthLoginModal } from '#components'

const props = defineProps<{
  issue: Issue & { entity?: Entity | null }
}>()

const { t } = useI18n()

type BadgeColor = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'

const statusColors: Record<string, BadgeColor> = {
  pending: 'warning',
  in_progress: 'info',
  resolved: 'success',
  closed: 'neutral'
}

function getStatusLabel(status: string) {
  return t(`status.${status}`)
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const { loggedIn } = useUserSession()
const overlay = useOverlay()
const loginModal = overlay.create(LazyAuthLoginModal)

const loading = ref(false)

async function toggleConfirm(e: Event) {
  e.preventDefault() // Prevent navigation to details
  e.stopPropagation()
  
  if (!loggedIn.value) {
    await loginModal.open({}).result
    if (!loggedIn.value) return
  }
  
  loading.value = true
  try {
    const res = await $fetch<{ confirmed: boolean }>(`/api/issues/${props.issue.id}/confirm`, {
      method: 'POST'
    })
    
    // Mutate local prop state for instant feedback (Vue reactive)
    props.issue.userConfirmed = res.confirmed
    props.issue.confirmationCount += res.confirmed ? 1 : -1
  } catch (err) {
    console.error('Failed to toggle confirmation', err)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <NuxtLink :to="`/issues/${props.issue.id}`">
    <UCard
      class="hover:shadow-md transition-shadow cursor-pointer"
    >
      <div class="flex gap-4">
        <div v-if="props.issue.imageUrl" class="flex-shrink-0">
          <img
            :src="props.issue.imageUrl"
            :alt="props.issue.title"
            class="w-24 h-24 object-cover rounded-lg"
          >
        </div>
        <div
          v-else
          class="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0"
        >
          <UIcon name="i-lucide-image-off" class="w-8 h-8 text-gray-400" />
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex items-start justify-between gap-1">
            <h3 class="font-medium text-gray-900 dark:text-white truncate">
              {{ props.issue.title }}
            </h3>
            <div class="flex gap-2">
              <UBadge 
                v-if="props.issue.confirmationCount >= CONFIRMATION_THRESHOLD"
                color="primary" 
                variant="subtle" 
                size="xs"
                class="flex-shrink-0 flex items-center gap-1"
              >
                <UIcon name="i-lucide-flame" class="w-3 h-3" />
                Verified
              </UBadge>
              <UBadge :color="statusColors[props.issue.status]" variant="subtle" size="xs" class="flex-shrink-0">
                {{ getStatusLabel(props.issue.status) }}
              </UBadge>
            </div>
          </div>

          <p class="text-sm text-gray-500 mt-1 line-clamp-2">
            {{ props.issue.description }}
          </p>

          <div class="flex items-center gap-4 mt-2 text-xs text-gray-400">
            <span v-if="props.issue.entity" class="flex items-center gap-1">
              <UIcon name="i-lucide-building-2" class="w-3 h-3" />
              {{ props.issue.entity.name }}
            </span>
            <span v-if="props.issue.address" class="flex items-center gap-1 truncate">
              <UIcon name="i-lucide-map-pin" class="w-3 h-3" />
              {{ props.issue.address }}
            </span>
            <span class="flex items-center gap-1">
              <UIcon name="i-lucide-calendar" class="w-3 h-3" />
              {{ formatDate(props.issue.createdAt) }}
            </span>
          </div>

          <div class="mt-3 flex items-center justify-end">
            <UButton
              :icon="props.issue.userConfirmed ? 'i-lucide-thumbs-up' : 'i-lucide-thumbs-up'"
              :color="props.issue.userConfirmed ? 'primary' : 'neutral'"
              :variant="props.issue.userConfirmed ? 'soft' : 'ghost'"
              size="xs"
              :loading="loading"
              class="rounded-full"
              @click="toggleConfirm"
            >
              {{ props.issue.confirmationCount }}
            </UButton>
          </div>
        </div>
      </div>
    </UCard>
  </NuxtLink>
</template>
