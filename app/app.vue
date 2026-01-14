<script setup lang="ts">
const { locale, t } = useI18n()
const colorMode = useColorMode()

const color = computed(() => colorMode.value === 'dark' ? '#020618' : 'white')

useHead({
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { key: 'theme-color', name: 'theme-color', content: color }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: locale
  }
})

useSeoMeta({
  titleTemplate: 'Reportar - %s',
  ogSiteName: 'Reportar',
  twitterCard: 'summary_large_image',
  description: () => t('home.seo.description'),
  ogDescription: () => t('home.seo.description')
})

// Content navigation and search removed - @nuxt/content not installed
const navigation = ref<any[]>([])
const files = ref<any[]>([])

const links = [{
  label: 'Docs',
  icon: 'i-lucide-book',
  to: '/docs/getting-started'
}, {
  label: 'Pricing',
  icon: 'i-lucide-credit-card',
  to: '/pricing'
}, {
  label: 'Blog',
  icon: 'i-lucide-pencil',
  to: '/blog'
}, {
  label: 'Changelog',
  icon: 'i-lucide-history',
  to: '/changelog'
}]

provide('navigation', navigation)
</script>

<template>
  <UApp>
    <NuxtLoadingIndicator />

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>


  </UApp>
</template>
