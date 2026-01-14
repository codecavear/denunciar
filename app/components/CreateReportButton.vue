<script setup lang="ts">
import { LazyIssueCreateModal } from '#components'

const props = defineProps<{
  variant?: 'default' | 'map'
}>()

const emit = defineEmits<{
  created: []
}>()

const { t } = useI18n()
const overlay = useOverlay()
const issueModal = overlay.create(LazyIssueCreateModal)

async function openCreateModal() {
  const result = await issueModal.open({}).result
  if (result) {
    emit('created')
  }
}
</script>

<template>
  <UButton
    icon="i-lucide-plus"
    :size="variant === 'map' ? 'lg' : 'md'"
    color="primary"
    :class="variant === 'map' ? 'shadow-lg' : ''"
    @click="openCreateModal"
  >
    {{ t('map.createReport') }}
  </UButton>
</template>
