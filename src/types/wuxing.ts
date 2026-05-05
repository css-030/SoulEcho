export type WuxingType = 'wood' | 'fire' | 'earth' | 'metal' | 'water'

export type WuyinType = 'jue' | 'zhi' | 'gong' | 'shang' | 'yu'

export type OrganType = 'liver' | 'heart' | 'spleen' | 'lung' | 'kidney'

export type EmotionType = 'anger' | 'joy' | 'thought' | 'sadness' | 'fear'

export interface WuxingMapping {
  wuxing: WuxingType
  organ: OrganType
  wuyin: WuyinType
  emotion: EmotionType
  color: string
  modernNote: string
  description: string
}

export const WUXING_MAPPINGS: Record<WuxingType, WuxingMapping> = {
  wood: {
    wuxing: 'wood',
    organ: 'liver',
    wuyin: 'jue',
    emotion: 'anger',
    color: '#22c55e',
    modernNote: 'Mi',
    description: '朝气蓬勃、舒展生发'
  },
  fire: {
    wuxing: 'fire',
    organ: 'heart',
    wuyin: 'zhi',
    emotion: 'joy',
    color: '#fb7185',
    modernNote: 'Sol',
    description: '明快愉悦、温暖活力'
  },
  earth: {
    wuxing: 'earth',
    organ: 'spleen',
    wuyin: 'gong',
    emotion: 'thought',
    color: '#fde68a',
    modernNote: 'Do',
    description: '平稳厚重、安定承托'
  },
  metal: {
    wuxing: 'metal',
    organ: 'lung',
    wuyin: 'shang',
    emotion: 'sadness',
    color: '#cbd5e1',
    modernNote: 'Re',
    description: '清润开阔、收敛安宁'
  },
  water: {
    wuxing: 'water',
    organ: 'kidney',
    wuyin: 'yu',
    emotion: 'fear',
    color: '#bfdbfe',
    modernNote: 'La',
    description: '沉静深远、安定下行'
  }
}
