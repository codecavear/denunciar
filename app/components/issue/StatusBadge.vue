<script setup lang="ts">
defineProps<{
  status: 'pending' | 'in_progress' | 'resolved' | 'closed'
}>()

const statusConfig: Record<string, { color: string; label: string; icon: string }> = {
  pending: { color: 'warning', label: 'Pending', icon: 'i-lucide-clock' },
  in_progress: { color: 'info', label: 'In Progress', icon: 'i-lucide-loader-2' },
  resolved: { color: 'success', label: 'Resolved', icon: 'i-lucide-check-circle' },
  closed: { color: 'neutral', label: 'Closed', icon: 'i-lucide-x-circle' }
}
</script>

<template>
  <UBadge
    :color="statusConfig[status].color"
    variant="subtle"
  >
    <UIcon :name="statusConfig[status].icon" class="w-3 h-3 mr-1" />
    {{ statusConfig[status].label }}
  </UBadge>
</template>
