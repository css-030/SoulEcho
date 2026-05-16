import { onMounted } from 'vue'

import { useGreeting } from '@/composables/useGreeting'
import { useChatStore } from '@/stores/chat'

export function useChat() {
  const chatStore = useChatStore()
  const { greetOnAppOpen } = useGreeting()

  onMounted(async () => {
    await chatStore.initialize()
    await greetOnAppOpen()
  })

  return {
    chatStore
  }
}
