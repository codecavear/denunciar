<script setup lang="ts">
import type { Entity } from '#shared/types'

const props = defineProps<{
  modelValue?: string | null
  aiSuggestion?: { entityId: string | null; confidence: number; reason: string } | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
}>()

const { data: entities } = await useFetch<Entity[]>('/api/entities')

const selected = computed({
  get: () => props.modelValue ?? undefined,
  set: (value: string | null | undefined) => emit('update:modelValue', value ?? null)
})

const options = computed(() => {
  if (!entities.value) return []
  return entities.value.map(e => ({
    label: e.name,
    value: e.id
  }))
})

const suggestedEntity = computed(() => {
  if (!props.aiSuggestion?.entityId || !entities.value) return null
  return entities.value.find(e => e.id === props.aiSuggestion?.entityId)
})

function acceptSuggestion() {
  if (props.aiSuggestion?.entityId) {
    emit('update:modelValue', props.aiSuggestion.entityId)
  }
}
</script>

<template>
  <div class="space-y-2">
    <USelectMenu
      v-model="selected"
      :items="options"
      placeholder="Select department"
      value-key="value"
      option-key="value"
      class="w-full"
    />

    <div
      v-if="aiSuggestion && suggestedEntity && aiSuggestion.entityId !== modelValue"
      class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
    >
      <div class="flex items-start gap-2">
        <UIcon name="i-lucide-sparkles" class="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-blue-700 dark:text-blue-300">
            AI Suggestion: {{ suggestedEntity.name }}
          </p>
          <p class="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
            {{ aiSuggestion.reason }}
          </p>
          <p class="text-xs text-blue-500 dark:text-blue-500 mt-1">
            Confidence: {{ Math.round(aiSuggestion.confidence * 100) }}%
          </p>
        </div>
        <UButton
          size="xs"
          color="primary"
          variant="soft"
          @click="acceptSuggestion"
        >
          Accept
        </UButton>
      </div>
    </div>
  </div>
</template>
