<script setup lang="ts">
const props = defineProps<{
  open: boolean
  initialLocation?: { lat: number; lng: number } | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'created': [issue: { id: string }]
}>()

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

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

// Set initial location when provided
watch(() => props.initialLocation, (loc) => {
  if (loc) {
    form.value.latitude = loc.lat
    form.value.longitude = loc.lng
  }
}, { immediate: true })

// Reset form when modal opens
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    form.value = {
      title: '',
      description: '',
      image: null,
      latitude: props.initialLocation?.lat ?? null,
      longitude: props.initialLocation?.lng ?? null,
      address: null,
      entityId: null
    }
    aiSuggestion.value = null
  }
})

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

// Debounced classification
let classifyTimeout: ReturnType<typeof setTimeout> | null = null
watch(() => form.value.description, (newDesc) => {
  if (classifyTimeout) clearTimeout(classifyTimeout)
  if (newDesc && newDesc.length > 20) {
    classifyTimeout = setTimeout(classifyIssue, 1000)
  }
})

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
    emit('update:open', false)
    emit('created', issue)
  } catch (e) {
    toast.add({ title: 'Failed to create report', color: 'error' })
    console.error(e)
  } finally {
    isSubmitting.value = false
  }
}

function close() {
  emit('update:open', false)
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
  >
    <template #content>
      <UCard class="max-h-[90vh] overflow-y-auto">
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold">Report an Issue</h2>
            <UButton
              icon="i-lucide-x"
              color="neutral"
              variant="ghost"
              size="sm"
              @click="close"
            />
          </div>
        </template>

        <form class="space-y-4" @submit.prevent="submitForm">
          <UFormField label="Photo">
            <IssueImageUploader v-model="form.image" />
          </UFormField>

          <UFormField label="Title" required>
            <UInput
              v-model="form.title"
              placeholder="Brief title for the issue"
            />
          </UFormField>

          <UFormField label="Description" required>
            <UTextarea
              v-model="form.description"
              placeholder="Describe the issue in detail..."
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
              @click="close"
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
      </UCard>
    </template>
  </UModal>
</template>
