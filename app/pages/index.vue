<script setup lang="ts">
// Redirect to map as the default view
definePageMeta({
  layout: 'map'
})

const router = useRouter()

onMounted(() => {
  router.replace('/map')
})
</script>

<template>
  <div class="flex items-center justify-center h-screen">
    <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
  </div>
</template>
