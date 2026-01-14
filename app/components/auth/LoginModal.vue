<script setup lang="ts">
const emit = defineEmits<{
  close: [success: boolean]
}>()

const { t } = useI18n()
const { loggedIn } = useUserSession()

function loginWithGoogle() {
  window.location.href = '/auth/google'
}

const providers = [{
  label: t('auth.continueGoogle'),
  icon: 'i-simple-icons-google',
  onClick: loginWithGoogle
}]

function close() {
  emit('close', false)
}

// Auto-close if user is already logged in
watchEffect(() => {
  if (loggedIn.value) {
    emit('close', true)
  }
})
</script>

<template>
  <UModal
    :title="t('auth.welcomeBack')"
    :close="{ onClick: close }"
    :ui="{ body: 'text-center' }"
  >
    <template #body>
      <div class="flex flex-col items-center gap-4">
        <UIcon name="i-lucide-megaphone" class="w-12 h-12 text-primary" />
        <p class="text-muted">
          {{ t('auth.signInAccess') }}
        </p>
        <UButton
          v-for="provider in providers"
          :key="provider.label"
          :icon="provider.icon"
          color="neutral"
          variant="subtle"
          block
          size="lg"
          @click="provider.onClick"
        >
          {{ provider.label }}
        </UButton>
      </div>
    </template>

    <template #footer>
      <p class="text-xs text-muted text-center w-full">
        {{ t('auth.agreementText') }}
      </p>
    </template>
  </UModal>
</template>
