<script setup lang="ts">
import type { Entity } from '#shared/types'

definePageMeta({
  middleware: 'auth'
})

const { t } = useI18n()
const toast = useToast()

const { data: entities, refresh } = await useFetch<Entity[]>('/api/entities')

const isModalOpen = ref(false)
const editingEntity = ref<Entity | null>(null)
const isSaving = ref(false)

const form = ref({
  name: '',
  description: '',
  keywords: [] as string[],
  icon: 'i-lucide-alert-circle',
  contactEmail: '',
  isActive: true
})

const iconOptions = [
  { label: 'Water', value: 'i-lucide-droplets', icon: 'i-lucide-droplets' },
  { label: 'Road', value: 'i-lucide-road', icon: 'i-lucide-road' },
  { label: 'Light', value: 'i-lucide-lightbulb', icon: 'i-lucide-lightbulb' },
  { label: 'Trash', value: 'i-lucide-trash-2', icon: 'i-lucide-trash-2' },
  { label: 'Trees', value: 'i-lucide-trees', icon: 'i-lucide-trees' },
  { label: 'Safety', value: 'i-lucide-shield-alert', icon: 'i-lucide-shield-alert' },
  { label: 'Building', value: 'i-lucide-building', icon: 'i-lucide-building' },
  { label: 'Alert', value: 'i-lucide-alert-circle', icon: 'i-lucide-alert-circle' },
  { label: 'Zap', value: 'i-lucide-zap', icon: 'i-lucide-zap' },
  { label: 'Flame', value: 'i-lucide-flame', icon: 'i-lucide-flame' },
  { label: 'Car', value: 'i-lucide-car', icon: 'i-lucide-car' },
  { label: 'Bus', value: 'i-lucide-bus', icon: 'i-lucide-bus' }
]

const newKeyword = ref('')

function openCreateModal() {
  editingEntity.value = null
  form.value = {
    name: '',
    description: '',
    keywords: [],
    icon: 'i-lucide-alert-circle',
    contactEmail: '',
    isActive: true
  }
  isModalOpen.value = true
}

function openEditModal(entity: Entity) {
  editingEntity.value = entity
  form.value = {
    name: entity.name,
    description: entity.description || '',
    keywords: entity.keywords || [],
    icon: entity.icon || 'i-lucide-alert-circle',
    contactEmail: entity.contactEmail || '',
    isActive: entity.isActive
  }
  isModalOpen.value = true
}

function addKeyword() {
  if (newKeyword.value && !form.value.keywords.includes(newKeyword.value)) {
    form.value.keywords.push(newKeyword.value)
    newKeyword.value = ''
  }
}

function removeKeyword(keyword: string) {
  form.value.keywords = form.value.keywords.filter(k => k !== keyword)
}

