<script setup lang="ts">
import { LazyAuthLoginModal } from '#components'

const { t, locale, locales, setLocale } = useI18n()
const { loggedIn, user, clear } = useUserSession()
const overlay = useOverlay()
const loginModal = overlay.create(LazyAuthLoginModal)

const localeItems = computed(() => {
  return (locales.value as Array<{ code: string; name: string }>).map(l => ({
    label: l.name,
    onSelect: () => setLocale(l.code as 'en' | 'es')
  }))
})

const profileItems = computed(() => [
  [{
    label: t('nav.myReports'),
    icon: 'i-lucide-file-text',
    to: '/mis-denuncias'
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
  <UHeader>
    <template #left>
      <NuxtLink
        to="/"
        class="flex items-center gap-2 text-xl font-bold"
      >
        <UIcon
          name="i-lucide-megaphone"
          class="w-6 h-6 text-primary"
        />
        Denunciar
      </NuxtLink>
    </template>

    <template #right>
      <UDropdownMenu :items="[localeItems]">
        <UButton
          icon="i-lucide-globe"
          color="neutral"
          variant="ghost"
          size="sm"
        />
      </UDropdownMenu>

      <UColorModeButton />

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

    <template #body>
      <div class="flex items-center gap-2 mb-4">
        <UButton
          v-for="l in (locales as Array<{ code: string; name: string }>)"
          :key="l.code"
          :label="l.name"
          :color="locale === l.code ? 'primary' : 'neutral'"
          :variant="locale === l.code ? 'solid' : 'ghost'"
          size="sm"
          @click="setLocale(l.code as 'en' | 'es')"
        />
      </div>

      <UButton
        v-if="!loggedIn"
        :label="t('nav.getStarted')"
        color="primary"
        block
        @click="openLogin"
      />
    </template>
  </UHeader>
</template>
