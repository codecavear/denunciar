<script setup lang="ts">
const props = defineProps<{
  initialLocation?: { lat: number; lng: number } | null
}>()

const emit = defineEmits<{
  close: [success: boolean, issue?: { id: string }]
}>()

const { t } = useI18n()
const toast = useToast()

const isSubmitting = ref(false)
const isClassifying = ref(false)

// Categories - hardcoded to avoid i18n hydration issues
const { categoryColors } = useMarkerIcon()
const categoryOptions = [
  { label: 'Bache', value: 'pothole' },
  { label: 'Basura', value: 'trash' },
  { label: 'Alumbrado', value: 'lighting' },
  { label: 'Seguridad', value: 'security' },
  { label: 'Arbolado', value: 'trees' },
  { label: 'Agua', value: 'water' },
  { label: 'Infraestructura', value: 'infrastructure' },
  { label: 'Otro', value: 'other' }
]

const form = ref({
  title: '',
  description: '',
  image: null as { url: string; publicId: string } | null,
  latitude: null as number | null,
  longitude: null as number | null,
  address: null as string | null,
  entityId: null as string | null,
  category: 'other' // Default
})

const aiSuggestion = ref<{ entityId: string | null; confidence: number; reason: string } | null>(null)

// Set initial location when provided
onMounted(() => {
  if (props.initialLocation) {
    form.value.latitude = props.initialLocation.lat
    form.value.longitude = props.initialLocation.lng
  }
})

async function classifyIssue() {
  if (!form.value.description) return

  isClassifying.value = true
  try {
    const result = await $fetch<{ entityId: string | null; confidence: number; reason: string }>('/api/ai/classify', {
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
    toast.add({ title: t('issue.fillRequired'), color: 'error' })
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
        category: form.value.category,
        aiConfidence: aiSuggestion.value?.confidence
      }
    })

    toast.add({ title: t('issue.reportCreated'), color: 'success' })
    emit('close', true, issue)
  } catch (e) {
    toast.add({ title: t('issue.reportFailed'), color: 'error' })
    console.error(e)
  } finally {
    isSubmitting.value = false
  }
}

function close() {
  emit('close', false)
}
</script>

<template>
  <UModal
    :title="t('issue.reportAnIssue')"
    :close="{ onClick: close }"
    :ui="{ body: 'max-h-[70vh] overflow-y-auto' }"
  >
    <template #body>
      <form id="issue-form" class="space-y-4" @submit.prevent="submitForm">
        <UFormField :label="t('issue.photo')">
          <IssueImageUploader v-model="form.image" />
        </UFormField>

        <UFormField :label="t('issue.title')" required>
          <UInput
            v-model="form.title"
            :placeholder="t('issue.titlePlaceholder')"
            class="w-full"
          />
        </UFormField>

        <UFormField :label="t('issue.description')" required>
          <UTextarea
            v-model="form.description"
            :placeholder="t('issue.descriptionPlaceholder')"
            :rows="3"
            class="w-full"
          />
        </UFormField>

        <UFormField :label="t('issue.category')" required>
          <select
            v-model="form.category"
            class="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option v-for="cat in categoryOptions" :key="cat.value" :value="cat.value">
              {{ cat.label }}
            </option>
          </select>
        </UFormField>

        <UFormField :label="t('issue.location')">
          <IssueLocationPicker
            v-model:latitude="form.latitude"
            v-model:longitude="form.longitude"
            v-model:address="form.address"
          />
        </UFormField>

        <!-- Department Hidden as per user request -->
        <div class="hidden">
           <UFormField :label="t('issue.department')">
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
        </div>
      </form>
    </template>

    <template #footer>
      <UButton
        color="neutral"
        variant="outline"
        @click="close"
      >
        {{ t('common.cancel') }}
      </UButton>
      <UButton
        color="primary"
        :loading="isSubmitting"
        class="flex-1"
        @click="submitForm"
      >
        {{ t('issue.submitReport') }}
      </UButton>
    </template>
  </UModal>
</template>
