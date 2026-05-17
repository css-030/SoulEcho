import type { MomoStyle } from '@/types/settings'
import type { WuxingType } from '@/types/wuxing'

interface DoctorHealingCopy {
  emotionCue: string
  organ: string
  mode: string
  music: string
  hopedEffect: string
}

const doctorHealingCopy: Record<WuxingType, DoctorHealingCopy> = {
  wood: {
    emotionCue: '这股被顶住、压着火的感觉，更像木气郁住了',
    organ: '木对应肝',
    mode: '角调',
    music: '带一点古琴和流水感的音乐',
    hopedEffect: '先帮那股绷紧的劲慢慢松一点'
  },
  fire: {
    emotionCue: '你现在这份心里发热、停不下来的感觉，更像火气偏盛',
    organ: '火对应心',
    mode: '徵调',
    music: '节奏更舒缓、不过分刺激的音乐',
    hopedEffect: '先把心里的躁意往下放一放'
  },
  earth: {
    emotionCue: '你现在反复想着、脑子有点满的状态，更像土气被困住了',
    organ: '土对应脾',
    mode: '宫调',
    music: '更稳、更厚一点的音乐',
    hopedEffect: '先帮思绪落回地面一点'
  },
  metal: {
    emotionCue: '这份低落和收紧感，更像金气被牵动了',
    organ: '金对应肺',
    mode: '商调',
    music: '清一点、留白多一点的音乐',
    hopedEffect: '先让胸口那种闷慢慢有一点空间'
  },
  water: {
    emotionCue: '你现在这份不安和缺少安全感，更像水气被牵动了',
    organ: '水对应肾',
    mode: '羽调',
    music: '更沉静、带一点雨声或低频感的音乐',
    hopedEffect: '先陪你把那股慌慢慢安住'
  }
}

export function getHealingStartCopy(style: MomoStyle, targetWuxing: WuxingType): string {
  if (style !== 'calm_doctor') {
    return '我把音乐放上了。你不用一下子讲清楚全部，先从最堵的那一小块开始：刚刚让你最难受的是一句话、一个人，还是一件事？如果里面有委屈或怨气，也可以先把最不公平的那部分说出来。'
  }

  const copy = doctorHealingCopy[targetWuxing]
  return `${copy.emotionCue}，${copy.organ}。我先给你放一组偏${copy.mode}、${copy.music}，不是要一下子把情绪抹掉，而是${copy.hopedEffect}。你也不用急着讲清楚全部，先告诉我，刚刚最顶住你的，是一句话、一个人，还是一件事？`
}
