<script setup lang="ts">
import type { Issue, Entity } from '#shared/types'

definePageMeta({
  middleware: 'auth'
})

const { data: issues, refresh, status } = await useFetch<Array<Issue & { entity: Entity | null }>>('/api/issues')

const statusFilter = ref<string>()

const filteredIssues = computed(() => {
  if (!issues.value) return []
  if (!statusFilter.value) return issues.value
  return issues.value.filter(i => i.status === statusFilter.value)
})

const statusOptions = [
  { label: 'All', value: undefined },
  { label: 'Pending', value: 'pending' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Closed', value: 'closed' }
]
</script>

<template>
  <UContainer class="py-8">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          My Reports
        </h1>
        <p class="text-gray-500 mt-1">
          Track and manage your issue reports
        </p>
      </div>
      <UButton
        to="/issues/new"
        icon="i-lucide-plus"
        color="primary"
      >
        New Report
      </UButton>
    </div>

    <div class="mb-6">
      <UButtonGroup>
        <UButton
          v-for="opt in statusOptions"
          :key="opt.value || 'all'"
          :color="statusFilter === opt.value ? 'primary' : 'neutral'"
          :variant="statusFilter === opt.value ? 'solid' : 'outline'"
          size="sm"
          @click="statusFilter = opt.value"
        >
          {{ opt.label }}
        </UButton>
      </UButtonGroup>
    </div>

    <div v-if="status === 'pending'" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
    </div>

    <div v-else-if="!filteredIssues.length" class="text-center py-12">
      <UIcon name="i-lucide-inbox" class="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600" />
      <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">
        No reports yet
      </h3>
      <p class="mt-2 text-gray-500">
        Start by creating your first issue report
      </p>
      <UButton
        to="/issues/new"
        icon="i-lucide-plus"
        color="primary"
        class="mt-4"
      >
        Create Report
      </UButton>
    </div>

    <div v-else class="space-y-4">
      <IssueCard
        v-for="issue in filteredIssues"
        :key="issue.id"
        :issue="issue"
      />
    </div>
  </UContainer>
</template>
