<script setup lang="ts">
import { computed } from 'vue'

import { WUXING_OPTIONS } from '@/data/emotionIcons'
import type { MonthlyEmotionStats } from '@/types/emotion'

interface Props {
  stats: MonthlyEmotionStats
  report?: string | null
  isLoadingReport?: boolean
}

const props = defineProps<Props>()

const dominantMeta = computed(() => WUXING_OPTIONS.find((option) => option.value === props.stats.dominantWuxing))
</script>

<template>
  <section class="monthly-summary" aria-label="本月情绪统计">
    <div class="monthly-summary__stats">
      <div class="monthly-summary__headline">
        <span class="monthly-summary__avatar" aria-hidden="true">M</span>
        <div>
          <p class="monthly-summary__eyebrow">本月花园</p>
          <h2 class="monthly-summary__title">
            {{ stats.recordedDays }} / {{ stats.totalDays }} 天有情绪记录
          </h2>
        </div>
      </div>

      <div class="monthly-summary__dominant">
        <span class="monthly-summary__dominant-icon" aria-hidden="true">{{ dominantMeta?.icon }}</span>
        <span>主导：{{ dominantMeta?.userLabel ?? '暂无' }}</span>
      </div>

      <div class="monthly-summary__bars">
        <div
          v-for="option in WUXING_OPTIONS"
          :key="option.value"
          class="monthly-summary__bar-row"
          :style="{ '--bar-color': option.colorVar, '--bar-glow': option.glowVar }"
        >
          <span class="monthly-summary__bar-label">
            <span aria-hidden="true">{{ option.icon }}</span>
            {{ option.userLabel }}
          </span>
          <span class="monthly-summary__bar-track" aria-hidden="true">
            <span
              class="monthly-summary__bar-fill"
              :style="{ width: `${stats.totalDays ? (stats.distribution[option.value] / stats.totalDays) * 100 : 0}%` }"
            />
          </span>
          <span class="monthly-summary__bar-count">{{ stats.distribution[option.value] }} 天</span>
        </div>
      </div>
    </div>

    <div class="monthly-summary__report" aria-live="polite">
      <p v-if="isLoadingReport" class="monthly-summary__report-text">momo 正在读这片花园...</p>
      <p v-else class="monthly-summary__report-text">
        {{ report || '这个月的花园还很安静。多和 momo 聊几次，这里会慢慢长出属于你的情绪纹理。' }}
      </p>
    </div>
  </section>
</template>

<style scoped>
.monthly-summary {
  display: grid;
  gap: var(--space-lg);
  grid-template-columns: minmax(0, 1.08fr) minmax(16rem, 0.92fr);
}

.monthly-summary__stats,
.monthly-summary__report {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: var(--bg-card);
  box-shadow: var(--shadow-card);
}

.monthly-summary__stats {
  display: grid;
  gap: var(--space-md);
  padding: var(--space-lg);
}

.monthly-summary__headline {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.monthly-summary__avatar {
  display: grid;
  width: 2.75rem;
  aspect-ratio: 1;
  place-items: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  background: color-mix(in srgb, var(--color-primary) 34%, var(--bg-card));
  color: var(--text-primary);
  font-family: var(--chat-title-font, serif);
  font-size: 1.25rem;
  font-weight: 800;
}

.monthly-summary__eyebrow,
.monthly-summary__title,
.monthly-summary__report-text {
  margin: 0;
}

.monthly-summary__eyebrow {
  color: var(--text-secondary);
  font-size: 0.78rem;
  font-weight: 800;
}

.monthly-summary__title {
  color: var(--text-primary);
  font-size: 1.15rem;
  line-height: 1.35;
}

.monthly-summary__dominant {
  display: inline-flex;
  width: fit-content;
  align-items: center;
  gap: var(--space-sm);
  padding: 0.55rem 0.8rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  background: color-mix(in srgb, var(--bg-card) 78%, var(--color-primary));
  color: var(--text-secondary);
  font-size: 0.86rem;
  font-weight: 800;
}

.monthly-summary__dominant-icon {
  line-height: 1;
}

.monthly-summary__bars {
  display: grid;
  gap: 0.72rem;
}

.monthly-summary__bar-row {
  display: grid;
  align-items: center;
  gap: var(--space-sm);
  grid-template-columns: 5.8rem minmax(5rem, 1fr) 2.8rem;
}

.monthly-summary__bar-label,
.monthly-summary__bar-count {
  color: var(--text-secondary);
  font-size: 0.78rem;
  font-weight: 800;
}

.monthly-summary__bar-count {
  text-align: right;
}

.monthly-summary__bar-track {
  height: 0.58rem;
  overflow: hidden;
  border-radius: var(--radius-pill);
  background: color-mix(in srgb, var(--color-border) 48%, transparent);
}

.monthly-summary__bar-fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--bar-color), var(--bar-glow));
  min-width: 0.2rem;
  transition: width var(--duration-normal) var(--ease-out);
}

.monthly-summary__report {
  display: flex;
  align-items: center;
  min-height: 10rem;
  padding: var(--space-xl);
}

.monthly-summary__report-text {
  color: var(--text-secondary);
  font-size: 0.98rem;
  line-height: 1.7;
}

@media (max-width: 860px) {
  .monthly-summary {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .monthly-summary__bar-row {
    grid-template-columns: 4.8rem minmax(3rem, 1fr) 2.6rem;
  }
}
</style>
