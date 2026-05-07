import type { MusicRecommendation } from '@/types/music'

const SELF_SEARCH_PATTERNS = [
  /不能直接播放音乐/,
  /不能.*播放/,
  /你可以.*(?:YouTube|youtube|网易云|搜索|搜)/,
  /可以去.*(?:YouTube|youtube|网易云|搜索|搜)/,
  /自己.*(?:搜索|搜)/,
  /(?:YouTube|youtube|网易云).*搜/
]

function hasSelfSearchCopy(value: string): boolean {
  return SELF_SEARCH_PATTERNS.some((pattern) => pattern.test(value))
}

function getStyleHint(recommendation: MusicRecommendation): string {
  const query = recommendation.searchQuery?.toLowerCase() ?? ''
  if (query.includes('r&b') || query.includes('rnb') || query.includes('soul')) {
    return 'R&B / soul'
  }

  if (query.includes('lofi') || query.includes('lo-fi')) {
    return 'lo-fi'
  }

  if (query.includes('jazz')) {
    return 'jazz'
  }

  if (query.includes('ambient') || query.includes('sleep')) {
    return '安静一点'
  }

  return '适合现在'
}

export function sanitizeMusicRecommendationSay(say: string, recommendation: MusicRecommendation | null | undefined): string {
  if (!recommendation || !hasSelfSearchCopy(say)) {
    return say
  }

  return `好，我给你放一组${getStyleHint(recommendation)}的。先从这批听起，氛围别太抢，能慢慢垫在旁边。`
}

