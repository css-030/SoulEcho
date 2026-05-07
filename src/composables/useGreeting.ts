import { useChatStore } from '@/stores/chat'

export function useGreeting() {
  const chatStore = useChatStore()

  async function greetOnAppOpen(): Promise<void> {
    await chatStore.greetIfNeeded()
  }

  return {
    greetOnAppOpen
  }
}
