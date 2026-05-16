import type { MusicTasteProfile } from '@/types/settings'

export interface TasteTrackInput {
  title: string
  artists: string[]
}

const STYLE_RULES: Array<{ tag: string; patterns: RegExp[] }> = [
  { tag: 'R&B', patterns: [/\br&b\b/i, /\brnb\b/i, /节奏布鲁斯/i] },
  { tag: 'Neo Soul', patterns: [/neo\s*soul/i, /soul/i, /灵魂乐/i] },
  { tag: 'Jazz', patterns: [/jazz/i, /爵士/i] },
  { tag: 'Lo-fi', patterns: [/lo-?fi/i, /低保真/i] },
  { tag: 'Hip-Hop', patterns: [/hip-?hop/i, /rap/i, /说唱/i] },
  { tag: '华语流行', patterns: [/华语/i, /国语/i, /中文/i] },
  { tag: '独立', patterns: [/indie/i, /独立/i] },
  { tag: '电子', patterns: [/electronic/i, /edm/i, /电子/i] },
  { tag: '摇滚', patterns: [/rock/i, /摇滚/i] },
  { tag: '民谣', patterns: [/folk/i, /民谣/i] },
  { tag: '轻音乐', patterns: [/ambient/i, /piano/i, /instrumental/i, /轻音乐/i, /钢琴/i, /纯音乐/i] },
  { tag: '古风', patterns: [/古风/i, /国风/i] }
]

const ARTIST_STYLE_HINTS: Record<string, string[]> = {
  sza: ['R&B', 'Neo Soul'],
  'frank ocean': ['R&B', 'Neo Soul'],
  'daniel caesar': ['R&B', 'Neo Soul'],
  'h.e.r.': ['R&B', 'Neo Soul'],
  'brent faiyaz': ['R&B', 'Neo Soul'],
  'summer walker': ['R&B', 'Neo Soul'],
  'jhené aiko': ['R&B', 'Neo Soul'],
  'the weeknd': ['R&B'],
  'erykah badu': ['Neo Soul'],
  'd’angelo': ['Neo Soul'],
  'dangelo': ['Neo Soul'],
  陶喆: ['R&B', '华语流行'],
  方大同: ['R&B', '华语流行'],
  王力宏: ['R&B', '华语流行'],
  周杰伦: ['华语流行', 'R&B'],
  林俊杰: ['华语流行'],
  孙燕姿: ['华语流行'],
  蔡健雅: ['华语流行', '独立']
}

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

function countBy(items: string[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const item of items) {
    const normalized = item.trim()
    if (!normalized) {
      continue
    }

    counts.set(normalized, (counts.get(normalized) ?? 0) + 1)
  }

  return counts
}

function topItems(counts: Map<string, number>, limit: number): string[] {
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([item]) => item)
}

function detectLanguageHints(tracks: TasteTrackInput[]): string[] {
  const text = tracks.map((track) => `${track.title} ${track.artists.join(' ')}`).join(' ')
  const hints: string[] = []

  if (/[\u4e00-\u9fff]/.test(text)) {
    hints.push('中文')
  }

  if (/[a-zA-Z]/.test(text)) {
    hints.push('英文')
  }

  if (/[\u3040-\u30ff]/.test(text)) {
    hints.push('日文')
  }

  if (/[\uac00-\ud7af]/.test(text)) {
    hints.push('韩文')
  }

  return hints
}

function detectStyleTags(tracks: TasteTrackInput[], topArtists: string[]): string[] {
  const tags: string[] = []
  const text = tracks.map((track) => `${track.title} ${track.artists.join(' ')}`).join(' ')

  for (const rule of STYLE_RULES) {
    if (rule.patterns.some((pattern) => pattern.test(text))) {
      tags.push(rule.tag)
    }
  }

  for (const artist of topArtists) {
    const hints = ARTIST_STYLE_HINTS[normalize(artist)] ?? ARTIST_STYLE_HINTS[artist]
    if (hints) {
      tags.push(...hints)
    }
  }

  return topItems(countBy(tags), 6)
}

function buildSearchBias(topArtists: string[], styleTags: string[], languageHints: string[]): string {
  const parts = [...styleTags.slice(0, 4), ...topArtists.slice(0, 4)]
  if (languageHints.length > 0) {
    parts.push(`${languageHints.slice(0, 2).join('/')} songs`)
  }

  return parts.join(' ').trim()
}

export function analyzeMusicTaste(tracks: TasteTrackInput[], opts: { likedPlaylistId?: string; now?: number } = {}): MusicTasteProfile {
  const sampledTracks = tracks.slice(0, 100)
  const artists = sampledTracks.flatMap((track) => track.artists)
  const topArtists = topItems(countBy(artists), 8)
  const styleTags = detectStyleTags(sampledTracks, topArtists)
  const languageHints = detectLanguageHints(sampledTracks)
  const seedTracks = sampledTracks
    .filter((track) => track.title.trim())
    .slice(0, 8)
    .map((track) => `${track.title}${track.artists.length > 0 ? ` - ${track.artists.join(' / ')}` : ''}`)

  return {
    source: 'netease_liked',
    updatedAt: opts.now ?? Date.now(),
    sampledTrackCount: sampledTracks.length,
    likedPlaylistId: opts.likedPlaylistId,
    topArtists,
    styleTags,
    languageHints,
    seedTracks,
    searchBias: buildSearchBias(topArtists, styleTags, languageHints)
  }
}

export type MusicTasteBiasMode = 'full' | 'styles_only' | 'contextual_styles'

function buildStyleOnlyBias(profile: MusicTasteProfile): string {
  return profile.styleTags.slice(0, 4).join(' ').trim()
}

function buildContextualStyleBias(query: string, profile: MusicTasteProfile): string {
  const normalizedQuery = normalize(query)
  const requestedStyleGroups: string[][] = []

  if (/\br(&b|nb)\b/.test(normalizedQuery) || normalizedQuery.includes('soul')) {
    requestedStyleGroups.push(['R&B', 'Neo Soul'])
  }
  if (normalizedQuery.includes('jazz')) {
    requestedStyleGroups.push(['Jazz'])
  }
  if (normalizedQuery.includes('lofi') || normalizedQuery.includes('lo-fi')) {
    requestedStyleGroups.push(['Lo-fi'])
  }
  if (normalizedQuery.includes('pop')) {
    requestedStyleGroups.push(['华语流行'])
  }

  const allowedStyles = new Set(requestedStyleGroups.flat())
  const relevantStyles = (allowedStyles.size > 0 ? profile.styleTags.filter((tag) => allowedStyles.has(tag)) : profile.styleTags.slice(0, 2)).filter(
    (tag) => !normalizedQuery.includes(normalize(tag))
  )
  return relevantStyles.join(' ').trim()
}

export function applyMusicTasteToQuery(query: string, profile?: MusicTasteProfile, mode: MusicTasteBiasMode = 'full'): string {
  const bias = profile
    ? mode === 'styles_only'
      ? buildStyleOnlyBias(profile)
      : mode === 'contextual_styles'
        ? buildContextualStyleBias(query, profile)
        : profile.searchBias.trim()
    : ''
  if (!bias) {
    return query
  }

  const normalizedQuery = normalize(query)
  const normalizedBias = normalize(bias)
  const alreadyIncludesBias = normalizedBias
    .split(/\s+/)
    .filter((part) => part.length > 2)
    .some((part) => normalizedQuery.includes(part))

  return alreadyIncludesBias ? query : `${query} ${bias}`
}
