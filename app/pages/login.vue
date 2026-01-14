<script setup lang="ts">
const { t } = useI18n()
const { loggedIn } = useUserSession()

definePageMeta({
  layout: 'auth'
})

useSeoMeta({
  title: () => t('seo.login')
})

watchEffect(() => {
  if (loggedIn.value) {
    navigateTo('/mapa')
  }
})

function loginWithGoogle() {
  window.location.href = '/auth/google'
}

const providers = [{
  label: t('auth.continueGoogle'),
  icon: 'i-simple-icons-google',
  onClick: loginWithGoogle
}]
</script>

<template>
  <UAuthForm
    :providers="providers"
    :title="t('auth.welcomeBack')"
    icon="i-lucide-megaphone"
  >
    <template #description>
      {{ t('auth.signInAccess') }}
    </template>

    <template #footer>
      {{ t('auth.agreementText') }}
    </template>
  </UAuthForm>
</template>
