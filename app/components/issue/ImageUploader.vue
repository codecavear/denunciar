<script setup lang="ts">
const props = defineProps<{
  modelValue?: { url: string; publicId: string } | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: { url: string; publicId: string } | null]
}>()

const fileInput = ref<HTMLInputElement>()
const isDragging = ref(false)
const isUploading = ref(false)
const error = ref<string>()

const preview = computed(() => props.modelValue?.url)

async function handleFiles(files: FileList | null) {
  if (!files || files.length === 0) return

  const file = files[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    error.value = 'Please select an image file'
    return
  }

  if (file.size > 10 * 1024 * 1024) {
    error.value = 'Image must be less than 10MB'
    return
  }

  error.value = undefined
  isUploading.value = true

  try {
    const formData = new FormData()
    formData.append('image', file)

    const result = await $fetch('/api/upload/image', {
      method: 'POST',
      body: formData
    })

    emit('update:modelValue', { url: result.url, publicId: result.publicId })
  } catch (e) {
    error.value = 'Failed to upload image'
    console.error(e)
  } finally {
    isUploading.value = false
  }
}

function handleDrop(e: DragEvent) {
  isDragging.value = false
  handleFiles(e.dataTransfer?.files || null)
}

function handleDragOver(e: DragEvent) {
  e.preventDefault()
  isDragging.value = true
}

function handleDragLeave() {
  isDragging.value = false
}

function triggerFileInput() {
  fileInput.value?.click()
}

function removeImage() {
  emit('update:modelValue', null)
}
</script>

<template>
  <div class="space-y-2">
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="hidden"
      @change="handleFiles(($event.target as HTMLInputElement).files)"
    >

    <div
      v-if="!preview"
      class="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors"
      :class="[
        isDragging ? 'border-primary bg-primary/5' : 'border-gray-300 dark:border-gray-600 hover:border-primary',
        isUploading ? 'opacity-50 pointer-events-none' : ''
      ]"
      @click="triggerFileInput"
      @drop.prevent="handleDrop"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
    >
      <UIcon
        v-if="isUploading"
        name="i-lucide-loader-2"
        class="w-12 h-12 mx-auto text-gray-400 animate-spin"
      />
      <UIcon
        v-else
        name="i-lucide-image-plus"
        class="w-12 h-12 mx-auto text-gray-400"
      />
      <p class="mt-2 text-sm text-gray-500">
        {{ isUploading ? 'Uploading...' : 'Click or drag an image here' }}
      </p>
      <p class="text-xs text-gray-400 mt-1">
        PNG, JPG, WebP up to 10MB
      </p>
    </div>

    <div v-else class="relative">
      <img
        :src="preview"
        alt="Preview"
        class="w-full max-h-64 object-cover rounded-lg"
      >
      <UButton
        icon="i-lucide-x"
        color="error"
        variant="solid"
        size="sm"
        class="absolute top-2 right-2"
        @click="removeImage"
      />
    </div>

    <p v-if="error" class="text-sm text-red-500">
      {{ error }}
    </p>
  </div>
</template>
