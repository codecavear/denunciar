<script setup lang="ts">
import CategorySelector from '~/components/issue/CategorySelector.vue'

definePageMeta({
  middleware: 'auth'
})

const router = useRouter()
const toast = useToast()

const isSubmitting = ref(false)

const form = ref({
  title: '',
  description: '',
  image: null as { url: string; publicId: string } | null,
  latitude: null as number | null,
  longitude: null as number | null,
  address: null as string | null,
  category: 'other' // Default category
})

async function submitForm() {
  if (!form.value.title || !form.value.description) {
    toast.add({ title: 'Please fill in title and description', color: 'error' })
    return
  }

  isSubmitting.value = true
  try {
    const issue = await $fetch<{ id: string }>('/api/issues', {
      method: 'POST',
      body: {
        title: form.value.title,
        description: form.value.description,
        imageUrl: form.value.image?.url,
        imagePublicId: form.value.image?.publicId,
        latitude: form.value.latitude,
        longitude: form.value.longitude,
        address: form.value.address,
        category: form.value.category,
        // Entity ID & AI Confidence removed for now - logic moved to Categories
      }
    })

    toast.add({ title: 'Report created successfully', color: 'success' })
    if (issue?.id) {
      router.push(`/issues/${issue.id}`)
    }
  } catch (e) {
    toast.add({ title: 'Failed to create report', color: 'error' })
    console.error(e)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <UContainer class="py-8 max-w-2xl">
    <div class="mb-8">
      <NuxtLink
        to="/dashboard"
        class="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1"
      >
        <UIcon name="i-lucide-arrow-left" class="w-4 h-4" />
        Back to Dashboard
      </NuxtLink>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white mt-4">
        Report an Issue
      </h1>
      <p class="text-gray-500 mt-1">
        Help improve your community by reporting problems
      </p>
    </div>

    <form class="space-y-6" @submit.prevent="submitForm">
      <UFormField label="What are you reporting?">
        <CategorySelector v-model="form.category" />
      </UFormField>

      <UFormField label="Photo">
        <IssueImageUploader v-model="form.image" />
      </UFormField>

      <UFormField label="Title" required>
        <UInput
          v-model="form.title"
          placeholder="Brief title (e.g., Deep Pothole)"
          size="lg"
        />
      </UFormField>

      <UFormField label="Description" required>
        <UTextarea
          v-model="form.description"
          placeholder="Describe the issue... (e.g. huge pothole on the right lane)"
          :rows="3"
        />
      </UFormField>

      <UFormField label="Location">
        <IssueLocationPicker
          v-model:latitude="form.latitude"
          v-model:longitude="form.longitude"
          v-model:address="form.address"
        />
      </UFormField>

      <div class="flex gap-3 pt-4">
        <UButton
          type="button"
          color="neutral"
          variant="outline"
          to="/dashboard"
        >
          Cancel
        </UButton>
        <UButton
          type="submit"
          color="primary"
          :loading="isSubmitting"
          class="flex-1"
        >
          Submit Report
        </UButton>
      </div>
    </form>
  </UContainer>
</template>
