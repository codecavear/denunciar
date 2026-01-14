<script setup lang="ts">
import type { Issue, Entity } from '#shared/types'
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
  middleware: 'auth'
})

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const toast = useToast()

const issueId = route.params.id as string
const isEditing = ref(false)
const isSaving = ref(false)

const { data: issue, refresh } = await useFetch<Issue & { entity: Entity | null }>(`/api/issues/${issueId}`)

const editSchema = z.object({
  title: z.string().min(1, t('validation.titleRequired')).max(200),
  description: z.string().min(1, t('validation.descriptionRequired')).max(2000),
  status: z.enum(['pending', 'in_progress', 'resolved', 'closed'])
})

type EditSchema = z.output<typeof editSchema>

const editState = reactive<Partial<EditSchema>>({
  title: '',
  description: '',
  status: 'pending'
})

function startEditing() {
  if (!issue.value) return
  Object.assign(editState, {
    title: issue.value.title,
    description: issue.value.description,
    status: issue.value.status
  })
  isEditing.value = true
}

function cancelEditing() {
  isEditing.value = false
}

async function onSubmit(event: FormSubmitEvent<EditSchema>) {
  isSaving.value = true
  try {
    await $fetch(`/api/issues/${issueId}`, {
      // @ts-expect-error - Nuxt typed routes restricts method types incorrectly
      method: 'PUT',
      body: event.data
    })
    await refresh()
    isEditing.value = false
    toast.add({ title: t('issue.changesSaved'), color: 'success' })
  } catch (e) {
    toast.add({ title: t('issue.saveFailed'), color: 'error' })
    console.error(e)
  } finally {
    isSaving.value = false
  }
}

const statusOptions = [
  { label: 'Pending', value: 'pending' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Closed', value: 'closed' }
]

type BadgeColor = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'

const statusColors: Record<string, BadgeColor> = {
  pending: 'warning',
  in_progress: 'info',
  resolved: 'success',
  closed: 'neutral'
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<template>
  <UContainer class="py-8 max-w-3xl">
    <div class="mb-6">
      <NuxtLink
        to="/mis-denuncias"
        class="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1"
      >
        <UIcon name="i-lucide-arrow-left" class="w-4 h-4" />
        {{ t('nav.dashboard') }}
      </NuxtLink>
    </div>

    <div v-if="!issue" class="text-center py-12">
      <UIcon name="i-lucide-alert-circle" class="w-12 h-12 mx-auto text-gray-400" />
      <p class="mt-4 text-gray-500">{{ t('issue.notFound') }}</p>
    </div>

    <div v-else>
      <div v-if="issue.imageUrl" class="mb-6">
        <img
          :src="issue.imageUrl"
          :alt="issue.title"
          class="w-full max-h-96 object-cover rounded-lg"
        >
      </div>

      <UForm v-if="isEditing" :schema="editSchema" :state="editState" @submit="onSubmit">
        <div class="flex items-start justify-between gap-4 mb-6">
          <div class="flex-1">
            <UFormField name="title">
              <UInput
                v-model="editState.title"
                size="lg"
                class="text-xl font-bold"
              />
            </UFormField>
          </div>

          <div class="flex items-center gap-2">
            <UFormField name="status">
              <USelectMenu
                v-model="editState.status"
                :items="statusOptions"
                value-key="value"
              />
            </UFormField>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div v-if="issue.entity" class="flex items-center gap-2 text-gray-500">
            <UIcon name="i-lucide-building-2" class="w-4 h-4" />
            <span>{{ issue.entity.name }}</span>
          </div>
          <div v-if="issue.address" class="flex items-center gap-2 text-gray-500">
            <UIcon name="i-lucide-map-pin" class="w-4 h-4" />
            <span>{{ issue.address }}</span>
          </div>
          <div class="flex items-center gap-2 text-gray-500">
            <UIcon name="i-lucide-calendar" class="w-4 h-4" />
            <span>{{ t('issue.created') }} {{ formatDate(issue.createdAt) }}</span>
          </div>
          <div v-if="issue.aiConfidence" class="flex items-center gap-2 text-gray-500">
            <UIcon name="i-lucide-sparkles" class="w-4 h-4" />
            <span>{{ t('issue.aiConfidence') }}: {{ Math.round(Number(issue.aiConfidence) * 100) }}%</span>
          </div>
        </div>

        <UCard class="mb-6">
          <template #header>
            <h2 class="font-medium">{{ t('issue.description') }}</h2>
          </template>

          <UFormField name="description">
            <UTextarea
              v-model="editState.description"
              :rows="4"
            />
          </UFormField>
        </UCard>

        <div
          v-if="issue.latitude && issue.longitude"
          class="mb-6"
        >
          <h2 class="font-medium mb-3">{{ t('issue.location') }}</h2>
          <div class="h-64 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
            <IssueLocationPicker
              :latitude="Number(issue.latitude)"
              :longitude="Number(issue.longitude)"
              :address="issue.address"
            />
          </div>
        </div>

        <div class="flex gap-3">
          <UButton
            type="button"
            color="neutral"
            variant="outline"
            @click="cancelEditing"
          >
            {{ t('common.cancel') }}
          </UButton>
          <UButton
            type="submit"
            color="primary"
            :loading="isSaving"
          >
            {{ t('common.save') }}
          </UButton>
        </div>
      </UForm>

      <template v-else>
        <div class="flex items-start justify-between gap-4 mb-6">
          <div class="flex-1">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ issue.title }}
            </h1>
          </div>

          <div class="flex items-center gap-2">
            <UBadge :color="statusColors[issue?.status ?? 'pending']" size="lg">
              {{ statusOptions.find(s => s.value === issue?.status)?.label }}
            </UBadge>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div v-if="issue.entity" class="flex items-center gap-2 text-gray-500">
            <UIcon name="i-lucide-building-2" class="w-4 h-4" />
            <span>{{ issue.entity.name }}</span>
          </div>
          <div v-if="issue.address" class="flex items-center gap-2 text-gray-500">
            <UIcon name="i-lucide-map-pin" class="w-4 h-4" />
            <span>{{ issue.address }}</span>
          </div>
          <div class="flex items-center gap-2 text-gray-500">
            <UIcon name="i-lucide-calendar" class="w-4 h-4" />
            <span>{{ t('issue.created') }} {{ formatDate(issue.createdAt) }}</span>
          </div>
          <div v-if="issue.aiConfidence" class="flex items-center gap-2 text-gray-500">
            <UIcon name="i-lucide-sparkles" class="w-4 h-4" />
            <span>{{ t('issue.aiConfidence') }}: {{ Math.round(Number(issue.aiConfidence) * 100) }}%</span>
          </div>
        </div>

        <UCard class="mb-6">
          <template #header>
            <h2 class="font-medium">{{ t('issue.description') }}</h2>
          </template>

          <p class="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {{ issue.description }}
          </p>
        </UCard>

        <div
          v-if="issue.latitude && issue.longitude"
          class="mb-6"
        >
          <h2 class="font-medium mb-3">{{ t('issue.location') }}</h2>
          <div class="h-64 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
            <IssueLocationPicker
              :latitude="Number(issue.latitude)"
              :longitude="Number(issue.longitude)"
              :address="issue.address"
            />
          </div>
        </div>

        <div class="flex gap-3">
          <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide-pencil"
            @click="startEditing"
          >
            {{ t('common.edit') }}
          </UButton>
        </div>
      </template>
    </div>
  </UContainer>
</template>
