<script setup lang="ts">
type BadgeColor = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'
type Status = 'pending' | 'in_progress' | 'resolved' | 'closed'

const props = defineProps<{
  status: Status
}>()

const statusConfig: Record<Status, { color: BadgeColor; label: string; icon: string }> = {
  pending: { color: 'warning', label: 'Pending', icon: 'i-lucide-clock' },
  in_progress: { color: 'info', label: 'In Progress', icon: 'i-lucide-loader-2' },
  resolved: { color: 'success', label: 'Resolved', icon: 'i-lucide-check-circle' },
  closed: { color: 'neutral', label: 'Closed', icon: 'i-lucide-x-circle' }
}

const currentConfig = computed(() => statusConfig[props.status])
</script>

<template>
  <UBadge
    :color="currentConfig.color"
    variant="subtle"
  >
    <UIcon :name="currentConfig.icon" class="w-3 h-3 mr-1" />
    {{ currentConfig.label }}
  </UBadge>
</template>
