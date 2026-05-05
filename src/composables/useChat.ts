import { onMounted } from 'vue'

import { useChatStore } from '@/stores/chat'

export function useChat() {
  const chatStore = useChatStore()

  onMounted(async () => {
    await chatStore.initialize()
    await chatStore.greetIfNeeded()
  })

  return {
    chatStore
  }
}
