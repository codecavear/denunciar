<script setup lang="ts">
import type { Issue, Entity } from '~/server/database/schema'

definePageMeta({
  middleware: 'auth'
})

const route = useRoute()
const router = useRouter()
const toast = useToast()

const issueId = route.params.id as string
const isEditing = ref(false)
const isSaving = ref(false)

const { data: issue, refresh } = await useFetch<Issue & { entity: Entity | null }>(`/api/issues/${issueId}`)

const editForm = ref({
  title: '',
  description: '',
  status: '' as Issue['status']
})

function startEditing() {
  if (!issue.value) return
  editForm.value = {
    title: issue.value.title,
    description: issue.value.description,
    status: issue.value.status
  }
  isEditing.value = true
}

function cancelEditing() {
  isEditing.value = false
}

async function saveChanges() {
  isSaving.value = true
  try {
    await $fetch(`/api/issues/${issueId}`, {
      method: 'PUT',
      body: editForm.value
    })
    await refresh()
    isEditing.value = false
    toast.add({ title: 'Changes saved', color: 'success' })
  } catch (e) {
    toast.add({ title: 'Failed to save changes', color: 'error' })
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

const statusColors: Record<string, string> = {
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
        to="/dashboard"
        class="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1"
      >
        <UIcon name="i-lucide-arrow-left" class="w-4 h-4" />
        Back to Dashboard
      </NuxtLink>
    </div>

    <div v-if="!issue" class="text-center py-12">
      <UIcon name="i-lucide-alert-circle" class="w-12 h-12 mx-auto text-gray-400" />
      <p class="mt-4 text-gray-500">Issue not found</p>
    </div>

    <div v-else>
      <div v-if="issue.imageUrl" class="mb-6">
        <img
          :src="issue.imageUrl"
          :alt="issue.title"
          class="w-full max-h-96 object-cover rounded-lg"
        >
      </div>

      <div class="flex items-start justify-between gap-4 mb-6">
        <div class="flex-1">
          <template v-if="isEditing">
            <UInput
              v-model="editForm.title"
              size="lg"
              class="text-xl font-bold"
            />
          </template>
          <template v-else>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ issue.title }}
            </h1>
          </template>
        </div>

        <div class="flex items-center gap-2">
          <template v-if="isEditing">
            <USelectMenu
              v-model="editForm.status"
              :items="statusOptions"
              value-key="value"
              option-key="value"
            />
          </template>
          <template v-else>
            <UBadge :color="statusColors[issue.status]" size="lg">
              {{ statusOptions.find(s => s.value === issue.status)?.label }}
            </UBadge>
          </template>
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
          <span>Created {{ formatDate(issue.createdAt) }}</span>
        </div>
        <div v-if="issue.aiConfidence" class="flex items-center gap-2 text-gray-500">
          <UIcon name="i-lucide-sparkles" class="w-4 h-4" />
          <span>AI Confidence: {{ Math.round(Number(issue.aiConfidence) * 100) }}%</span>
        </div>
      </div>

      <UCard class="mb-6">
        <template #header>
          <h2 class="font-medium">Description</h2>
        </template>

        <template v-if="isEditing">
          <UTextarea
            v-model="editForm.description"
            :rows="4"
          />
        </template>
        <template v-else>
          <p class="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {{ issue.description }}
          </p>
        </template>
      </UCard>

      <div
        v-if="issue.latitude && issue.longitude"
        class="mb-6"
      >
        <h2 class="font-medium mb-3">Location</h2>
        <div class="h-64 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
          <IssueLocationPicker
            :latitude="Number(issue.latitude)"
            :longitude="Number(issue.longitude)"
            :address="issue.address"
          />
        </div>
      </div>

      <div class="flex gap-3">
        <template v-if="isEditing">
          <UButton
            color="neutral"
            variant="outline"
            @click="cancelEditing"
          >
            Cancel
          </UButton>
          <UButton
            color="primary"
            :loading="isSaving"
            @click="saveChanges"
          >
            Save Changes
          </UButton>
        </template>
        <template v-else>
          <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide-pencil"
            @click="startEditing"
          >
            Edit
          </UButton>
        </template>
      </div>
    </div>
  </UContainer>
</template>
