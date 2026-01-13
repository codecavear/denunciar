<script setup lang="ts">
const props = defineProps<{
  modelValue?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { t } = useI18n()

const categories = computed(() => [
  { value: 'pothole', label: t('category.pothole'), icon: 'i-lucide-alert-triangle', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/30' },
  { value: 'trash', label: t('category.trash'), icon: 'i-lucide-trash-2', color: 'text-lime-500', bg: 'bg-lime-50 dark:bg-lime-950/30' },
  { value: 'lighting', label: t('category.lighting'), icon: 'i-lucide-lightbulb', color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-950/30' },
  { value: 'security', label: t('category.security'), icon: 'i-lucide-shield-alert', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/30' },
  { value: 'trees', label: t('category.trees'), icon: 'i-lucide-trees', color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950/30' },
  { value: 'water', label: t('category.water'), icon: 'i-lucide-droplets', color: 'text-sky-500', bg: 'bg-sky-50 dark:bg-sky-950/30' },
  { value: 'infrastructure', label: t('category.infrastructure'), icon: 'i-lucide-construction', color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-950/30' },
  { value: 'other', label: t('category.other'), icon: 'i-lucide-help-circle', color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-950/30' }
])

function select(value: string) {
  emit('update:modelValue', value)
}
</script>

<template>
  <div class="grid grid-cols-3 gap-3">
    <button
      v-for="cat in categories"
      :key="cat.value"
      type="button"
      class="flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-200 gap-2"
      :class="[
        modelValue === cat.value
          ? `border-primary-500 bg-primary-50 dark:bg-primary-950/30 dark:border-primary-500`
          : `${cat.bg} border-transparent hover:border-gray-200 dark:hover:border-gray-700`
      ]"
      @click="select(cat.value)"
    >
      <div 
        class="w-10 h-10 rounded-full flex items-center justify-center"
        :class="modelValue === cat.value ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400' : 'bg-white dark:bg-gray-800 shadow-sm ' + cat.color"
      >
        <UIcon :name="cat.icon" class="w-6 h-6" />
      </div>
      <span 
        class="text-xs font-medium"
        :class="modelValue === cat.value ? 'text-primary-700 dark:text-primary-300' : 'text-gray-600 dark:text-gray-300'"
      >
        {{ cat.label }}
      </span>
    </button>
  </div>
</template>
