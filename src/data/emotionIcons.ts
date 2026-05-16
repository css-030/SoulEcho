import type { GardenEmotionTag } from '@/types/emotion'

export interface EmotionIconMeta {
  icon: string
  label: string
  userLabel: string
  organLabel: string
  toneLabel: string
  helperText: string
  colorVar: string
  glowVar: string
}

export const EMOTION_ICON_MAP: Record<GardenEmotionTag, EmotionIconMeta> = {
  balanced: {
    icon: '🍃',
    label: '平和',
    userLabel: '平和',
    organLabel: '调和',
    toneLabel: '平稳',
    helperText: '平淡、稳定、没什么波动',
    colorVar: 'var(--color-balanced)',
    glowVar: 'var(--color-balanced-glow)'
  },
  joyful: {
    icon: '☀️',
    label: '愉悦',
    userLabel: '愉悦',
    organLabel: '心',
    toneLabel: '舒心',
    helperText: '开心、满足、轻松明亮',
    colorVar: 'var(--color-joyful)',
    glowVar: 'var(--color-joyful-glow)'
  },
  wood: {
    icon: '🌱',
    label: '木 · 肝',
    userLabel: '烦躁',
    organLabel: '肝',
    toneLabel: '压着火',
    helperText: '憋闷、易怒、很想爆发',
    colorVar: 'var(--color-wood)',
    glowVar: 'var(--color-wood-glow)'
  },
  fire: {
    icon: '🌺',
    label: '火 · 心',
    userLabel: '心慌',
    organLabel: '心',
    toneLabel: '停不下',
    helperText: '心慌、亢奋、睡不安稳',
    colorVar: 'var(--color-fire)',
    glowVar: 'var(--color-fire-glow)'
  },
  earth: {
    icon: '🌼',
    label: '土 · 脾',
    userLabel: '想太多',
    organLabel: '脾',
    toneLabel: '思虑',
    helperText: '纠结、反复想、脑子很满',
    colorVar: 'var(--color-earth)',
    glowVar: 'var(--color-earth-glow)'
  },
  metal: {
    icon: '🍂',
    label: '金 · 肺',
    userLabel: '低落',
    organLabel: '肺',
    toneLabel: '难过',
    helperText: '失落、孤独、想哭',
    colorVar: 'var(--color-metal)',
    glowVar: 'var(--color-metal-glow)'
  },
  water: {
    icon: '💧',
    label: '水 · 肾',
    userLabel: '不安',
    organLabel: '肾',
    toneLabel: '紧张',
    helperText: '害怕、紧张、缺少安全感',
    colorVar: 'var(--color-water-strong)',
    glowVar: 'var(--color-water-glow)'
  }
}

export const WUXING_OPTIONS = Object.entries(EMOTION_ICON_MAP).map(([value, meta]) => ({
  value: value as GardenEmotionTag,
  ...meta
}))
