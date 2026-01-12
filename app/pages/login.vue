<script setup lang="ts">
const { t } = useI18n()
const { loggedIn } = useUserSession()
const route = useRoute()

definePageMeta({
  layout: 'auth'
})

useSeoMeta({
  title: 'Login',
  description: 'Login to your account to continue'
})

// Store redirect URL in cookie for OAuth callback to use
const authRedirectCookie = useCookie('auth_redirect', {
  maxAge: 60 * 5, // 5 minutes
  path: '/',
  sameSite: 'lax',
})

// Set redirect cookie immediately if present in query
const redirectParam = route.query.redirect as string | undefined
if (redirectParam) {
  authRedirectCookie.value = redirectParam
}

// Redirect logged-in users
if (loggedIn.value) {
  // If there's a pending redirect, honor it
  if (authRedirectCookie.value) {
    const redirectTo = authRedirectCookie.value
    authRedirectCookie.value = null
    navigateTo(redirectTo)
  }
  else {
    navigateTo('/')
  }
}

const providers = [{
  label: t('auth.continueGoogle'),
  icon: 'i-simple-icons-google',
  to: '/auth/google',
  external: true,
}]
</script>

<template>
  <UAuthForm
    :providers="providers"
    :title="t('auth.welcomeBack')"
    icon="i-lucide-lock"
  >
    <template #description>
      {{ t('auth.signInAccess') }}
    </template>

    <template #footer>
      {{ t('auth.agreementText') }}
    </template>
  </UAuthForm>
</template>
