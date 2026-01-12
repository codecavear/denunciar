<script setup lang="ts">
const { t } = useI18n()

useSeoMeta({
  titleTemplate: '',
  title: t('home.seo.title'),
  ogTitle: t('home.seo.title'),
  description: t('home.seo.description'),
  ogDescription: t('home.seo.description')
})

const heroLinks = computed(() => [
  {
    label: t('home.hero.getStarted'),
    icon: 'i-lucide-arrow-right',
    trailing: true,
    to: '/login',
    size: 'xl' as const
  }
])

const steps = computed(() => [
  {
    title: t('home.howItWorks.steps.report.title'),
    description: t('home.howItWorks.steps.report.description'),
    icon: 'i-lucide-camera'
  },
  {
    title: t('home.howItWorks.steps.ai.title'),
    description: t('home.howItWorks.steps.ai.description'),
    icon: 'i-lucide-sparkles'
  },
  {
    title: t('home.howItWorks.steps.track.title'),
    description: t('home.howItWorks.steps.track.description'),
    icon: 'i-lucide-check-circle'
  }
])

const featureItems = computed(() => [
  { title: t('home.features.photo.title'), description: t('home.features.photo.description'), icon: 'i-lucide-image' },
  { title: t('home.features.location.title'), description: t('home.features.location.description'), icon: 'i-lucide-map-pin' },
  { title: t('home.features.ai.title'), description: t('home.features.ai.description'), icon: 'i-lucide-brain' },
  { title: t('home.features.tracking.title'), description: t('home.features.tracking.description'), icon: 'i-lucide-activity' },
  { title: t('home.features.multilang.title'), description: t('home.features.multilang.description'), icon: 'i-lucide-globe' },
  { title: t('home.features.secure.title'), description: t('home.features.secure.description'), icon: 'i-lucide-shield-check' }
])

const ctaLinks = computed(() => [
  { label: t('home.cta.getStarted'), to: '/login', trailingIcon: 'i-lucide-arrow-right' }
])
</script>

<template>
  <div>
    <UPageHero
      :description="t('home.description')"
      :links="heroLinks"
    >
      <template #top>
        <HeroBackground />
      </template>

      <template #title>
        {{ t('home.title') }}<span class="text-primary">{{ t('home.titleHighlight') }}</span>
      </template>
    </UPageHero>

    <UPageSection
      :title="t('home.howItWorks.title')"
      :description="t('home.howItWorks.description')"
    >
      <UPageGrid>
        <UPageCard
          v-for="(step, index) in steps"
          :key="index"
          :title="step.title"
          :description="step.description"
          :icon="step.icon"
          spotlight
        />
      </UPageGrid>
    </UPageSection>

    <UPageSection
      :title="t('home.features.title')"
      :description="t('home.features.description')"
    >
      <UPageGrid>
        <UPageCard
          v-for="(item, index) in featureItems"
          :key="index"
          v-bind="item"
          spotlight
        />
      </UPageGrid>
    </UPageSection>

    <USeparator />

    <UPageCTA
      :title="t('home.cta.title')"
      :description="t('home.cta.description')"
      :links="ctaLinks"
      variant="naked"
      class="overflow-hidden"
    >
      <LazyStarsBg />
    </UPageCTA>
  </div>
</template>
