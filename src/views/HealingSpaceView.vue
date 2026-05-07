<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import BodyCanvas from '@/components/healing/BodyCanvas.vue'
import { useChatStore } from '@/stores/chat'
import { useHealingStore } from '@/stores/healing'
import { usePlayerStore } from '@/stores/player'
import { HEALING_ORGANS } from '@/types/healing'
import type { Message } from '@/types/message'
import { createId } from '@/utils/id'
import { sleep } from '@/utils/time'

const router = useRouter()
const chatStore = useChatStore()
const healingStore = useHealingStore()
const playerStore = usePlayerStore()
const isCompleted = ref(false)
const isExiting = ref(false)

const currentOrgan = computed(() => HEALING_ORGANS.find((organ) => organ.organ === healingStore.currentOrgan) ?? HEALING_ORGANS[0])
const trackTitle = computed(() => playerStore.currentTrack?.title ?? '疗愈音乐准备中')
const trackArtist = computed(() => playerStore.currentTrack?.artist ?? 'momo 陪你慢慢听')
const progressMax = computed(() => Math.max(playerStore.duration, playerStore.progress, 1))
const progressPercent = computed(() => `${Math.min((playerStore.progress / progressMax.value) * 100, 100)}%`)

function formatTime(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds))
  const mins = Math.floor(safeSeconds / 60)
  const secs = safeSeconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

async function leaveHealingSpace(options: { completeSession?: boolean } = {}): Promise<void> {
  if (isExiting.value) {
    return
  }

  isExiting.value = true
  healingStore.closeImmersive()
  if (options.completeSession) {
    healingStore.complete()
    playerStore.endHealingSession()
  }
  await router.push('/')
}

async function showCompletionText(): Promise<void> {
  if (isCompleted.value) {
    return
  }

  isCompleted.value = true
  const completedWuxing = currentOrgan.value.wuxing
  await sleep(5000)
  await leaveHealingSpace({ completeSession: true })
  const message: Message = {
    id: createId('momo'),
    role: 'momo',
    type: 'text',
    content: '感觉怎么样？好一些了吗？',
    timestamp: Date.now(),
    meta: {
      emotionDetected: 'neutral',
      emotionTag: completedWuxing
    }
  }
  await chatStore.appendMessage(message)
}

watch(
  () => playerStore.currentTrack?.wuxingTag,
  (wuxing) => {
    if (wuxing && healingStore.isActive) {
      healingStore.switchWuxing(wuxing)
    }
  },
  { immediate: true }
)

watch(
  () => playerStore.isPlaylistEnd,
  (ended) => {
    if (ended && healingStore.isActive) {
      void showCompletionText()
    }
  }
)

onMounted(() => {
  document.body.dataset.scene = 'healing'
  healingStore.openImmersive()
})

onUnmounted(() => {
  healingStore.closeImmersive()
})
</script>

<template>
  <main class="healing-space" :class="[healingStore.activeWuxingClass, { 'is-completed': isCompleted }]">
    <div class="healing-space__aura" aria-hidden="true" />

    <section class="healing-space__shell">
      <header class="healing-space__header">
        <div>
          <p class="healing-space__eyebrow">SoulEcho</p>
          <h1 class="healing-space__title">疗愈空间 · {{ currentOrgan.label }}</h1>
        </div>
        <button class="healing-space__exit" type="button" @click="leaveHealingSpace({ completeSession: true })">退出</button>
      </header>

      <div class="healing-space__canvas-wrap">
        <BodyCanvas :current-organ="healingStore.currentOrgan" :is-active="healingStore.isActive" />
      </div>

      <section class="healing-space__player" aria-label="当前疗愈音乐">
        <div class="healing-space__track">
          <span class="healing-space__organ-dot" aria-hidden="true" />
          <div>
            <h2>{{ trackTitle }}</h2>
            <p>{{ trackArtist }}</p>
          </div>
        </div>

        <div class="healing-space__progress">
          <span>{{ formatTime(playerStore.progress) }}</span>
          <div class="healing-space__bar" aria-hidden="true">
            <span :style="{ width: progressPercent }" />
          </div>
          <span>{{ formatTime(progressMax) }}</span>
        </div>
      </section>
    </section>

    <Transition name="healing-complete">
      <aside v-if="isCompleted" class="healing-space__completion" role="status" aria-live="polite">
        <strong>疗愈完成</strong>
        <span>这段音乐已经走完了，先让身体停在现在这个比较松的位置。</span>
      </aside>
    </Transition>
  </main>
</template>

<style scoped>
.healing-space {
  --organ-color: var(--color-wood);
  --organ-glow-color: var(--color-wood-glow);
  position: relative;
  display: grid;
  min-height: 100vh;
  min-height: 100dvh;
  place-items: center;
  overflow: hidden;
  padding: var(--space-xl);
  background: var(--bg-gradient);
  color: var(--text-primary);
}

.healing-space.is-fire {
  --organ-color: var(--color-fire);
  --organ-glow-color: var(--color-fire-glow);
}

.healing-space.is-earth {
  --organ-color: var(--color-earth);
  --organ-glow-color: var(--color-earth-glow);
}

.healing-space.is-metal {
  --organ-color: var(--color-metal);
  --organ-glow-color: var(--color-metal-glow);
}

.healing-space.is-water {
  --organ-color: var(--color-water);
  --organ-glow-color: var(--color-water-glow);
}

