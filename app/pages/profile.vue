<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const { t } = useI18n()
const { user, clear } = useUserSession()

async function logout() {
  await clear()
  navigateTo('/')
}
</script>

<template>
  <UContainer class="py-8 max-w-2xl">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-8">
      {{ t('profile.title') }}
    </h1>

    <UCard>
      <div class="flex items-center gap-6">
        <UAvatar
          :src="user?.avatarUrl"
          :alt="user?.name"
          size="3xl"
        />
        <div class="flex-1">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            {{ user?.name }}
          </h2>
          <p class="text-gray-500 mt-1">
            {{ user?.email }}
          </p>
        </div>
      </div>
    </UCard>

    <UCard class="mt-6">
      <template #header>
        <h3 class="font-medium">{{ t('profile.account') }}</h3>
      </template>

      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium text-gray-900 dark:text-white">{{ t('profile.connectedWith') }}</p>
            <p class="text-sm text-gray-500">Google</p>
          </div>
          <UIcon name="i-simple-icons-google" class="w-6 h-6 text-gray-400" />
        </div>
      </div>
    </UCard>

    <UCard class="mt-6">
      <template #header>
        <h3 class="font-medium text-error">{{ t('profile.dangerZone') }}</h3>
      </template>

      <div class="flex items-center justify-between">
        <div>
          <p class="font-medium text-gray-900 dark:text-white">{{ t('profile.logout') }}</p>
          <p class="text-sm text-gray-500">{{ t('profile.logoutDescription') }}</p>
        </div>
        <UButton
          color="error"
          variant="soft"
          @click="logout"
        >
          {{ t('nav.logout') }}
        </UButton>
      </div>
    </UCard>
  </UContainer>
</template>
