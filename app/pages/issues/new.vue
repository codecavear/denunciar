<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
  middleware: 'auth'
})

const { t } = useI18n()
const router = useRouter()
const toast = useToast()

const isSubmitting = ref(false)

const issueSchema = z.object({
  title: z.string().min(1, t('validation.titleRequired')).max(200),
  description: z.string().min(1, t('validation.descriptionRequired')).max(2000),
  image: z.object({ url: z.string(), publicId: z.string() }).nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  address: z.string().nullable().optional(),
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
  category: 'other'
})

async function onSubmit(event: FormSubmitEvent<IssueSchema>) {
  isSubmitting.value = true
  try {
    const issue = await $fetch<{ id: string }>('/api/issues', {
      method: 'POST',
      body: {
        title: event.data.title,
        description: event.data.description,
        imageUrl: event.data.image?.url,
        imagePublicId: event.data.image?.publicId,
        latitude: event.data.latitude,
        longitude: event.data.longitude,
        address: event.data.address,
        category: event.data.category
      }
    })

    toast.add({ title: t('issue.reportCreated'), color: 'success' })
    if (issue?.id) {
      router.push(`/issues/${issue.id}`)
    }
  } catch (e) {
    toast.add({ title: t('issue.reportFailed'), color: 'error' })
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
        {{ t('nav.dashboard') }}
      </NuxtLink>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white mt-4">
        {{ t('issue.reportAnIssue') }}
      </h1>
      <p class="text-gray-500 mt-1">
        {{ t('issue.helpCommunity') }}
      </p>
    </div>

    <UForm :schema="issueSchema" :state="state" class="space-y-6" @submit="onSubmit">
      <UFormField :label="t('issue.category')" name="category">
        <IssueCategorySelector v-model="state.category" />
      </UFormField>

      <UFormField :label="t('issue.photo')" name="image">
        <IssueImageUploader v-model="state.image" />
      </UFormField>

      <UFormField :label="t('issue.title')" name="title" required>
        <UInput
          v-model="state.title"
          :placeholder="t('issue.titlePlaceholder')"
          size="lg"
        />
      </UFormField>

      <UFormField :label="t('issue.description')" name="description" required>
        <UTextarea
          v-model="state.description"
          :placeholder="t('issue.descriptionPlaceholder')"
          :rows="3"
        />
      </UFormField>

      <UFormField :label="t('issue.location')" name="address">
        <IssueLocationPicker
          v-model:latitude="state.latitude"
          v-model:longitude="state.longitude"
          v-model:address="state.address"
        />
      </UFormField>

      <div class="flex gap-3 pt-4">
        <UButton
          type="button"
          color="neutral"
          variant="outline"
          to="/dashboard"
        >
          {{ t('common.cancel') }}
        </UButton>
        <UButton
          type="submit"
          color="primary"
          :loading="isSubmitting"
          class="flex-1"
        >
          {{ t('issue.submitReport') }}
        </UButton>
      </div>
    </UForm>
  </UContainer>
</template>
