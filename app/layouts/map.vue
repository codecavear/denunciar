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
  <div class="h-screen w-screen flex flex-col">
    <!-- Minimal floating header -->
    <div class="absolute top-0 left-0 right-0 z-50 pointer-events-none">
      <div class="flex items-center justify-between p-4">
        <NuxtLink
          to="/"
          class="pointer-events-auto flex items-center gap-3 px-4 py-2 bg-white dark:bg-gray-900 rounded-lg shadow-lg w-[160px]"
        >
          <UIcon
            name="i-lucide-megaphone"
            class="w-5 h-5 text-primary"
          />
          <span class="font-bold">Denunciar</span>
        </NuxtLink>

        <div class="pointer-events-auto flex items-center gap-2 bg-white dark:bg-gray-900 rounded-lg shadow-lg p-1">
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
        </div>
      </div>
    </div>

    <!-- Full screen content -->
    <div class="flex-1 relative">
      <slot />
    </div>
  </div>
</template>
