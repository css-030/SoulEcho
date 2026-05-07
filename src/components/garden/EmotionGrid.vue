<script setup lang="ts">
import { computed } from 'vue'

import type { DailyEmotion } from '@/types/emotion'
import { isFutureDate } from '@/utils/emotionGarden'

import EmotionCell from './EmotionCell.vue'

interface CalendarCell {
  key: string
  date?: string
  day?: number
  emotion?: DailyEmotion
  isToday: boolean
  isDisabled: boolean
}

interface Props {
  year: number
  month: number
  dailyEmotions: DailyEmotion[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  selectDate: [date: string]
}>()

const weekDays = ['一', '二', '三', '四', '五', '六', '日']
const todayDate = new Date().toISOString().slice(0, 10)

const emotionsByDate = computed(() => new Map(props.dailyEmotions.map((emotion) => [emotion.date, emotion])))

const cells = computed<CalendarCell[]>(() => {
  const totalDays = new Date(props.year, props.month, 0).getDate()
  const firstDay = new Date(props.year, props.month - 1, 1).getDay()
  const leadingBlanks = (firstDay + 6) % 7
  const result: CalendarCell[] = []

  for (let index = 0; index < leadingBlanks; index += 1) {
    result.push({ key: `blank-${index}`, isToday: false, isDisabled: true })
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const date = `${props.year}-${String(props.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    result.push({
      key: date,
      date,
      day,
      emotion: emotionsByDate.value.get(date),
      isToday: date === todayDate,
      isDisabled: isFutureDate(date)
    })
  }

  return result
})

function handleSelect(date: string): void {
  emit('selectDate', date)
}
</script>

<template>
  <section class="emotion-grid" aria-label="月度情绪日历">
    <div class="emotion-grid__weekdays" aria-hidden="true">
      <span v-for="day in weekDays" :key="day">{{ day }}</span>
    </div>

    <div class="emotion-grid__cells">
      <div v-for="cell in cells" :key="cell.key" class="emotion-grid__slot">
        <EmotionCell
          v-if="cell.date && cell.day"
          :date="cell.date"
          :day="cell.day"
          :emotion="cell.emotion"
          :is-today="cell.isToday"
          :is-disabled="cell.isDisabled"
          @select="handleSelect"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.emotion-grid {
  display: grid;
  gap: var(--space-sm);
}

.emotion-grid__weekdays,
.emotion-grid__cells {
  display: grid;
  grid-template-columns: repeat(7, minmax(4.6rem, 1fr));
  gap: var(--space-sm);
}

.emotion-grid__weekdays span {
  color: var(--text-secondary);
  font-size: 0.76rem;
  font-weight: 800;
  text-align: center;
}

.emotion-grid__slot {
  display: flex;
  min-width: 0;
  justify-content: center;
}

.emotion-grid__slot:empty {
  min-height: 5rem;
  min-width: 0;
}

@media (max-width: 700px) {
  .emotion-grid {
    overflow-x: auto;
    padding-bottom: var(--space-xs);
  }

  .emotion-grid__weekdays,
  .emotion-grid__cells {
    gap: 0.38rem;
    min-width: 34rem;
  }
}
</style>
