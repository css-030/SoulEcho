import type { OrganType, WuxingType, WuyinType } from '@/types/wuxing'

export interface HealingOrgan {
  organ: OrganType
  wuxing: WuxingType
  wuyin: WuyinType
  label: string
  shortLabel: string
  description: string
  assetPath: string
  labelPosition: {
    x: number
    y: number
  }
  particleOrigin: {
    x: number
    y: number
  }
}

export const HEALING_BODY_ASSET = '/healing-assets/whole.png'

export const HEALING_ORGANS: HealingOrgan[] = [
  {
    organ: 'liver',
    wuxing: 'wood',
    wuyin: 'jue',
    label: '肝 · 角调',
    shortLabel: '肝',
    description: '疏展、松开压着的火气',
    assetPath: '/healing-assets/liver.png',
    labelPosition: { x: 18, y: 42 },
    particleOrigin: { x: 44, y: 45 }
  },
  {
    organ: 'heart',
    wuxing: 'fire',
    wuyin: 'zhi',
    label: '心 · 徵调',
    shortLabel: '心',
    description: '安神、让心跳慢慢落稳',
    assetPath: '/healing-assets/heart.png',
    labelPosition: { x: 72, y: 30 },
    particleOrigin: { x: 52, y: 34 }
  },
  {
    organ: 'spleen',
    wuxing: 'earth',
    wuyin: 'gong',
    label: '脾 · 宫调',
    shortLabel: '脾',
    description: '承托、把思绪放回身体里',
    assetPath: '/healing-assets/spleen.png',
    labelPosition: { x: 75, y: 49 },
    particleOrigin: { x: 52, y: 49 }
  },
  {
    organ: 'lung',
    wuxing: 'metal',
    wuyin: 'shang',
    label: '肺 · 商调',
    shortLabel: '肺',
    description: '清润、陪悲伤慢慢呼出去',
    assetPath: '/healing-assets/lung.png',
    labelPosition: { x: 19, y: 28 },
    particleOrigin: { x: 49, y: 33 }
  },
  {
    organ: 'kidney',
    wuxing: 'water',
    wuyin: 'yu',
    label: '肾 · 羽调',
    shortLabel: '肾',
    description: '下潜、把不安轻轻安住',
    assetPath: '/healing-assets/kidney.png',
    labelPosition: { x: 25, y: 63 },
    particleOrigin: { x: 50, y: 62 }
  }
]

export const HEALING_ORGAN_BY_WUXING: Record<WuxingType, OrganType> = {
  wood: 'liver',
  fire: 'heart',
  earth: 'spleen',
  metal: 'lung',
  water: 'kidney'
}

export const HEALING_WUXING_BY_ORGAN: Record<OrganType, WuxingType> = {
  liver: 'wood',
  heart: 'fire',
  spleen: 'earth',
  lung: 'metal',
  kidney: 'water'
}
