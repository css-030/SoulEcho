<script setup lang="ts">
import { computed } from 'vue'

import type { HealingOrgan } from '@/types/healing'

interface Props {
  organ: HealingOrgan
  isActive: boolean
}

const props = defineProps<Props>()
const isLeftSide = computed(() => props.organ.labelPosition.x < 50)
</script>

<template>
  <aside
    class="organ-label"
    :class="[{ 'is-active': isActive, 'is-left-side': isLeftSide }, `is-${organ.wuxing}`]"
    :style="{ '--label-x': `${organ.labelPosition.x}%`, '--label-y': `${organ.labelPosition.y}%` }"
  >
    <span class="organ-label__pin" aria-hidden="true" />
    <div class="organ-label__card">
      <strong>{{ organ.label }}</strong>
      <span>{{ organ.description }}</span>
    </div>
  </aside>
</template>

<style scoped>
.organ-label {
  --organ-color: var(--color-wood);
  position: absolute;
  left: var(--label-x);
  top: var(--label-y);
  z-index: 8;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  width: min(15rem, 28vw);
  color: var(--text-secondary);
  opacity: 0.72;
  transform: translate(-50%, -50%);
  transition:
    opacity var(--duration-normal) var(--ease-out),
    transform var(--duration-normal) var(--ease-out);
}

.organ-label.is-fire {
  --organ-color: var(--color-fire);
}

.organ-label.is-earth {
  --organ-color: var(--color-earth);
}

.organ-label.is-metal {
  --organ-color: var(--color-metal);
}

.organ-label.is-water {
  --organ-color: var(--color-water);
}

.organ-label.is-active {
  color: var(--text-primary);
  opacity: 1;
  transform: translate(-50%, -50%) scale(1.04);
}

.organ-label.is-left-side {
  flex-direction: row-reverse;
}

.organ-label__pin {
  width: clamp(1.8rem, 5vw, 4.5rem);
  height: 1px;
  flex: 0 1 auto;
  background: color-mix(in srgb, var(--organ-color) 62%, transparent);
  box-shadow: 0 0 0.8rem color-mix(in srgb, var(--organ-color) 36%, transparent);
}

.organ-label__card {
  display: grid;
  gap: var(--space-xs);
  min-width: 0;
  padding: 0.7rem 0.85rem;
  border: 1px solid color-mix(in srgb, var(--organ-color) 48%, var(--color-border));
  border-radius: var(--radius-md);
  background: var(--bg-card);
  box-shadow: var(--shadow-card);
  backdrop-filter: var(--blur-card);
}

.organ-label.is-active .organ-label__card {
  box-shadow:
    var(--shadow-card),
    0 0 1.4rem color-mix(in srgb, var(--organ-color) 20%, transparent);
}

.organ-label__card strong {
  color: inherit;
  font-size: 0.9rem;
  letter-spacing: 0;
  line-height: 1.2;
}

.organ-label__card span {
  color: var(--text-secondary);
  font-size: 0.75rem;
  line-height: 1.5;
}

@media (max-width: 760px) {
  .organ-label {
    width: 9.5rem;
  }

  .organ-label__card span {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .organ-label {
    transition: none;
  }
}
</style>
