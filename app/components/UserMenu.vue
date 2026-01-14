<script setup lang="ts">
import { LazyAuthLoginModal } from '#components'

const { t } = useI18n()
const { loggedIn, user, clear } = useUserSession()
const overlay = useOverlay()
const loginModal = overlay.create(LazyAuthLoginModal)

const profileItems = computed(() => [
  [{
    label: t('nav.map'),
    icon: 'i-lucide-map',
    to: '/map'
  },
  {
    label: t('nav.myReports'),
    icon: 'i-lucide-file-text',
    to: '/mis-reportes'
  },
  {
    label: t('nav.profile'),
    icon: 'i-lucide-user',
    to: '/profile'
  }],
  [{
    label: t('nav.logout'),
    icon: 'i-lucide-log-out',
    onSelect: logout
  }]
])

async function openLogin() {
  await loginModal.open({}).result
}

async function logout() {
  await clear()
  navigateTo('/')
}
</script>

<template>
  <UDropdownMenu v-if="loggedIn" :items="profileItems">
    <UAvatar
      :src="user?.avatarUrl"
      :alt="user?.name"
      size="sm"
      class="cursor-pointer"
    />
  </UDropdownMenu>

  <UButton
    v-else
    icon="i-lucide-log-in"
    color="primary"
    size="sm"
    @click="openLogin"
  />
</template>
