<script setup lang="ts">
import type { Issue, Entity } from '~/server/database/schema'

defineProps<{
  issue: Issue & { entity?: Entity | null }
}>()

const statusColors: Record<string, string> = {
  pending: 'warning',
  in_progress: 'info',
  resolved: 'success',
  closed: 'neutral'
}

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed'
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>

<template>
  <NuxtLink :to="`/issues/${issue.id}`">
    <UCard
      class="hover:shadow-md transition-shadow cursor-pointer"
    >
      <div class="flex gap-4">
        <div v-if="issue.imageUrl" class="flex-shrink-0">
          <img
            :src="issue.imageUrl"
            :alt="issue.title"
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
          <div class="flex items-start justify-between gap-2">
            <h3 class="font-medium text-gray-900 dark:text-white truncate">
              {{ issue.title }}
            </h3>
            <UBadge :color="statusColors[issue.status]" variant="subtle" size="sm">
              {{ statusLabels[issue.status] }}
            </UBadge>
          </div>

          <p class="text-sm text-gray-500 mt-1 line-clamp-2">
            {{ issue.description }}
          </p>

          <div class="flex items-center gap-4 mt-2 text-xs text-gray-400">
            <span v-if="issue.entity" class="flex items-center gap-1">
              <UIcon name="i-lucide-building-2" class="w-3 h-3" />
              {{ issue.entity.name }}
            </span>
            <span v-if="issue.address" class="flex items-center gap-1 truncate">
              <UIcon name="i-lucide-map-pin" class="w-3 h-3" />
              {{ issue.address }}
            </span>
            <span class="flex items-center gap-1">
              <UIcon name="i-lucide-calendar" class="w-3 h-3" />
              {{ formatDate(issue.createdAt) }}
            </span>
          </div>
        </div>
      </div>
    </UCard>
  </NuxtLink>
</template>
