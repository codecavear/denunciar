const isOpen = ref(false)
const initialLocation = ref<{ lat: number; lng: number } | null>(null)

export const useIssueModal = () => {
  function open(location?: { lat: number; lng: number }) {
    initialLocation.value = location || null
    isOpen.value = true
  }

  function close() {
    isOpen.value = false
    initialLocation.value = null
  }

  return {
    isOpen,
    initialLocation,
    open,
    close
  }
}
