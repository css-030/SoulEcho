<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

import EmotionGrid from '@/components/garden/EmotionGrid.vue'
import MonthlySummary from '@/components/garden/MonthlySummary.vue'
import { WUXING_OPTIONS } from '@/data/emotionIcons'
import { useEmotionStore } from '@/stores/emotion'
import type { DailyEmotion, GardenEmotionTag } from '@/types/emotion'

const emotionStore = useEmotionStore()
const selectedDate = ref<string | null>(null)
const selectedWuxing = ref<GardenEmotionTag>('balanced')
const note = ref('')
const isSavingCorrection = ref(false)
const isLoadingMonth = ref(false)
const isLoadingReport = ref(false)

const monthTitle = computed(() => `${emotionStore.currentMonth.year} 年 ${emotionStore.currentMonth.month} 月`)
const selectedEmotion = computed<DailyEmotion | undefined>(() =>
  selectedDate.value ? emotionStore.getDailyEmotion(selectedDate.value) : undefined
)

async function loadMonth(year: number, month: number): Promise<void> {
  isLoadingMonth.value = true
  try {
    await emotionStore.loadMonth(year, month)
    await refreshReport()
  } finally {
    isLoadingMonth.value = false
  }
}

async function refreshReport(): Promise<void> {
  isLoadingReport.value = true
  try {
    await emotionStore.generateMonthlyReport()
  } finally {
    isLoadingReport.value = false
  }
}

async function shiftMonth(offset: number): Promise<void> {
  const base = new Date(emotionStore.currentMonth.year, emotionStore.currentMonth.month - 1 + offset, 1)
  selectedDate.value = null
  await loadMonth(base.getFullYear(), base.getMonth() + 1)
}

function handleSelectDate(date: string): void {
  selectedDate.value = date
  selectedWuxing.value = selectedEmotion.value?.dominantWuxing ?? 'balanced'
  note.value = ''
}

function closeEditor(): void {
  selectedDate.value = null
  note.value = ''
}

function getWuxingLabel(wuxingTag: GardenEmotionTag): string {
  return WUXING_OPTIONS.find((option) => option.value === wuxingTag)?.userLabel ?? wuxingTag
}

async function saveCorrection(): Promise<void> {
  if (!selectedDate.value || isSavingCorrection.value) {
    return
  }

  isSavingCorrection.value = true
  try {
    await emotionStore.correctDailyEmotion(selectedDate.value, selectedWuxing.value, note.value.trim() || undefined)
    closeEditor()
    await refreshReport()
  } finally {
    isSavingCorrection.value = false
  }
}

onMounted(async () => {
  document.body.dataset.scene = 'garden'
  const now = new Date()
  await loadMonth(now.getFullYear(), now.getMonth() + 1)
})
</script>