.healing-space__aura {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(115deg, transparent 12%, color-mix(in srgb, var(--organ-glow-color) 18%, transparent) 34%, transparent 58%),
    linear-gradient(245deg, transparent 14%, color-mix(in srgb, var(--text-primary) 10%, transparent) 46%, transparent 72%),
    radial-gradient(circle at 50% 42%, color-mix(in srgb, var(--organ-color) 26%, transparent) 0%, transparent 30%),
    radial-gradient(circle at 50% 52%, color-mix(in srgb, var(--organ-glow-color) 18%, transparent) 0%, transparent 38%);
  background-position:
    0% 50%,
    100% 50%,
    50% 42%,
    50% 52%;
  background-size:
    180% 180%,
    170% 170%,
    100% 100%,
    100% 100%;
  opacity: 0.86;
  pointer-events: none;
  transform: scale(1.05);
  animation: healing-aura-flow 16s var(--ease-breath) infinite alternate;
}

.healing-space__shell,
.healing-space__completion {
  position: relative;
  z-index: 10;
}

.healing-space__shell {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  gap: var(--space-md);
  width: min(100%, 58rem);
  height: calc(100vh - var(--space-xl) * 2);
  min-height: 38rem;
  margin: 0 auto;
}

.healing-space__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  min-height: 5.25rem;
}

.healing-space__eyebrow,
.healing-space__title,
.healing-space__track h2,
.healing-space__track p,
.healing-space__completion strong,
.healing-space__completion span {
  margin: 0;
}

.healing-space__eyebrow {
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 800;
}

.healing-space__title {
  margin-top: var(--space-xs);
  color: var(--text-primary);
  font-size: clamp(1.75rem, 3vw, 2.35rem);
  letter-spacing: 0;
  line-height: 1.2;
}

.healing-space__exit {
  min-width: 5rem;
  min-height: 2.75rem;
  padding: 0 var(--space-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  background: var(--bg-card);
  color: var(--text-primary);
  cursor: pointer;
  font-weight: 900;
  box-shadow: var(--shadow-card);
  backdrop-filter: var(--blur-card);
  transition:
    background var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-out);
}

.healing-space__exit:hover {
  background: color-mix(in srgb, var(--organ-color) 24%, var(--bg-card));
  transform: translateY(-1px);
}

.healing-space__canvas-wrap {
  position: relative;
  display: grid;
  min-height: 0;
  place-items: center;
  overflow: visible;
}

.healing-space__player {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(14rem, 24rem);
  gap: var(--space-md);
  align-items: center;
  width: 100%;
  margin: 0;
  padding: var(--space-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--bg-card);
  box-shadow: var(--shadow-card);
  backdrop-filter: var(--blur-card);
}

.healing-space__track {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  min-width: 0;
}

.healing-space__organ-dot {
  width: 1.15rem;
  aspect-ratio: 1;
  flex: 0 0 auto;
  border-radius: var(--radius-pill);
  background: var(--organ-color);
  box-shadow: 0 0 1rem var(--organ-glow-color);
}

.healing-space__track h2 {
  overflow: hidden;
  color: var(--text-primary);
  font-size: 1rem;
  font-weight: 900;
  letter-spacing: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.healing-space__track p {
  overflow: hidden;
  margin-top: 0.15rem;
  color: var(--text-secondary);
  font-size: 0.86rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.healing-space__progress {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: var(--space-sm);
  align-items: center;
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
  font-weight: 800;
}

.healing-space__bar {
  overflow: hidden;
  height: 0.45rem;
  border-radius: var(--radius-pill);
  background: color-mix(in srgb, var(--text-tertiary) 24%, transparent);
}

.healing-space__bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--organ-color);
  box-shadow: 0 0 0.8rem var(--organ-glow-color);
  transition: width var(--duration-normal) var(--ease-out);
}

.healing-space__completion {
  position: absolute;
  left: 50%;
  top: 50%;
  display: grid;
  width: min(28rem, calc(100vw - var(--space-xl) * 2));
  gap: var(--space-sm);
  padding: var(--space-lg);
  border: 1px solid color-mix(in srgb, var(--organ-color) 52%, var(--color-border));
  border-radius: var(--radius-xl);
  background: var(--bg-card);
  text-align: center;
  box-shadow: var(--shadow-card);
  backdrop-filter: var(--blur-card);
  transform: translate(-50%, -50%);
}

.healing-space__completion strong {
  color: var(--text-primary);
  font-size: 1.35rem;
}

.healing-space__completion span {
  color: var(--text-secondary);
  line-height: 1.7;
}

.healing-complete-enter-active,
.healing-complete-leave-active {
  transition:
    opacity var(--duration-fade) var(--ease-out),
    transform var(--duration-fade) var(--ease-out);
}

.healing-complete-enter-from,
.healing-complete-leave-to {
  opacity: 0;
  transform: translate(-50%, calc(-50% + 0.75rem));
}

@keyframes healing-aura-flow {
  0% {
    background-position:
      0% 44%,
      100% 56%,
      48% 40%,
      52% 54%;
    opacity: 0.76;
    transform: scale(1.04) translate3d(-0.8rem, 0.3rem, 0);
  }

  50% {
    background-position:
      52% 50%,
      44% 50%,
      52% 42%,
      48% 50%;
    opacity: 0.96;
    transform: scale(1.08) translate3d(0.6rem, -0.4rem, 0);
  }

  100% {
    background-position:
      100% 56%,
      0% 44%,
      50% 44%,
      50% 50%;
    opacity: 0.82;
    transform: scale(1.05) translate3d(0.9rem, 0.5rem, 0);
  }
}

@media (max-width: 760px) {
  .healing-space {
    padding: var(--space-md);
  }

  .healing-space__shell {
    width: 100%;
    height: calc(100vh - var(--space-md) * 2);
    min-height: 0;
  }

  .healing-space__header {
    align-items: flex-start;
  }

  .healing-space__player {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .healing-space__exit,
  .healing-space__bar span,
  .healing-space__aura,
  .healing-complete-enter-active,
  .healing-complete-leave-active {
    animation: none;
    transition: none;
  }
}
</style>
