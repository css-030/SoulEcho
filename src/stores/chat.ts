import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { getAppEnv } from '@/services/config/env'
import { emotionAnalyzer } from '@/services/momo/EmotionAnalyzer'
import { MomoService } from '@/services/momo/MomoService'
import { sanitizeMusicRecommendationSay } from '@/services/momo/MusicResponseCopy'
import { musicRouter } from '@/services/music/MusicRouter'
import { emotionRepo } from '@/services/storage/repositories/EmotionRepo'
import { messageRepo } from '@/services/storage/repositories/MessageRepo'
import { profileRepo } from '@/services/storage/repositories/ProfileRepo'
import { openWeatherService, WEATHER_UNAVAILABLE } from '@/services/weather/OpenWeatherService'
import { usePlayerStore } from '@/stores/player'
import { useSettingsStore } from '@/stores/settings'
import type { Message } from '@/types/message'
import type { MusicRecommendation, Track } from '@/types/music'
import type { ChatContext, MomoResponse } from '@/types/momo'
import type { UserProfile } from '@/types/settings'
import { WUXING_MAPPINGS, type WuxingType } from '@/types/wuxing'
import { createId } from '@/utils/id'
import { isSameDay } from '@/utils/time'

function createTextMessage(role: 'user' | 'momo', content: string, meta?: Message['meta']): Message {
  return {
    id: createId(role),
    role,
    type: 'text',
    content,
    timestamp: Date.now(),
    meta
  }
}

const MUSIC_INTENT_KEYWORDS = [
  'music',
  'song',
  'playlist',
  'play',
  'r&b',
  'rnb',
  'pop',
  'soul',
  'lofi',
  'radio',
  'bgm',
  '\u97f3\u4e50',
  '\u6b4c',
  '\u6b4c\u5355',
  '\u64ad\u653e',
  '\u542c\u6b4c',
  '\u6362\u4e00\u9996',
  '\u6362\u4e00\u4e2a',
  '\u6362\u4e2a',
  '\u4e0d\u597d\u542c',
  '\u542c\u8fc7'
]
const RECOMMENDATION_BATCH_SIZE = 5
const HEALING_DECLINE_COOLDOWN_MS = 15 * 60 * 1000

