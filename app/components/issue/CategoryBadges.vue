<script setup lang="ts">
const props = defineProps<{
  modelValue?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { t } = useI18n()

const categories = computed(() => [
  { value: 'pothole', label: t('category.pothole'), icon: 'i-lucide-alert-triangle', color: 'orange' },
  { value: 'trash', label: t('category.trash'), icon: 'i-lucide-trash-2', color: 'lime' },
  { value: 'lighting', label: t('category.lighting'), icon: 'i-lucide-lightbulb', color: 'yellow' },
  { value: 'security', label: t('category.security'), icon: 'i-lucide-shield-alert', color: 'red' },
  { value: 'trees', label: t('category.trees'), icon: 'i-lucide-trees', color: 'green' },
  { value: 'water', label: t('category.water'), icon: 'i-lucide-droplets', color: 'sky' },
  { value: 'infrastructure', label: t('category.infrastructure'), icon: 'i-lucide-construction', color: 'slate' },
  { value: 'other', label: t('category.other'), icon: 'i-lucide-help-circle', color: 'gray' }
])

function select(value: string) {
  emit('update:modelValue', value)
}
</script>

<template>
  <div class="flex flex-wrap gap-2 mt-1">
    <button
      v-for="cat in categories"
      :key="cat.value"
      type="button"
      class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border"
      :class="[
        modelValue === cat.value
          ? 'bg-primary-500 text-white border-primary-500 shadow-sm'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
      ]"
      @click="select(cat.value)"
    >
      <UIcon :name="cat.icon" class="w-4 h-4" />
      <span>{{ cat.label }}</span>
    </button>
  </div>
</template>
