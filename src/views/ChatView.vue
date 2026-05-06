<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'

import MessageBubble from '@/components/chat/MessageBubble.vue'
import MessageInput from '@/components/chat/MessageInput.vue'
import PlayerBar from '@/components/player/PlayerBar.vue'
import { useChat } from '@/composables/useChat'
import { usePlayerStore } from '@/stores/player'

const { chatStore } = useChat()
const playerStore = usePlayerStore()
const messageListRef = ref<HTMLElement | null>(null)

async function scrollToBottom(): Promise<void> {
  await nextTick()
  if (messageListRef.value) {
    messageListRef.value.scrollTop = messageListRef.value.scrollHeight
  }
}

async function handleSubmit(): Promise<void> {
  await chatStore.sendMessage(chatStore.inputText)
  await scrollToBottom()
}

async function playDailyBgm(): Promise<void> {
  await playerStore.playPlaylistById('daily')
}

async function playNeteaseDemo(): Promise<void> {
  await playerStore.playNeteaseSearch('流水 龚一')
}

watch(
  () => [chatStore.orderedMessages.length, chatStore.isMomoTyping],
  async () => {
    await scrollToBottom()
  }
)

onMounted(() => {
  document.body.dataset.scene = 'chat'
})
</script>

<template>
  <main class="chat-view">
    <section class="chat-view__shell">
      <header class="chat-view__header">
        <div>
          <p class="chat-view__eyebrow">SoulEcho</p>
          <h1 class="chat-view__title">MOMO聊天室</h1>
        </div>
        <div class="chat-view__status" :class="{ 'is-typing': chatStore.isMomoTyping }">
          {{ chatStore.isMomoTyping ? '正在输入中...' : '在线陪伴中' }}
        </div>
      </header>

      <div ref="messageListRef" class="chat-view__messages">
        <MessageBubble v-for="message in chatStore.orderedMessages" :key="message.id" :message="message" />

        <div v-if="chatStore.isMomoTyping" class="chat-view__typing">
          <span />
          <span />
          <span />
        </div>
      </div>

      <MessageInput v-model="chatStore.inputText" :disabled="chatStore.isMomoTyping" @submit="handleSubmit" />
    </section>

    <div class="chat-view__music-demos" aria-label="播放器测试入口">
      <button class="chat-view__music-demo" type="button" @click="playDailyBgm">测试 YouTube 播放</button>
      <button class="chat-view__music-demo" type="button" @click="playNeteaseDemo">测试网易云播放</button>
    </div>
    <PlayerBar />
  </main>
</template>

<style scoped>
.chat-view {
  min-height: 100vh;
  padding: var(--space-xl);
  background: var(--chat-bg, linear-gradient(135deg, var(--bg-primary), var(--bg-secondary)));
  background-size: var(--chat-bg-size, auto);
  color: var(--text-primary);
}

.chat-view__shell {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  gap: var(--space-md);
  width: min(100%, 58rem);
  height: calc(100vh - var(--space-xl) * 2);
  margin: 0 auto;
  border: var(--chat-shell-border);
  border-radius: var(--chat-shell-radius);
  background: var(--chat-shell-bg);
  box-shadow: var(--chat-shell-shadow);
}

.chat-view__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  padding: var(--space-lg) 0 var(--space-sm);
}

.chat-view__eyebrow {
  margin: 0 0 var(--space-xs);
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 700;
}

.chat-view__title {
  margin: 0;
  font-family: var(--chat-title-font);
  font-size: 2.25rem;
  letter-spacing: var(--chat-title-spacing);
  line-height: 1.2;
  text-transform: var(--chat-title-transform);
}

.chat-view__status {
  padding: 0.5rem 0.875rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  background: var(--bg-card);
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 700;
  box-shadow: var(--shadow-card);
}

.chat-view__status.is-typing {
  color: var(--color-accent);
}

.chat-view__music-demos {
  position: fixed;
  right: calc(var(--space-lg) + 3.75rem);
  bottom: var(--space-lg);
  z-index: 29;
  display: flex;
  gap: var(--space-sm);
}

.chat-view__music-demo {
  min-height: 3rem;
  padding: 0 var(--space-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  background: var(--bg-card);
  color: var(--text-secondary);
  box-shadow: var(--shadow-card);
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 800;
  transition:
    background var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-out);
}

.chat-view__music-demo:hover {
  background: color-mix(in srgb, var(--color-primary) 32%, var(--bg-card));
  color: var(--text-primary);
  transform: translateY(-1px);
}

.chat-view__messages {
  display: flex;
  min-height: 0;
  flex-direction: column;
  gap: var(--chat-message-gap);
  overflow-y: auto;
  padding: var(--space-md) var(--space-xl) var(--space-lg);
  scroll-behavior: smooth;
  scrollbar-color: color-mix(in srgb, var(--color-accent) 34%, transparent) transparent;
  scrollbar-width: thin;
}

.chat-view__messages::-webkit-scrollbar {
  width: 0.5rem;
}

.chat-view__messages::-webkit-scrollbar-track {
  background: transparent;
}

.chat-view__messages::-webkit-scrollbar-thumb {
  border-radius: var(--radius-pill);
  background: color-mix(in srgb, var(--color-accent) 32%, transparent);
}

.chat-view__typing {
  display: flex;
  align-self: flex-start;
  gap: var(--space-xs);
  padding: 0.875rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  border-bottom-left-radius: var(--radius-sm);
  background: var(--bg-card);
  box-shadow: var(--shadow-card);
}

.chat-view__typing span {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: var(--radius-pill);
  background: var(--color-accent);
  animation: typing-pulse 1s var(--ease-out) infinite;
}

.chat-view__typing span:nth-child(2) {
  animation-delay: 120ms;
}

.chat-view__typing span:nth-child(3) {
  animation-delay: 240ms;
}

@keyframes typing-pulse {
  0%,
  100% {
    opacity: 0.35;
    transform: translateY(0);
  }

  50% {
    opacity: 1;
    transform: translateY(-3px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .chat-view__messages {
    scroll-behavior: auto;
  }

  .chat-view__music-demo {
    transition: none;
  }

  .chat-view__typing span {
    animation: none;
  }
}

@media (max-width: 640px) {
  .chat-view {
    padding: var(--space-md);
  }

  .chat-view__shell {
    height: calc(100vh - var(--space-md) * 2);
  }

  .chat-view__header {
    align-items: flex-start;
    flex-direction: column;
  }

  .chat-view__messages {
    padding-right: var(--space-xs);
    padding-left: var(--space-xs);
  }

  .chat-view__music-demo {
    padding: 0 var(--space-sm);
  }

  .chat-view__music-demos {
    right: calc(var(--space-md) + 3.5rem);
    bottom: var(--space-md);
    max-width: calc(100vw - 6rem);
    overflow-x: auto;
  }

  .chat-view__title {
    font-size: 1.75rem;
  }
}
</style>
