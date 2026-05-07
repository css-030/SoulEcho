<script setup lang="ts">
import { ref } from 'vue'

import { useChatStore } from '@/stores/chat'
import { usePlayerStore } from '@/stores/player'
import type { Message } from '@/types/message'

interface Props {
  trigger: NonNullable<Message['healingTrigger']>
  content: string
}

const props = defineProps<Props>()
const chatStore = useChatStore()
const playerStore = usePlayerStore()
const isDismissed = ref(false)
const isStarting = ref(false)
const hasResponded = ref(false)

async function handleStart(): Promise<void> {
  if (hasResponded.value) {
    return
  }

  hasResponded.value = true
  isStarting.value = true
  try {
    await playerStore.startHealingSession(
      props.trigger.targetWuxing,
      props.trigger.testContext
        ? {
            now: new Date(props.trigger.testContext.now),
            weather: props.trigger.testContext.weather
          }
        : undefined
    )
    await chatStore.respondToHealingInvite('start', props.trigger.targetWuxing)
  } finally {
    isStarting.value = false
  }
}

async function handleLater(): Promise<void> {
  if (hasResponded.value) {
    return
  }

  hasResponded.value = true
  isDismissed.value = true
  await chatStore.respondToHealingInvite('later', props.trigger.targetWuxing)
}
</script>

<template>
  <article v-if="!isDismissed" class="healing-card" :class="`is-${trigger.targetWuxing}`">
    <div class="healing-card__mark" aria-hidden="true">✦</div>
    <div class="healing-card__body">
      <p class="healing-card__label">疗愈邀请</p>
      <h2 class="healing-card__title">要不要一边听点音乐，一边慢慢聊？</h2>
      <p class="healing-card__copy">{{ content }}</p>
      <div class="healing-card__actions">
        <button class="healing-card__start" type="button" :disabled="isStarting || hasResponded" @click="handleStart">
          {{ isStarting ? '准备中' : hasResponded ? '疗愈中' : '开始疗愈' }}
        </button>
        <button class="healing-card__later" type="button" :disabled="hasResponded" @click="handleLater">先聊聊</button>
      </div>
    </div>
  </article>
</template>

<style scoped>
.healing-card {
  display: grid;
  grid-template-columns: 2.75rem minmax(0, 1fr);
  gap: var(--space-md);
  padding: var(--space-md);
  border: 1px solid color-mix(in srgb, var(--healing-wuxing-color, var(--color-accent)) 48%, var(--color-border));
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--healing-wuxing-color, var(--color-primary)) 12%, var(--bg-card));
  box-shadow: var(--shadow-card);
}

.healing-card.is-wood {
  --healing-wuxing-color: var(--color-wood);
}

.healing-card.is-fire {
  --healing-wuxing-color: var(--color-fire);
}

.healing-card.is-earth {
  --healing-wuxing-color: var(--color-earth);
}

.healing-card.is-metal {
  --healing-wuxing-color: var(--color-metal);
}

.healing-card.is-water {
  --healing-wuxing-color: var(--color-water);
}

.healing-card__mark {
  display: grid;
  width: 2.75rem;
  aspect-ratio: 1;
  place-items: center;
  border-radius: var(--radius-pill);
  background: var(--color-wood);
  color: var(--bg-primary);
  font-size: 1.2rem;
  box-shadow: 0 0 0.85rem color-mix(in srgb, var(--healing-wuxing-color, var(--color-accent)) 48%, transparent);
}

.healing-card__label,
.healing-card__copy {
  margin: 0;
}

.healing-card__label {
  color: var(--text-tertiary);
  font-size: 0.75rem;
  font-weight: 800;
}

.healing-card__title {
  margin: 0.2rem 0 var(--space-xs);
  color: var(--text-primary);
  font-size: 1rem;
  line-height: 1.35;
}

.healing-card__copy {
  color: var(--text-secondary);
  font-size: 0.875rem;
  line-height: 1.65;
}

.healing-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  margin-top: var(--space-md);
}

.healing-card__start,
.healing-card__later {
  min-height: 2.4rem;
  padding: 0 var(--space-md);
  border-radius: var(--radius-pill);
  cursor: pointer;
  font-weight: 800;
}

.healing-card__start {
  border: 0;
  background: var(--color-wood);
  color: var(--bg-primary);
  box-shadow: 0 0 0.85rem color-mix(in srgb, var(--color-wood) 28%, transparent);
}

.healing-card__later {
  border: 1px solid var(--color-border);
  background: var(--bg-card);
  color: var(--text-secondary);
}

.healing-card__start:disabled,
.healing-card__later:disabled {
  cursor: default;
  opacity: 0.72;
}
</style>