<template>
  <main class="garden-view">
    <section class="garden-view__shell">
      <header class="garden-view__header">
        <div>
          <p class="garden-view__eyebrow">SoulEcho Garden</p>
          <h1 class="garden-view__title">情绪花园</h1>
        </div>

        <nav class="garden-view__nav" aria-label="情绪花园导航">
          <RouterLink class="garden-view__nav-link" to="/" aria-label="回到聊天">
            <span aria-hidden="true">‹</span>
            聊天
          </RouterLink>
        </nav>
      </header>

      <section class="garden-view__month-bar" aria-label="月份切换">
        <button
          class="garden-view__round-button"
          type="button"
          :disabled="isLoadingMonth"
          aria-label="查看上个月"
          @click="shiftMonth(-1)"
        >
          ‹
        </button>
        <div class="garden-view__month-title">
          <span>{{ monthTitle }}</span>
          <small>{{ isLoadingMonth ? '整理花园中...' : '按天记录情绪的颜色' }}</small>
        </div>
        <button
          class="garden-view__round-button"
          type="button"
          :disabled="isLoadingMonth"
          aria-label="查看下个月"
          @click="shiftMonth(1)"
        >
          ›
        </button>
      </section>

      <EmotionGrid
        :year="emotionStore.currentMonth.year"
        :month="emotionStore.currentMonth.month"
        :daily-emotions="emotionStore.dailyEmotions"
        @select-date="handleSelectDate"
      />

      <MonthlySummary
        :stats="emotionStore.monthlyStats"
        :report="emotionStore.monthlyReport"
        :is-loading-report="isLoadingReport"
      />
    </section>

    <div v-if="selectedDate" class="garden-view__modal" role="dialog" aria-modal="true" aria-label="修正当天情绪">
      <div class="garden-view__editor">
        <header class="garden-view__editor-header">
          <div>
            <p class="garden-view__eyebrow">{{ selectedDate }}</p>
            <h2 class="garden-view__editor-title">修正这一天的主导情绪</h2>
          </div>
          <button class="garden-view__round-button" type="button" aria-label="关闭" @click="closeEditor">×</button>
        </header>

        <p class="garden-view__current-state">
          当前：{{ selectedEmotion ? getWuxingLabel(selectedEmotion.dominantWuxing) : '未记录' }}
        </p>

        <div class="garden-view__options" role="radiogroup" aria-label="选择直观情绪">
          <label
            v-for="option in WUXING_OPTIONS"
            :key="option.value"
            class="garden-view__option"
            :class="{ 'is-selected': selectedWuxing === option.value }"
            :style="{ '--option-color': option.colorVar, '--option-glow': option.glowVar }"
          >
            <input v-model="selectedWuxing" type="radio" name="wuxing" :value="option.value" />
            <span v-if="selectedWuxing === option.value" class="garden-view__option-check" aria-hidden="true">✓</span>
            <span class="garden-view__option-icon" aria-hidden="true">{{ option.icon }}</span>
            <span class="garden-view__option-name">{{ option.userLabel }}</span>
            <span class="garden-view__option-help">{{ option.helperText }}</span>
          </label>
        </div>

        <label class="garden-view__note">
          <span>备注</span>
          <textarea v-model="note" rows="3" placeholder="比如：今天是自己补记的。" />
        </label>

        <button class="garden-view__save" type="button" :disabled="isSavingCorrection" @click="saveCorrection">
          {{ isSavingCorrection ? '保存中...' : '保存修正' }}
        </button>
      </div>
    </div>
  </main>
</template>

<style scoped>
.garden-view {
  min-height: 100vh;
  padding: var(--space-xl);
  background: var(--bg-gradient);
  color: var(--text-primary);
}

.garden-view__shell {
  display: grid;
  width: min(100%, 68rem);
  margin: 0 auto;
  gap: var(--space-xl);
}

.garden-view__header,
.garden-view__month-bar,
.garden-view__editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
}

.garden-view__eyebrow,
.garden-view__title,
.garden-view__editor-title,
.garden-view__empty-note,
.garden-view__record {
  margin: 0;
}

.garden-view__eyebrow {
  color: var(--text-secondary);
  font-size: 0.82rem;
  font-weight: 800;
}

.garden-view__title {
  font-family: var(--chat-title-font, serif);
  font-size: clamp(2rem, 5vw, 3.25rem);
  letter-spacing: 0;
  line-height: 1.12;
}

.garden-view__nav {
  display: flex;
  align-items: center;
}

.garden-view__nav-link,
.garden-view__save {
  min-height: 2.85rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  background: var(--bg-card);
  box-shadow: var(--shadow-card);
  color: var(--text-secondary);
  cursor: pointer;
  font-weight: 800;
  text-decoration: none;
  transition:
    background var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-out);
}

.garden-view__nav-link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: 0 var(--space-md);
}

.garden-view__nav-link:hover,
.garden-view__save:hover {
  background: color-mix(in srgb, var(--color-primary) 36%, var(--bg-card));
  color: var(--text-primary);
  transform: translateY(-1px);
}

