<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

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

const issueSchema = z.object({
  title: z.string().min(1, t('validation.titleRequired')).max(200),
  description: z.string().min(1, t('validation.descriptionRequired')).max(2000),
  image: z.object({ url: z.string(), publicId: z.string() }).nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  address: z.string().nullable().optional(),
  entityId: z.string().nullable().optional(),
  category: z.enum(['pothole', 'trash', 'lighting', 'security', 'trees', 'water', 'infrastructure', 'other'])
})

type IssueSchema = z.output<typeof issueSchema>

const state = reactive<Partial<IssueSchema>>({
  title: '',
  description: '',
  image: null,
  latitude: null,
  longitude: null,
  address: null,
  entityId: null,
  category: 'other'
})

const aiSuggestion = ref<{ entityId: string | null; confidence: number; reason: string } | null>(null)

// Set initial location when provided
onMounted(() => {
  if (props.initialLocation) {
    state.latitude = props.initialLocation.lat
    state.longitude = props.initialLocation.lng
  }
})

async function classifyIssue() {
  if (!state.description) return

  isClassifying.value = true
  try {
    const result = await $fetch<{ entityId: string | null; confidence: number; reason: string }>('/api/ai/classify', {
      method: 'POST',
      body: {
        description: state.description,
        imageUrl: state.image?.url
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
watch(() => state.description, (newDesc) => {
  if (classifyTimeout) clearTimeout(classifyTimeout)
  if (newDesc && newDesc.length > 20) {
    classifyTimeout = setTimeout(classifyIssue, 1000)
  }
})

watch(() => state.image, () => {
  if (state.description && state.description.length > 20) {
    classifyIssue()
  }
})

async function onSubmit(event: FormSubmitEvent<IssueSchema>) {
  isSubmitting.value = true
  try {
    const issue = await $fetch('/api/issues', {
      method: 'POST',
      body: {
        title: event.data.title,
        description: event.data.description,
        imageUrl: event.data.image?.url,
        imagePublicId: event.data.image?.publicId,
        latitude: event.data.latitude,
        longitude: event.data.longitude,
        address: event.data.address,
        entityId: event.data.entityId,
        category: event.data.category,
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
      <UForm id="issue-form" :schema="issueSchema" :state="state" class="space-y-4" @submit="onSubmit">
        <UFormField :label="t('issue.photo')" name="image">
          <IssueImageUploader v-model="state.image" />
        </UFormField>

        <UFormField :label="t('issue.title')" name="title" required>
          <UInput
            v-model="state.title"
            :placeholder="t('issue.titlePlaceholder')"
            class="w-full"
          />
        </UFormField>

        <UFormField :label="t('issue.description')" name="description" required>
          <UTextarea
            v-model="state.description"
            :placeholder="t('issue.descriptionPlaceholder')"
            :rows="3"
            class="w-full"
          />
        </UFormField>

        <UFormField :label="t('issue.category')" name="category" required>
          <USelectMenu
            v-model="state.category"
            :items="categoryOptions"
            value-key="value"
            class="w-full"
          />
        </UFormField>

        <UFormField :label="t('issue.location')" name="address">
          <IssueLocationPicker
            v-model:latitude="state.latitude"
            v-model:longitude="state.longitude"
            v-model:address="state.address"
          />
        </UFormField>

        <!-- Department Hidden as per user request -->
        <div class="hidden">
           <UFormField :label="t('issue.department')" name="entityId">
            <div class="relative">
              <IssueEntitySelector
                v-model="state.entityId"
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
      </UForm>
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
        type="submit"
        form="issue-form"
        color="primary"
        :loading="isSubmitting"
        class="flex-1"
      >
        {{ t('issue.submitReport') }}
      </UButton>
    </template>
  </UModal>
</template>