async function saveEntity() {
  if (!form.value.name) {
    toast.add({ title: t('entities.nameRequired'), color: 'error' })
    return
  }

  isSaving.value = true
  try {
    if (editingEntity.value) {
      await $fetch(`/api/entities/${editingEntity.value.id}`, {
        method: 'PUT',
        body: form.value
      })
      toast.add({ title: t('entities.entityUpdated'), color: 'success' })
    } else {
      await $fetch('/api/entities', {
        method: 'POST',
        body: form.value
      })
      toast.add({ title: t('entities.entityCreated'), color: 'success' })
    }
    await refresh()
    isModalOpen.value = false
  } catch (e) {
    toast.add({ title: t('entities.entityFailed'), color: 'error' })
    console.error(e)
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <UContainer class="py-8">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ t('entities.title') }}
        </h1>
        <p class="text-gray-500 mt-1">
          {{ t('entities.subtitle') }}
        </p>
      </div>
      <UButton
        icon="i-lucide-plus"
        color="primary"
        @click="openCreateModal"
      >
        {{ t('entities.addDepartment') }}
      </UButton>
    </div>

    <div v-if="!entities?.length" class="text-center py-12">
      <UIcon name="i-lucide-building-2" class="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600" />
      <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">
        {{ t('entities.noDepartments') }}
      </h3>
      <p class="mt-2 text-gray-500">
        {{ t('entities.createToRoute') }}
      </p>
      <UButton
        icon="i-lucide-plus"
        color="primary"
        class="mt-4"
        @click="openCreateModal"
      >
        {{ t('entities.addDepartment') }}
      </UButton>
    </div>

    <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <UCard
        v-for="entity in entities"
        :key="entity.id"
        class="cursor-pointer hover:shadow-md transition-shadow"
        @click="openEditModal(entity)"
      >
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <UIcon :name="entity.icon || 'i-lucide-alert-circle'" class="w-5 h-5 text-primary" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <h3 class="font-medium text-gray-900 dark:text-white truncate">
                {{ entity.name }}
              </h3>
              <UBadge
                :color="entity.isActive ? 'success' : 'neutral'"
                variant="subtle"
                size="xs"
              >
                {{ entity.isActive ? t('entities.active') : t('entities.inactive') }}
              </UBadge>
            </div>
            <p v-if="entity.description" class="text-sm text-gray-500 mt-1 line-clamp-2">
              {{ entity.description }}
            </p>
          </div>
          <UIcon name="i-lucide-chevron-right" class="w-5 h-5 text-gray-400 flex-shrink-0" />
        </div>

        <div v-if="entity.keywords?.length" class="flex flex-wrap gap-1 mt-3">
          <UBadge
            v-for="keyword in entity.keywords.slice(0, 3)"
            :key="keyword"
            color="neutral"
            variant="subtle"
            size="xs"
          >
            {{ keyword }}
          </UBadge>
          <UBadge
            v-if="entity.keywords.length > 3"
            color="neutral"
            variant="subtle"
            size="xs"
          >
            +{{ entity.keywords.length - 3 }}
          </UBadge>
        </div>
      </UCard>
    </div>

    <UModal
      v-model:open="isModalOpen"
      :title="editingEntity ? t('entities.editDepartment') : t('entities.newDepartment')"
      :ui="{ footer: 'justify-end' }"
    >
      <span class="hidden" />

      <template #body>
        <form id="entity-form" class="space-y-4" @submit.prevent="saveEntity">
          <UFormField :label="t('entities.name')" required>
            <UInput
              v-model="form.name"
              :placeholder="t('entities.namePlaceholder')"
            />
          </UFormField>

          <UFormField :label="t('entities.icon')">
            <div class="flex flex-wrap gap-2">
              <button
                v-for="opt in iconOptions"
                :key="opt.value"
                type="button"
                class="w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
                :class="form.icon === opt.value ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'"
                @click="form.icon = opt.value"
              >
                <UIcon :name="opt.icon" class="w-5 h-5" />
              </button>
            </div>
          </UFormField>

          <UFormField :label="t('issue.description')">
            <UTextarea
              v-model="form.description"
              :rows="2"
            />
          </UFormField>

          <UFormField :label="t('entities.keywords')">
            <div class="space-y-2">
              <div class="flex gap-2">
                <UInput
                  v-model="newKeyword"
                  :placeholder="t('entities.addKeyword')"
                  class="flex-1"
                  @keyup.enter.prevent="addKeyword"
                />
                <UButton
                  type="button"
                  icon="i-lucide-plus"
                  color="neutral"
                  @click="addKeyword"
                />
              </div>
              <div v-if="form.keywords.length" class="flex flex-wrap gap-1">
                <UBadge
                  v-for="keyword in form.keywords"
                  :key="keyword"
                  color="primary"
                  variant="subtle"
                  class="cursor-pointer"
                  @click="removeKeyword(keyword)"
                >
                  {{ keyword }}
                  <UIcon name="i-lucide-x" class="w-3 h-3 ml-1" />
                </UBadge>
              </div>
            </div>
          </UFormField>

          <UFormField :label="t('entities.contactEmail')">
            <UInput
              v-model="form.contactEmail"
              type="email"
              :placeholder="t('entities.emailPlaceholder')"
            />
          </UFormField>

          <UFormField>
            <UCheckbox
              v-model="form.isActive"
              :label="t('entities.active')"
              :description="t('entities.activeDescription')"
            />
          </UFormField>
        </form>
      </template>

      <template #footer>
        <UButton
          color="neutral"
          variant="outline"
          @click="isModalOpen = false"
        >
          {{ t('common.cancel') }}
        </UButton>
        <UButton
          type="submit"
          form="entity-form"
          color="primary"
          :loading="isSaving"
        >
          {{ editingEntity ? t('common.update') : t('common.create') }}
        </UButton>
      </template>
    </UModal>
  </UContainer>
</template>