.garden-view__month-bar {
  width: min(100%, 28rem);
  justify-self: center;
  padding: var(--space-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  background: var(--bg-card);
  box-shadow: var(--shadow-card);
}

.garden-view__round-button {
  display: grid;
  width: 2.75rem;
  min-width: 2.75rem;
  aspect-ratio: 1;
  place-items: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  background: color-mix(in srgb, var(--bg-card) 86%, var(--color-primary));
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 1.35rem;
  font-weight: 900;
  line-height: 1;
}

.garden-view__round-button:disabled {
  cursor: wait;
  opacity: 0.62;
}

.garden-view__month-title {
  display: grid;
  gap: 0.1rem;
  text-align: center;
}

.garden-view__month-title span {
  color: var(--text-primary);
  font-weight: 900;
}

.garden-view__month-title small {
  color: var(--text-secondary);
  font-size: 0.72rem;
  font-weight: 700;
}

.garden-view__modal {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: grid;
  padding: var(--space-lg);
  place-items: center;
  background: color-mix(in srgb, var(--text-primary) 28%, transparent);
}

.garden-view__editor {
  display: grid;
  width: min(100%, 32rem);
  max-height: calc(100vh - var(--space-xl) * 2);
  min-width: 0;
  overflow-y: auto;
  overflow-x: hidden;
  gap: var(--space-lg);
  padding: var(--space-xl);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: color-mix(in srgb, var(--bg-primary) 88%, white);
  box-shadow: 0 1.5rem 3rem color-mix(in srgb, var(--text-primary) 20%, transparent);
}

.garden-view__editor-title {
  color: var(--text-primary);
  font-size: 1.15rem;
}

.garden-view__current-state {
  width: fit-content;
  margin: 0;
  padding: 0.48rem 0.78rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  background: var(--bg-card);
  color: var(--text-secondary);
  font-size: 0.86rem;
  font-weight: 800;
}

.garden-view__options {
  display: grid;
  gap: var(--space-sm);
  grid-template-columns: repeat(auto-fit, minmax(7rem, 1fr));
  min-width: 0;
}

.garden-view__option {
  position: relative;
  display: grid;
  min-height: 6.35rem;
  min-width: 0;
  place-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--bg-card);
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 0.78rem;
  font-weight: 800;
  text-align: center;
}

.garden-view__option-icon {
  font-size: 1.45rem;
  line-height: 1;
}

.garden-view__option-name {
  color: var(--text-primary);
  font-size: 0.95rem;
  line-height: 1.15;
}

.garden-view__option-help {
  color: var(--text-secondary);
  font-size: 0.68rem;
  font-weight: 700;
  line-height: 1.25;
}

.garden-view__option.is-selected {
  border-color: color-mix(in srgb, var(--option-color) 54%, var(--color-border));
  background: color-mix(in srgb, var(--option-glow) 42%, var(--bg-card));
  color: var(--text-primary);
  box-shadow:
    0 0 0 3px color-mix(in srgb, var(--option-color) 24%, transparent),
    0 0.75rem 1.4rem color-mix(in srgb, var(--option-color) 12%, transparent);
}

.garden-view__option-check {
  position: absolute;
  top: 0.55rem;
  right: 0.55rem;
  display: grid;
  width: 1.25rem;
  aspect-ratio: 1;
  place-items: center;
  border-radius: var(--radius-pill);
  background: var(--option-color);
  color: var(--bg-primary);
  font-size: 0.8rem;
  font-weight: 900;
  line-height: 1;
}

.garden-view__option input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.garden-view__note {
  display: grid;
  gap: var(--space-sm);
  color: var(--text-secondary);
  font-size: 0.88rem;
  font-weight: 800;
}

.garden-view__note textarea {
  width: 100%;
  box-sizing: border-box;
  resize: vertical;
  min-height: 5rem;
  padding: var(--space-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--bg-card);
  color: var(--text-primary);
  font: inherit;
  line-height: 1.5;
  outline: none;
}

.garden-view__note textarea:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 16%, transparent);
}

.garden-view__save {
  justify-self: end;
  padding: 0 var(--space-lg);
}

.garden-view__save:disabled {
  cursor: wait;
  opacity: 0.65;
}

@media (prefers-reduced-motion: reduce) {
  .garden-view__nav-link,
  .garden-view__save {
    transition: none;
  }

  .garden-view__nav-link:hover,
  .garden-view__save:hover {
    transform: none;
  }
}

@media (max-width: 720px) {
  .garden-view {
    padding: var(--space-md);
  }

  .garden-view__header {
    align-items: flex-start;
    flex-direction: column;
  }

  .garden-view__month-bar {
    width: 100%;
  }

  .garden-view__modal {
    padding: var(--space-md);
  }

  .garden-view__editor {
    width: 100%;
    padding: var(--space-lg);
  }

  .garden-view__options {
    grid-template-columns: repeat(auto-fit, minmax(6.4rem, 1fr));
  }
}
</style>
