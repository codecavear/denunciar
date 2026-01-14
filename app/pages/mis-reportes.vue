<script setup lang="ts">
import type { Issue, Entity } from '#shared/types'

definePageMeta({
  middleware: 'auth'
})

const { t } = useI18n()

useSeoMeta({
  title: () => t('dashboard.title')
})

const { data: issues, refresh, status } = await useFetch<Array<Issue & { entity: Entity | null }>>('/api/issues')

const statusFilter = ref<string>()

const filteredIssues = computed(() => {
  if (!issues.value) return []
  if (!statusFilter.value) return issues.value
  return issues.value.filter(i => i.status === statusFilter.value)
})

const statusOptions = computed(() => [
  { label: t('dashboard.all'), value: undefined },
  { label: t('status.pending'), value: 'pending' },
  { label: t('status.in_progress'), value: 'in_progress' },
  { label: t('status.resolved'), value: 'resolved' },
  { label: t('status.closed'), value: 'closed' }
])
</script>

<template>
  <UContainer class="py-8">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ t('dashboard.title') }}
        </h1>
        <p class="text-gray-500 mt-1">
          {{ t('dashboard.subtitle') }}
        </p>
      </div>
      <CreateReportButton @created="refresh" />
    </div>

    <div class="mb-6">
      <div class="flex flex-wrap gap-2">
        <UButton
          v-for="opt in statusOptions"
          :key="opt.value || 'all'"
          :color="statusFilter === opt.value ? 'primary' : 'neutral'"
          :variant="statusFilter === opt.value ? 'soft' : 'ghost'"
          size="sm"
          class="rounded-full px-4"
          @click="statusFilter = opt.value"
        >
          {{ opt.label }}
        </UButton>
      </div>
    </div>

    <div v-if="status === 'pending'" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
    </div>

    <div v-else-if="!filteredIssues.length" class="text-center py-12">
      <UIcon name="i-lucide-inbox" class="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600" />
      <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">
        {{ t('dashboard.noReports') }}
      </h3>
      <p class="mt-2 text-gray-500">
        {{ t('dashboard.noReportsDescription') }}
      </p>
      <CreateReportButton class="mt-4" @created="refresh" />
    </div>

    <div v-else class="flex flex-col gap-4">
      <IssueCard
        v-for="issue in filteredIssues"
        :key="issue.id"
        :issue="issue"
      />
    </div>
  </UContainer>
</template>
