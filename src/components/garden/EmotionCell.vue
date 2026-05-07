<script setup lang="ts">
import { computed } from 'vue'

import { EMOTION_ICON_MAP } from '@/data/emotionIcons'
import type { DailyEmotion } from '@/types/emotion'

interface Props {
  date: string
  day: number
  emotion?: DailyEmotion
  isToday?: boolean
  isDisabled?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  select: [date: string]
}>()

const iconMeta = computed(() => (props.emotion ? EMOTION_ICON_MAP[props.emotion.dominantWuxing] : null))
const tooltip = computed(() => {
  if (!props.emotion || !iconMeta.value) {
    return props.isDisabled ? `${props.date} · 还没到这一天` : `${props.date} · 暂无记录`
  }

  return `${props.date} · ${iconMeta.value.userLabel} · ${iconMeta.value.helperText}`
})

function handleSelect(): void {
  if (props.isDisabled) {
    return
  }

  emit('select', props.date)
}
</script>

<template>
  <button
    class="emotion-cell"
    :class="{ 'has-record': emotion, 'is-today': isToday }"
    type="button"
    :disabled="isDisabled"
    :title="tooltip"
    :aria-label="tooltip"
    :style="{
      '--cell-color': iconMeta?.colorVar,
      '--cell-glow': iconMeta?.glowVar
    }"
    @click="handleSelect"
  >
    <span class="emotion-cell__day">{{ day }}</span>
    <span v-if="emotion && iconMeta" class="emotion-cell__icon" aria-hidden="true">{{ iconMeta.icon }}</span>
    <span v-else class="emotion-cell__empty" aria-hidden="true" />
    <span class="emotion-cell__label">{{ iconMeta?.userLabel ?? '未记录' }}</span>
  </button>
</template>

<style scoped>
.emotion-cell {
  position: relative;
  display: grid;
  width: min(100%, 6.25rem);
  min-height: 5rem;
  aspect-ratio: 1 / 1;
  padding: 0.5rem;
  border: 1.6px solid var(--color-border);
  border-radius: 14px;
  background: color-mix(in srgb, var(--bg-card) 74%, transparent);
  box-shadow: var(--shadow-card);
  color: var(--text-tertiary);
  cursor: pointer;
  grid-template-rows: auto minmax(1.7rem, 1fr) minmax(1rem, auto);
  outline: none;
  transition:
    background var(--duration-fast) var(--ease-out),
    border-color var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-out);
}

.emotion-cell:hover,
.emotion-cell:focus-visible {
  border-color: color-mix(in srgb, var(--cell-color, var(--color-accent)) 44%, var(--color-border));
  background: color-mix(in srgb, var(--bg-card) 92%, var(--cell-glow, var(--color-primary)));
  box-shadow:
    var(--shadow-card),
    0 0 0 3px color-mix(in srgb, var(--cell-color, var(--color-accent)) 16%, transparent);
  transform: scale(1.035);
}

.emotion-cell.is-today {
  border-color: color-mix(in srgb, var(--color-accent) 58%, var(--color-border));
}

.emotion-cell:disabled {
  cursor: not-allowed;
  opacity: 0.46;
}

.emotion-cell:disabled:hover,
.emotion-cell:disabled:focus-visible {
  border-color: var(--color-border);
  background: color-mix(in srgb, var(--bg-card) 74%, transparent);
  box-shadow: var(--shadow-card);
  transform: none;
}

.emotion-cell.has-record {
  color: var(--text-primary);
}

.emotion-cell__day {
  justify-self: start;
  color: var(--text-secondary);
  font-size: 0.72rem;
  font-weight: 800;
  line-height: 1;
}

.emotion-cell__icon {
  align-self: center;
  justify-self: center;
  font-size: clamp(1.12rem, 2.2vw, 1.55rem);
  filter: drop-shadow(0 0 0.55rem color-mix(in srgb, var(--cell-glow, var(--color-primary)) 62%, transparent));
  line-height: 1;
}

.emotion-cell__empty {
  align-self: center;
  justify-self: center;
  width: 0.62rem;
  height: 0.62rem;
  border: 1px solid color-mix(in srgb, var(--color-border) 70%, transparent);
  border-radius: var(--radius-pill);
  background: color-mix(in srgb, var(--bg-card) 48%, transparent);
}

.emotion-cell__label {
  min-width: 0;
  color: var(--text-secondary);
  font-size: 0.76rem;
  font-weight: 800;
  line-height: 1.15;
  overflow-wrap: anywhere;
  text-align: center;
}

@media (prefers-reduced-motion: reduce) {
  .emotion-cell {
    transition: none;
  }

  .emotion-cell:hover,
  .emotion-cell:focus-visible {
    transform: none;
  }
}
</style>
