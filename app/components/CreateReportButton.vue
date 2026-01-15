<script setup lang="ts">
import { LazyIssueCreateModal, LazyAuthLoginModal } from '#components'

const props = defineProps<{
  variant?: 'default' | 'map'
}>()

const emit = defineEmits<{
  created: [issue?: any]
}>()

const { t } = useI18n()
const { loggedIn } = useUserSession()
const overlay = useOverlay()
const issueModal = overlay.create(LazyIssueCreateModal)
const loginModal = overlay.create(LazyAuthLoginModal)

async function openCreateModal() {
  if (!loggedIn.value) {
    await loginModal.open({}).result
    if (!loggedIn.value) return
  }

  const result = await issueModal.open({}).result as any
  if (result && result.success) {
    emit('created', result.issue)
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
