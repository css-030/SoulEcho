import { computed } from 'vue'
import { useChatStore } from '@/stores/chat'

export function useChat() {
  const chatStore = useChatStore()
  const isReady = computed(() => chatStore.hasInitialized)

  return {
    chatStore,
    isReady
  }
}
