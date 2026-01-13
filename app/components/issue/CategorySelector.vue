<script setup lang="ts">
const props = defineProps<{
  modelValue?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const categories = [
  { value: 'pothole', label: 'Pothole', icon: 'i-lucide-alert-triangle', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/30', border: 'border-orange-200 dark:border-orange-800' },
  { value: 'trash', label: 'Trash', icon: 'i-lucide-trash-2', color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-900', border: 'border-gray-200 dark:border-gray-800' },
  { value: 'lighting', label: 'Lighting', icon: 'i-lucide-lightbulb', color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-950/30', border: 'border-yellow-200 dark:border-yellow-800' },
  { value: 'safety', label: 'Safety', icon: 'i-lucide-shield-alert', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-200 dark:border-red-800' },
  { value: 'water', label: 'Water Leak', icon: 'i-lucide-droplets', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-800' },
  { value: 'infrastructure', label: 'Infra', icon: 'i-lucide-construction', color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800' },
  { value: 'other', label: 'Other', icon: 'i-lucide-help-circle', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/30', border: 'border-purple-200 dark:border-purple-800' }
]

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