export const useChatStore = defineStore('chat', () => {
  const messages = ref<Message[]>([])
  const isMomoTyping = ref(false)
  const inputText = ref('')
  const hasInitialized = ref(false)
  const hasGreetedToday = ref(false)
  const healingConversationActive = ref(false)
  const healingMusicDeclinedAt = ref<number | null>(null)
  const profile = ref<UserProfile>(profileRepo.getDefault())

  const orderedMessages = computed(() => [...messages.value].sort((a, b) => a.timestamp - b.timestamp))

  async function initialize(): Promise<void> {
    const settingsStore = useSettingsStore()
    if (!settingsStore.isLoaded) {
      await settingsStore.initialize()
    }

    messages.value = await messageRepo.loadRecent(50)
    profile.value = await profileRepo.load()
    hasGreetedToday.value = messages.value.some(
      (message) => message.role === 'momo' && message.meta?.emotionDetected === 'neutral' && isSameDay(message.timestamp, Date.now())
    )
    await refreshLongTermMemory()
    hasInitialized.value = true
  }

  async function greetIfNeeded(): Promise<void> {
    if (!hasInitialized.value) {
      await initialize()
    }

    const settingsStore = useSettingsStore()

    if (settingsStore.settings.recommendFrequency === 'never') {
      return
    }

    if (
      settingsStore.settings.recommendFrequency === 'once_per_day' &&
      isSameDay(settingsStore.settings.lastGreetedAt, Date.now())
    ) {
      return
    }

    isMomoTyping.value = true
    try {
      const response = await createMomoService().greet(await buildContext())
      await appendMomoResponse(response)
      hasGreetedToday.value = true
      await settingsStore.save({ lastGreetedAt: Date.now() })
    } finally {
      isMomoTyping.value = false
    }
  }

  async function sendMessage(text: string): Promise<void> {
    const trimmed = text.trim()
    if (!trimmed || isMomoTyping.value) {
      return
    }

    const userMessage = createTextMessage('user', trimmed)
    await appendMessage(userMessage)
    inputText.value = ''

    isMomoTyping.value = true
    try {
      const response = await createMomoService().chat(trimmed, await buildContext())
      await appendMomoResponse(response)
    } catch {
      await appendMessage(createTextMessage('momo', '\u6211\u521a\u624d\u6709\u70b9\u604d\u795e\uff0c\u518d\u8bf4\u4e00\u6b21\u597d\u5417\uff1f'))
    } finally {
      isMomoTyping.value = false
    }
  }

  async function appendMessage(message: Message): Promise<void> {
    messages.value.push(message)
    await messageRepo.save(message)
  }

  async function clearHistory(): Promise<void> {
    await messageRepo.clear()
    messages.value = []
    hasGreetedToday.value = false
    healingConversationActive.value = false
    healingMusicDeclinedAt.value = null
  }

  async function triggerHealingScenarioTest(): Promise<void> {
    const userMessage = createTextMessage('user', '我感觉我快爆炸了 我今天被老板骂了', {
      emotionDetected: 'strong_negative',
      emotionTag: 'wood'
    })
    const mapping = WUXING_MAPPINGS.wood
    const healingMessage: Message = {
      id: createId('healing-test'),
      role: 'momo',
      type: 'healing_invite',
      content: '听起来你真的被顶到了。要不要先听点安静的音乐，让心里那股闷火有个地方慢慢落下来？',
      timestamp: Date.now(),
      healingTrigger: {
        targetOrgan: mapping.organ,
        targetWuxing: 'wood',
        testContext: {
          now: new Date('2026-05-15T18:30:00+08:00').getTime(),
          weather: {
            description: '小雨',
            temperature: 28,
            casualSummary: '测试场景：小雨'
          }
        }
      },
      meta: {
        emotionDetected: 'strong_negative',
        emotionTag: 'wood'
      }
    }

    healingConversationActive.value = false
    healingMusicDeclinedAt.value = null
    await appendMessage(userMessage)
    await appendMessage(healingMessage)
  }

  async function appendMomoResponse(response: MomoResponse): Promise<void> {
    const recentUserMessage = [...orderedMessages.value].reverse().find((message) => message.role === 'user')

    const recoveredRecommendation = ensureMusicRecommendation(response, recentUserMessage?.content)
    if (recoveredRecommendation && !response.musicRecommendation) {
      response.musicRecommendation = recoveredRecommendation
      response.shouldRecommendMusic = true
    }

    const hasMusicIntent = hasExplicitMusicIntent(recentUserMessage?.content)
    const showMusicCard = shouldShowMusicCard(response, hasMusicIntent)
    const showHealingInvite = shouldShowHealingInvite(response, hasMusicIntent, showMusicCard, recentUserMessage?.content)

    if (showHealingInvite) {
      const healingMessage = await appendHealingInvite(response)
      await recordEmotionFromResponse(response, [recentUserMessage?.id, healingMessage?.id].filter((id): id is string => Boolean(id)))
      return
    }

    const say = showMusicCard ? sanitizeMusicRecommendationSay(response.say, response.musicRecommendation) : response.say
    const momoMessage = createTextMessage('momo', say, {
      emotionDetected: response.emotionDetected,
      emotionTag: response.emotionTag
    })

    await appendMessage(momoMessage)
    await recordEmotionFromResponse(response, [recentUserMessage?.id, momoMessage.id].filter((id): id is string => Boolean(id)))

    if (showMusicCard) {
      await appendMusicRecommendation(response)
    }
  }

  async function buildContext(): Promise<ChatContext> {
    const settingsStore = useSettingsStore()
    const playerStore = usePlayerStore()
    const env = getAppEnv()
    const weather = await openWeatherService.getCurrentWeather({
      apiKey: settingsStore.settings.openweatherApiKey || env.openweatherApiKey,
      city: settingsStore.settings.openweatherDefaultCity || env.openweatherDefaultCity
    })

    return {
      settings: settingsStore.settings,
      profile: profile.value,
      weather: weather || WEATHER_UNAVAILABLE,
      longTermMemory: profile.value.longTermMemory,
      recentEmotions: await emotionRepo.loadRecent(7),
      recentMessages: orderedMessages.value.slice(-12),
      currentMusicSource: playerStore.source,
      isHealingMode: playerStore.isHealingMode,
      healingConversationActive: healingConversationActive.value,
      healingMusicDeclinedAt: healingMusicDeclinedAt.value,
      alreadyRecommendedToday: isSameDay(settingsStore.settings.lastGreetedAt, Date.now())
    }
  }

  function createMomoService(): MomoService {
    const env = getAppEnv()
    const settingsStore = useSettingsStore()
    return new MomoService(settingsStore.settings.openaiApiKey || env.openaiApiKey)
  }

  async function recordEmotionFromResponse(response: MomoResponse, contextMessageIds: string[]): Promise<void> {
    const record = emotionAnalyzer.toEmotionRecord(response, contextMessageIds)
    if (!record) {
      return
    }

    await emotionRepo.save(record)
  }

  async function appendMusicRecommendation(response: MomoResponse): Promise<void> {
    const recommendation = response.musicRecommendation
    if (!recommendation) {
      return
    }

    const settingsStore = useSettingsStore()
    const tracks =
      recommendation.primaryTrack || recommendation.playlist
        ? []
        : await musicRouter.search({
            ...recommendation,
            sourceLock: settingsStore.settings.sourceLock
          })
    const batchTracks = recommendation.playlist ? recommendation.playlist.tracks : recommendation.primaryTrack ? [recommendation.primaryTrack] : selectRecommendationBatch(tracks)
    const primaryTrack = recommendation.primaryTrack ?? batchTracks[0]
    if (!primaryTrack && !recommendation.playlist) {
      await appendMessage(
        createTextMessage('momo', '\u8fd9\u4e00\u6279\u641c\u7d22\u7ed3\u679c\u548c\u4e4b\u524d\u592a\u50cf\u4e86\uff0c\u6211\u5148\u4e0d\u7ed9\u4f60\u91cd\u590d\u63a8\u540c\u4e00\u5f20\u5361\u3002\u53ef\u4ee5\u6362\u4e2a\u5173\u952e\u8bcd\uff0c\u6bd4\u5982 neo soul\u3001funky R&B \u6216 indie R&B\u3002')
      )
      return
    }
    const playlist =
      recommendation.playlist ??
      (batchTracks.length > 1
        ? {
            id: createId('youtube-search'),
            source: primaryTrack?.source ?? recommendation.source,
            title: recommendation.searchQuery ?? 'YouTube recommendations',
            tracks: primaryTrack ? putTrackFirst(batchTracks, primaryTrack) : batchTracks
          }
        : undefined)
    const content = recommendation.reason || 'momo found a track for this moment.'

    await appendMessage({
      id: createId('music'),
      role: 'momo',
      type: 'music_card',
      content,
      timestamp: Date.now(),
      musicRecommendation: {
        ...recommendation,
        primaryTrack,
        playlist,
        targetWuxing: recommendation.targetWuxing ?? response.emotionTag
      },
      meta: {
        emotionDetected: response.emotionDetected,
        emotionTag: response.emotionTag
      }
    })
  }

  async function appendHealingInvite(response: MomoResponse): Promise<Message | undefined> {
    if (!response.emotionTag) {
      return undefined
    }

    const mapping = WUXING_MAPPINGS[response.emotionTag]
    const message: Message = {
      id: createId('healing'),
      role: 'momo',
      type: 'healing_invite',
      content: response.say || getHealingInviteFallbackCopy(),
      timestamp: Date.now(),
      healingTrigger: {
        targetOrgan: mapping.organ,
        targetWuxing: response.emotionTag
      },
      meta: {
        emotionDetected: response.emotionDetected,
        emotionTag: response.emotionTag
      }
    }

    await appendMessage(message)
    return message
  }

  async function respondToHealingInvite(action: 'start' | 'later', targetWuxing: WuxingType): Promise<void> {
    if (action === 'later') {
      healingConversationActive.value = true
      healingMusicDeclinedAt.value = Date.now()
    } else {
      healingConversationActive.value = false
      healingMusicDeclinedAt.value = null
    }

    const content =
      action === 'start'
        ? '我把音乐放上了。你不用一下子讲清楚全部，先从最堵的那一小块开始：刚刚让你最难受的是一句话、一个人，还是一件事？如果里面有委屈或怨气，也可以先把最不公平的那部分说出来。'
        : '好，那我们先不放音乐。我还是在这里陪你慢慢拆开这团难受：现在最顶着你的，是委屈、愤怒，还是一种说不出来的累？'

    await appendMessage(
      createTextMessage('momo', content, {
        emotionDetected: 'strong_negative',
        emotionTag: targetWuxing
      })
    )
  }

  function getHealingInviteFallbackCopy(): string {
    return '我听见你现在真的很不好受。我们可以一边听一点更安静的音乐，一边慢慢聊；不用急着整理好，你只要从最难受的地方开始就好。'
  }

  function ensureMusicRecommendation(response: MomoResponse, userText: string | undefined): MusicRecommendation | undefined {
    if (response.musicRecommendation || !hasExplicitMusicIntent(userText)) {
      return response.musicRecommendation
    }

    return {
      scenario: 'user-requested',
      source: 'youtube',
      searchQuery: buildMusicSearchQuery(userText),
      reason: '先听这组，风格不会太硬，适合慢慢试口味。',
      targetWuxing: response.emotionTag
    }
  }

  function shouldShowMusicCard(response: MomoResponse, hasMusicIntent: boolean): boolean {
    if (!response.shouldRecommendMusic || !response.musicRecommendation) {
      return false
    }

    if (hasMusicIntent) {
      return true
    }

    return false
  }

  function shouldShowHealingInvite(
    response: MomoResponse,
    hasMusicIntent: boolean,
    showMusicCard: boolean,
    userText: string | undefined
  ): boolean {
    if (!response.shouldOfferHealing || !response.emotionTag || showMusicCard) {
      return false
    }

    if (isHealingInviteSuppressed(userText)) {
      return false
    }

    return !hasMusicIntent
  }

  function isHealingInviteSuppressed(userText: string | undefined): boolean {
    const playerStore = usePlayerStore()
    if (playerStore.isHealingMode) {
      return true
    }

    if (!healingConversationActive.value) {
      return false
    }

    if (hasExplicitHealingRequest(userText)) {
      healingConversationActive.value = false
      healingMusicDeclinedAt.value = null
      return false
    }

    if (healingMusicDeclinedAt.value && Date.now() - healingMusicDeclinedAt.value < HEALING_DECLINE_COOLDOWN_MS) {
      return true
    }

    healingConversationActive.value = false
    healingMusicDeclinedAt.value = null
    return false
  }

  function hasExplicitMusicIntent(userText: string | undefined): boolean {
    const text = userText?.toLowerCase() ?? ''
    return MUSIC_INTENT_KEYWORDS.some((keyword) => text.includes(keyword))
  }

  function hasExplicitHealingRequest(userText: string | undefined): boolean {
    const text = userText?.toLowerCase() ?? ''
    return ['开始疗愈', '放点音乐', '放音乐', '听音乐', '疗愈音乐', '还是放', '来点音乐', 'play music'].some((keyword) =>
      text.includes(keyword)
    )
  }

  function buildMusicSearchQuery(userText: string | undefined): string {
    const text = userText?.toLowerCase() ?? ''
    const previousQuery = findPreviousMusicSearchQuery()
    if (isReplacementMusicRequest(text) && previousQuery) {
      return `${getBaseSearchQuery(previousQuery)} ${getReplacementSearchVariant()} live radio chill stream`.replace(/\s+/g, ' ').trim()
    }

    const styles = [
      text.includes('r&b') || text.includes('rnb') ? 'R&B soul' : '',
      text.includes('pop') ? 'pop' : '',
      text.includes('\u6d3b\u6cfc') ? 'upbeat' : '',
      text.includes('\u590f') ? 'summer' : '',
      text.includes('summer') ? 'summer' : '',
      text.includes('radio') ? 'live radio' : ''
    ].filter(Boolean)

    return `${styles.join(' ') || 'daily'} live radio chill stream`.replace(/\s+/g, ' ').trim()
  }

  function isReplacementMusicRequest(text: string): boolean {
    return ['\u6362\u4e00\u9996', '\u6362\u4e00\u4e2a', '\u6362\u4e2a', '\u4e0d\u597d\u542c', '\u542c\u8fc7'].some((keyword) => text.includes(keyword))
  }

  function findPreviousMusicSearchQuery(): string | undefined {
    return [...messages.value]
      .reverse()
      .map((message) => message.musicRecommendation?.searchQuery)
      .find((query): query is string => Boolean(query))
  }

  function getReplacementSearchVariant(): string {
    const variants = ['neo soul groove', 'funky rnb radio', 'indie rnb station', 'modern soul lounge', 'urban soul live']
    const replacementCount = getConsecutiveReplacementCount()
    return variants[replacementCount % variants.length]
  }

  function getConsecutiveReplacementCount(): number {
    let count = 0
    for (const message of [...messages.value].reverse()) {
      if (message.role !== 'user') {
        continue
      }

      if (!isReplacementMusicRequest(message.content.toLowerCase())) {
        break
      }

      count += 1
    }

    return count
  }

  function getBaseSearchQuery(query: string): string {
    return query
      .replace(/\b(neo soul groove|funky rnb radio|indie rnb station|modern soul lounge|urban soul live|different)\b/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  function selectRecommendationBatch(tracks: Track[]): Track[] {
    const playerStore = usePlayerStore()
    const currentTrack = playerStore.currentTrack
    const usedTracks = [
      ...messages.value.flatMap((message) => {
        const recommendation = message.musicRecommendation
        if (!recommendation) {
          return []
        }

        return recommendation.playlist?.tracks ?? (recommendation.primaryTrack ? [recommendation.primaryTrack] : [])
      }),
      ...(currentTrack ? [currentTrack] : [])
    ]
    const usedIds = new Set(
      usedTracks.flatMap((track) => [track.id, track.youtubeId, track.neteaseId].filter((id): id is string => Boolean(id)))
    )
    const usedFingerprints = new Set(usedTracks.flatMap(getTrackFingerprints))

    const freshTracks = tracks.filter((track) => {
      const isUsedId = [track.id, track.youtubeId, track.neteaseId].some((id) => id && usedIds.has(id))
      const isUsedSimilarTrack = getTrackFingerprints(track).some((fingerprint) => usedFingerprints.has(fingerprint))
      return !isUsedId && !isUsedSimilarTrack
    })
    return freshTracks.slice(0, RECOMMENDATION_BATCH_SIZE)
  }

  function putTrackFirst(tracks: Track[], primaryTrack: Track): Track[] {
    const primaryIds = new Set([primaryTrack.id, primaryTrack.youtubeId, primaryTrack.neteaseId].filter((id): id is string => Boolean(id)))
    return [primaryTrack, ...tracks.filter((track) => ![track.id, track.youtubeId, track.neteaseId].some((id) => id && primaryIds.has(id)))]
  }

  function getTrackFingerprints(track: Track): string[] {
    return [
      `${normalizeTrackText(track.artist)}::${normalizeTrackTitle(track.title)}`,
      track.thumbnailUrl ? `thumb::${normalizeThumbnailUrl(track.thumbnailUrl)}` : ''
    ].filter(Boolean)
  }

  function normalizeTrackTitle(title: string): string {
    return normalizeTrackText(title)
      .replace(/\br(&amp;|&)b\b/g, 'rnb')
      .replace(/\b(healing|relaxing|soulful|smooth|love|songs?|playlist|mix|radio|live|chill|vibes?|summer|background)\b/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  function normalizeTrackText(value: string): string {
    return value
      .toLowerCase()
      .replace(/&amp;/g, '&')
      .replace(/[^a-z0-9\u4e00-\u9fff]+/g, ' ')
      .trim()
  }

  function normalizeThumbnailUrl(value: string): string {
    return value.replace(/\/(default|mqdefault|hqdefault|sddefault|maxresdefault)\.jpg.*$/i, '')
  }

  async function refreshLongTermMemory(): Promise<void> {
    const now = Date.now()
    const sevenDays = 7 * 24 * 60 * 60 * 1000
    if (now - profile.value.longTermMemoryUpdatedAt < sevenDays || messages.value.length === 0) {
      return
    }

    const nextMemory = await createMomoService().generateLongTermMemory(messages.value, profile.value.longTermMemory)
    if (nextMemory === profile.value.longTermMemory) {
      return
    }

    profile.value = {
      ...profile.value,
      longTermMemory: nextMemory,
      longTermMemoryUpdatedAt: now
    }
    await profileRepo.save(profile.value)
  }

  return {
    messages,
    orderedMessages,
    isMomoTyping,
    inputText,
    hasInitialized,
    hasGreetedToday,
    initialize,
    greetIfNeeded,
    sendMessage,
    appendMessage,
    clearHistory,
    triggerHealingScenarioTest,
    respondToHealingInvite
  }
})
