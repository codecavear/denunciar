<script setup lang="ts">
const { t } = useI18n()

const columns = [{
  label: 'Resources',
  children: [{
    label: t('nav.docs'),
    to: '/docs'
  }, {
    label: t('nav.pricing'),
    to: '/pricing'
  }, {
    label: t('nav.blog'),
    to: '/blog'
  }]
}]
</script>

<template>
  <USeparator class="h-px" />

  <UFooter>
    <template #left>
      <p class="text-muted text-sm">
        Built by <a
          href="https://github.com/codecavear"
          target="_blank"
          class="text-primary hover:underline"
        >CodeCave</a> · {{ new Date().getFullYear() }}
      </p>
    </template>

    <template #right>
      <UButton
        to="https://github.com/codecavear/nuxt-fs-template"
        target="_blank"
        icon="i-simple-icons-github"
        aria-label="GitHub"
        color="neutral"
        variant="ghost"
      />
    </template>
  </UFooter>
</template>
