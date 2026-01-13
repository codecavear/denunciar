<script setup lang="ts">
const { t, locale, locales, setLocale } = useI18n()
const { loggedIn } = useUserSession()
const route = useRoute()

const items = computed(() => {
  const baseItems = [{
    label: 'Map',
    to: '/map',
    icon: 'i-lucide-map'
  }]

  if (loggedIn.value) {
    return [
      ...baseItems,
      {
        label: t('nav.dashboard'),
        to: '/dashboard',
        icon: 'i-lucide-layout-dashboard'
      },
      {
        label: t('nav.newIssue'),
        to: '/issues/new',
        icon: 'i-lucide-plus-circle'
      }
    ]
  }
  return baseItems
})

const localeItems = computed(() => {
  return (locales.value as Array<{ code: string; name: string }>).map(l => ({
    label: l.name,
    onSelect: () => setLocale(l.code as 'en' | 'es')
  }))
})
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

    <UNavigationMenu
      v-if="items.length"
      :items="items"
      variant="link"
    />

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

      <template v-if="loggedIn">
        <UButton
          icon="i-lucide-plus"
          color="primary"
          to="/issues/new"
          class="lg:hidden"
        />
        <UButton
          :label="t('nav.newIssue')"
          icon="i-lucide-plus"
          color="primary"
          to="/issues/new"
          class="hidden lg:inline-flex"
        />
      </template>
      <template v-else>
        <UButton
          icon="i-lucide-log-in"
          color="primary"
          variant="ghost"
          to="/login"
          class="lg:hidden"
        />
        <UButton
          :label="t('nav.getStarted')"
          color="primary"
          to="/login"
          class="hidden lg:inline-flex"
        />
      </template>
    </template>

    <template #body>
      <UNavigationMenu
        v-if="items.length"
        :items="items"
        orientation="vertical"
        class="-mx-2.5"
      />

      <USeparator class="my-6" />

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
        v-if="loggedIn"
        :label="t('nav.newIssue')"
        icon="i-lucide-plus"
        color="primary"
        to="/issues/new"
        block
      />
      <UButton
        v-else
        :label="t('nav.getStarted')"
        color="primary"
        to="/login"
        block
      />
    </template>
  </UHeader>
</template>
