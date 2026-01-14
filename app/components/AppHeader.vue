<script setup lang="ts">
const { locale, locales, setLocale } = useI18n()

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
        Reportar
        <ArgentinaFlag />
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

      <UserMenu />
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

      <UserMenu />
    </template>
  </UHeader>
</template>
