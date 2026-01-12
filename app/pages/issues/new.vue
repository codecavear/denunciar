<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const router = useRouter()
const toast = useToast()

const isSubmitting = ref(false)
const isClassifying = ref(false)

const form = ref({
  title: '',
  description: '',
  image: null as { url: string; publicId: string } | null,
  latitude: null as number | null,
  longitude: null as number | null,
  address: null as string | null,
  entityId: null as string | null
})

const aiSuggestion = ref<{ entityId: string | null; confidence: number; reason: string } | null>(null)

async function classifyIssue() {
  if (!form.value.description) return

  isClassifying.value = true
  try {
    const result = await $fetch('/api/ai/classify', {
      method: 'POST',
      body: {
        description: form.value.description,
        imageUrl: form.value.image?.url
      }
    })
    aiSuggestion.value = result
  } catch (e) {
    console.error('Classification error:', e)
  } finally {
    isClassifying.value = false
  }
}

watch(() => form.value.description, (newDesc) => {
  if (newDesc && newDesc.length > 20) {
    classifyIssue()
  }
}, { debounce: 1000 } as any)

watch(() => form.value.image, () => {
  if (form.value.description && form.value.description.length > 20) {
    classifyIssue()
  }
})

async function submitForm() {
  if (!form.value.title || !form.value.description) {
    toast.add({ title: 'Please fill in title and description', color: 'error' })
    return
  }

  isSubmitting.value = true
  try {
    const issue = await $fetch('/api/issues', {
      method: 'POST',
      body: {
        title: form.value.title,
        description: form.value.description,
        imageUrl: form.value.image?.url,
        imagePublicId: form.value.image?.publicId,
        latitude: form.value.latitude,
        longitude: form.value.longitude,
        address: form.value.address,
        entityId: form.value.entityId,
        aiConfidence: aiSuggestion.value?.confidence
      }
    })

    toast.add({ title: 'Report created successfully', color: 'success' })
    router.push(`/issues/${issue.id}`)
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
      <UFormField label="Photo">
        <IssueImageUploader v-model="form.image" />
      </UFormField>

      <UFormField label="Title" required>
        <UInput
          v-model="form.title"
          placeholder="Brief title for the issue"
          size="lg"
        />
      </UFormField>

      <UFormField label="Description" required>
        <UTextarea
          v-model="form.description"
          placeholder="Describe the issue in detail..."
          :rows="4"
        />
      </UFormField>

      <UFormField label="Location">
        <IssueLocationPicker
          v-model:latitude="form.latitude"
          v-model:longitude="form.longitude"
          v-model:address="form.address"
        />
      </UFormField>

      <UFormField label="Department">
        <div class="relative">
          <IssueEntitySelector
            v-model="form.entityId"
            :ai-suggestion="aiSuggestion"
          />
          <div
            v-if="isClassifying"
            class="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <UIcon name="i-lucide-loader-2" class="w-4 h-4 animate-spin text-primary" />
          </div>
        </div>
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
