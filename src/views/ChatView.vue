<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import MessageBubble from '@/components/chat/MessageBubble.vue'
import MessageInput from '@/components/chat/MessageInput.vue'
import { useChat } from '@/composables/useChat'
import { useHealingStore } from '@/stores/healing'
import { usePlayerStore } from '@/stores/player'

const { chatStore } = useChat()
const router = useRouter()
const healingStore = useHealingStore()
const playerStore = usePlayerStore()
const messageListRef = ref<HTMLElement | null>(null)
const isHealingTestStarting = ref(false)
const healingButtonLabel = computed(() => (healingStore.isActive ? '进入疗愈空间' : '疗愈空间暂未开启'))

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

async function startHealingDemo(): Promise<void> {
  if (isHealingTestStarting.value) {
    return
  }

  isHealingTestStarting.value = true
  try {
    await playerStore.startHealingSession('wood')
  } finally {
    isHealingTestStarting.value = false
  }
}

async function openHealingSpace(): Promise<void> {
  if (!healingStore.isActive) {
    return
  }

  healingStore.openImmersive()
  await router.push('/healing')
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
        <div class="chat-view__header-actions">
          <RouterLink class="chat-view__garden-entry" to="/garden" aria-label="打开情绪花园" title="打开情绪花园">
            <svg class="chat-view__garden-glyph" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 20v-7" />
              <path d="M12 13c-3.2 0-5.4-2-6.2-5.8 3.9.1 6.2 2.1 6.2 5.8Z" />
              <path d="M12 13c3.2 0 5.4-2 6.2-5.8-3.9.1-6.2 2.1-6.2 5.8Z" />
              <path d="M8 20h8" />
            </svg>
          </RouterLink>
          <button
            class="chat-view__healing-entry"
            :class="{ 'is-active': healingStore.isActive }"
            type="button"
            :disabled="!healingStore.isActive"
            :aria-label="healingButtonLabel"
            :title="healingButtonLabel"
            @click="openHealingSpace"
          >
            <svg class="chat-view__healing-glyph" viewBox="0 0 24 24" aria-hidden="true">
              <path class="chat-view__healing-petal is-left" d="M11.8 18.5C8.3 17.8 5.8 15.4 5 12.2c3.2.2 5.7 2 6.8 6.3Z" />
              <path class="chat-view__healing-petal is-right" d="M12.2 18.5c3.5-.7 6-3.1 6.8-6.3-3.2.2-5.7 2-6.8 6.3Z" />
              <path class="chat-view__healing-petal is-center" d="M12 18.6c-2.5-2.4-2.7-6.4 0-10.1 2.7 3.7 2.5 7.7 0 10.1Z" />
              <path class="chat-view__healing-stem" d="M7.2 19.2h9.6" />
            </svg>
          </button>
          <div class="chat-view__status" :class="{ 'is-typing': chatStore.isMomoTyping }">
            {{ chatStore.isMomoTyping ? '正在输入中...' : '在线陪伴中' }}
          </div>
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
      <button class="chat-view__music-demo" type="button" :disabled="isHealingTestStarting" @click="startHealingDemo">
        {{ isHealingTestStarting ? '准备疗愈中' : '测试疗愈入口' }}
      </button>
    </div>
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

.chat-view__header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.chat-view__healing-entry {
  position: relative;
  display: grid;
  width: 2.75rem;
  min-width: 2.75rem;
  aspect-ratio: 1;
  place-items: center;
  border: 1px solid color-mix(in srgb, var(--text-tertiary) 32%, var(--color-border));
  border-radius: var(--radius-pill);
  background: color-mix(in srgb, var(--bg-card) 80%, var(--bg-primary));
  box-shadow: var(--shadow-card);
  cursor: not-allowed;
  opacity: 0.58;
  transition:
    border-color var(--duration-fast) var(--ease-out),
    opacity var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-out);
}

.chat-view__garden-entry {
  position: relative;
  display: grid;
  width: 2.75rem;
  min-width: 2.75rem;
  aspect-ratio: 1;
  place-items: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  background: color-mix(in srgb, var(--bg-card) 82%, var(--color-primary));
  box-shadow: var(--shadow-card);
  color: var(--text-secondary);
  text-decoration: none;
  transition:
    background var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-out);
}

.chat-view__garden-entry:hover {
  background: color-mix(in srgb, var(--color-primary) 36%, var(--bg-card));
  color: var(--text-primary);
  transform: scale(1.05);
}

.chat-view__garden-glyph {
  width: 1.4rem;
  height: 1.4rem;
  fill: color-mix(in srgb, currentColor 12%, transparent);
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.chat-view__healing-entry.is-active {
  border-color: color-mix(in srgb, var(--color-wood) 42%, var(--color-fire));
  cursor: pointer;
  opacity: 1;
  animation: healing-entry-pulse 2s var(--ease-breath) infinite;
}

.chat-view__healing-entry.is-active:hover {
  transform: scale(1.05);
}

.chat-view__healing-entry:disabled {
  pointer-events: none;
}

.chat-view__healing-glyph {
  width: 1.45rem;
  height: 1.45rem;
  overflow: visible;
  color: var(--text-tertiary);
  fill: color-mix(in srgb, currentColor 14%, transparent);
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition:
    color var(--duration-fast) var(--ease-out),
    filter var(--duration-fast) var(--ease-out);
}

.chat-view__healing-entry.is-active .chat-view__healing-glyph {
  filter: drop-shadow(0 0 0.45rem color-mix(in srgb, var(--color-accent) 42%, transparent));
}

.chat-view__healing-entry.is-active .chat-view__healing-petal.is-left {
  color: var(--color-wood);
}

.chat-view__healing-entry.is-active .chat-view__healing-petal.is-right {
  color: var(--color-water);
}

.chat-view__healing-entry.is-active .chat-view__healing-petal.is-center {
  color: var(--color-fire);
}

.chat-view__healing-entry.is-active .chat-view__healing-stem {
  color: var(--color-earth);
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

.chat-view__music-demo:disabled {
  cursor: wait;
  opacity: 0.68;
}

@keyframes healing-entry-pulse {
  0%,
  100% {
    box-shadow: var(--shadow-card);
  }

  50% {
    box-shadow:
      var(--shadow-card),
      0 0 1.2rem color-mix(in srgb, var(--color-accent) 28%, transparent);
  }
}

@media (prefers-reduced-motion: reduce) {
  .chat-view__messages {
    scroll-behavior: auto;
  }

  .chat-view__music-demo {
    transition: none;
  }

  .chat-view__garden-entry,
  .chat-view__healing-entry {
    animation: none;
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

  .chat-view__header-actions {
    width: 100%;
    justify-content: space-between;
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
