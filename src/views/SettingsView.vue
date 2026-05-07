<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { onBeforeRouteLeave, RouterLink } from 'vue-router'

import { analyzeMusicTaste, type TasteTrackInput } from '@/services/music/MusicTasteAnalyzer'
import { db, type ProfileEntity, type SettingsEntity } from '@/services/storage/db'
import { useChatStore } from '@/stores/chat'
import { useSettingsStore } from '@/stores/settings'
import type { EmotionRecord } from '@/types/emotion'
import type { FavoriteTrack } from '@/types/favorite'
import type { Message } from '@/types/message'
import type { MomoLength, MomoStyle, RecommendFrequency, SourceLock, UserSettings } from '@/types/settings'

interface Choice<T extends string> {
  value: T
  label: string
  hint: string
}

interface SettingsNavItem {
  id: string
  label: string
  hint: string
}

interface CityOption {
  label: string
  value: string
}

type SecretField = 'openaiApiKey' | 'youtubeApiKey' | 'openweatherApiKey'
type CheckState = 'idle' | 'checking' | 'valid' | 'invalid' | 'error'

interface NeteaseLoginStatus {
  data?: {
    code?: number
    profile?: {
      nickname?: string
      userId?: number
    } | null
    account?: {
      id?: number
      anonimousUser?: boolean
    } | null
  }
}

interface NeteasePlaylistSummary {
  id: number
  name: string
  specialType?: number
  trackCount?: number
}

interface NeteaseUserPlaylistResponse {
  playlist?: NeteasePlaylistSummary[]
}

interface NeteasePlaylistDetailResponse {
  playlist?: {
    tracks?: Array<{
      id?: number
      name?: string
      artists?: Array<{ name?: string }>
      ar?: Array<{ name?: string }>
    }>
    trackIds?: Array<{
      id?: number
    }>
  }
}

interface NeteasePlaylistTrackAllResponse {
  songs?: Array<{
    id?: number
    name?: string
    artists?: Array<{ name?: string }>
    ar?: Array<{ name?: string }>
  }>
}

const settingsStore = useSettingsStore()
const chatStore = useChatStore()
const isLoaded = ref(false)
const saveState = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')
const isClearDialogOpen = ref(false)
const isImporting = ref(false)
const importInputRef = ref<HTMLInputElement | null>(null)
const hasLoadedDraft = ref(false)
const isCityMenuOpen = ref(false)
const neteaseCookieState = ref<CheckState>('idle')
const neteaseCookieMessage = ref('')
const neteaseLikedState = ref<CheckState>('idle')
const neteaseLikedMessage = ref('')
const musicTasteState = ref<CheckState>('idle')
const musicTasteMessage = ref('')
const lastNeteaseCookieForAutoTaste = ref<string | undefined>()
const isSavingMusicTasteProfile = ref(false)
let saveTimer: number | undefined
let musicTasteRefreshTimer: number | undefined

const draft = reactive<UserSettings>(settingsStore.settings)
const secretVisibility = reactive<Record<SecretField, boolean>>({
  openaiApiKey: false,
  youtubeApiKey: false,
  openweatherApiKey: false
})

const navItems: SettingsNavItem[] = [
  { id: 'identity', label: '称呼', hint: '你和 momo 的名字' },
  { id: 'persona', label: '说话方式', hint: '风格与回复长度' },
  { id: 'behavior', label: '推荐行为', hint: '主动问候与音乐源' },
  { id: 'local-services', label: '本地服务', hint: 'Key、Cookie、API 地址' },
  { id: 'local-data', label: '本地数据', hint: '导出、导入、清空' }
]

const momoStyleChoices: Choice<MomoStyle>[] = [
  { value: 'gentle_sister', label: '温柔姐姐', hint: '轻轻接住情绪，适合日常陪伴' },
  { value: 'lively_girl', label: '元气少女', hint: '更明亮一点，适合需要被带动时' },
  { value: 'calm_doctor', label: '安静医师', hint: '克制、稳定，少一点情绪化表达' },
  { value: 'neutral', label: '自然中性', hint: '少人设，更像普通朋友聊天' }
]

const momoLengthChoices: Choice<MomoLength>[] = [
  { value: 'short', label: '短', hint: '1-2 句，快速回应' },
  { value: 'medium', label: '中', hint: '默认节奏，兼顾陪伴和信息量' },
  { value: 'long', label: '长', hint: '更细致，适合想慢慢聊的时候' }
]

const recommendFrequencyChoices: Choice<RecommendFrequency>[] = [
  { value: 'every_open', label: '每次打开', hint: 'momo 每次打开 app 都可以主动问候' },
  { value: 'once_per_day', label: '每天一次', hint: '同一天只主动问候一次' },
  { value: 'never', label: '不主动', hint: '只在你发消息后回应' }
]

const sourceLockChoices: Choice<SourceLock>[] = [
  { value: 'auto', label: '智能选择', hint: '日常走 YouTube，疗愈走网易云' },
  { value: 'youtube_only', label: '只用 YouTube', hint: '适合日常 BGM 和电台流' },
  { value: 'netease_only', label: '只用网易云', hint: '适合本地网易云服务稳定时' }
]

const chinaCityOptions: CityOption[] = [
  { label: '广州', value: 'Guangzhou' },
  { label: '北京', value: 'Beijing' },
  { label: '上海', value: 'Shanghai' },
  { label: '深圳', value: 'Shenzhen' },
  { label: '杭州', value: 'Hangzhou' },
  { label: '南京', value: 'Nanjing' },
  { label: '苏州', value: 'Suzhou' },
  { label: '成都', value: 'Chengdu' },
  { label: '武汉', value: 'Wuhan' },
  { label: '西安', value: 'Xian' },
  { label: '重庆', value: 'Chongqing' },
  { label: '天津', value: 'Tianjin' },
  { label: '郑州', value: 'Zhengzhou' },
  { label: '长沙', value: 'Changsha' },
  { label: '青岛', value: 'Qingdao' },
  { label: '厦门', value: 'Xiamen' },
  { label: '福州', value: 'Fuzhou' },
  { label: '济南', value: 'Jinan' },
  { label: '合肥', value: 'Hefei' },
  { label: '宁波', value: 'Ningbo' },
  { label: '无锡', value: 'Wuxi' },
  { label: '佛山', value: 'Foshan' },
  { label: '东莞', value: 'Dongguan' },
  { label: '珠海', value: 'Zhuhai' },
  { label: '南宁', value: 'Nanning' },
  { label: '海口', value: 'Haikou' },
  { label: '三亚', value: 'Sanya' },
  { label: '昆明', value: 'Kunming' },
  { label: '贵阳', value: 'Guiyang' },
  { label: '南昌', value: 'Nanchang' },
  { label: '太原', value: 'Taiyuan' },
  { label: '石家庄', value: 'Shijiazhuang' },
  { label: '沈阳', value: 'Shenyang' },
  { label: '大连', value: 'Dalian' },
  { label: '长春', value: 'Changchun' },
  { label: '哈尔滨', value: 'Harbin' },
  { label: '兰州', value: 'Lanzhou' },
  { label: '乌鲁木齐', value: 'Urumqi' },
  { label: '香港', value: 'Hong Kong' },
  { label: '澳门', value: 'Macao' },
  { label: '台北', value: 'Taipei' }
]

const statusText = computed(() => {
  if (saveState.value === 'saving') {
    return '正在保存...'
  }

  if (saveState.value === 'saved') {
    return '已保存'
  }

  if (saveState.value === 'error') {
    return '保存失败，请稍后再试'
  }

  return '设置会自动保存'
})

const hasOpenAiKey = computed(() => Boolean(draft.openaiApiKey?.trim()))
const hasNeteaseCookie = computed(() => Boolean(draft.neteaseCookie?.trim()))
const musicTasteSummary = computed(() => {
  const profile = draft.musicTasteProfile
  if (!profile) {
    return ''
  }

  const tags = profile.styleTags.slice(0, 4).join(' / ') || '暂未识别明显风格'
  const artists = profile.topArtists.slice(0, 4).join(' / ') || '暂未识别常听歌手'
  return `已分析 ${profile.sampledTrackCount} 首：${tags}；常听 ${artists}`
})

onMounted(async () => {
  document.body.dataset.scene = 'chat'
  if (!settingsStore.isLoaded) {
    await settingsStore.initialize()
  }

  Object.assign(draft, settingsStore.settings)
  lastNeteaseCookieForAutoTaste.value = normalizeSettings(settingsStore.settings).neteaseCookie
  hasLoadedDraft.value = true
  isLoaded.value = true
})

onBeforeRouteLeave(async () => {
  if (musicTasteRefreshTimer) {
    window.clearTimeout(musicTasteRefreshTimer)
    musicTasteRefreshTimer = undefined
  }

  await flushPendingSave()
})

watch(
  draft,
  () => {
    if (!hasLoadedDraft.value) {
      return
    }

    queueSave()
  },
  { deep: true }
)

function queueSave(): void {
  saveState.value = 'saving'
  if (saveTimer) {
    window.clearTimeout(saveTimer)
  }

  saveTimer = window.setTimeout(() => {
    void saveSettings()
  }, 450)
}

async function saveSettings(): Promise<void> {
  try {
    const normalized = normalizeSettings(draft)
    await settingsStore.save(normalized)
    saveState.value = 'saved'
    queueMusicTasteRefreshForCookieChange(normalized)
  } catch (error) {
    console.error('[SettingsView] failed to save settings', error)
    saveState.value = 'error'
  }
}

async function flushPendingSave(): Promise<void> {
  if (saveTimer) {
    window.clearTimeout(saveTimer)
    saveTimer = undefined
  }

  if (!hasLoadedDraft.value || saveState.value === 'idle' || saveState.value === 'saved') {
    return
  }

  await saveSettings()
}

function queueMusicTasteRefreshForCookieChange(settings: UserSettings): void {
  if (isSavingMusicTasteProfile.value) {
    return
  }

  const nextCookie = settings.neteaseCookie
  if (nextCookie === lastNeteaseCookieForAutoTaste.value) {
    return
  }

  lastNeteaseCookieForAutoTaste.value = nextCookie
  if (musicTasteRefreshTimer) {
    window.clearTimeout(musicTasteRefreshTimer)
  }

  if (!nextCookie) {
    return
  }

  musicTasteRefreshTimer = window.setTimeout(() => {
    void refreshNeteaseLikedTaste(normalizeSettings(draft), 'auto')
  }, 1200)
}

function normalizeSettings(value: UserSettings): UserSettings {
  return {
    ...value,
    userNickname: value.userNickname.trim() || '宝宝',
    momoName: value.momoName.trim() || 'momo',
    neteaseApiUrl: value.neteaseApiUrl.trim() || 'http://localhost:3000',
    openaiApiKey: value.openaiApiKey?.trim() || undefined,
    youtubeApiKey: value.youtubeApiKey?.trim() || undefined,
    neteaseCookie: value.neteaseCookie?.trim() || undefined,
    openweatherApiKey: value.openweatherApiKey?.trim() || undefined,
    openweatherDefaultCity: value.openweatherDefaultCity.trim() || 'Guangzhou'
  }
}

async function clearConversationHistory(): Promise<void> {
  await chatStore.clearHistory()
  await settingsStore.resetGreetingHistory()
  isClearDialogOpen.value = false
}

async function exportLocalData(): Promise<void> {
  const payload = {
    exportedAt: new Date().toISOString(),
    version: 1,
    data: {
      messages: await db.messages.toArray(),
      emotions: await db.emotions.toArray(),
      favorites: await db.favorites.toArray(),
      settings: await db.settings.toArray(),
      profile: await db.profile.toArray(),
      longTermMemory: await db.longTermMemory.toArray()
    }
  }

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `soulecho-backup-${new Date().toISOString().slice(0, 10)}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

function openImportPicker(): void {
  importInputRef.value?.click()
}

function scrollToSection(id: string): void {
  document.getElementById(id)?.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  })
}

function selectCity(city: CityOption): void {
  draft.openweatherDefaultCity = city.value
  isCityMenuOpen.value = false
}

function toggleSecretVisibility(field: SecretField): void {
  secretVisibility[field] = !secretVisibility[field]
}

function createNeteaseUrl(settings: UserSettings, path: string): URL {
  const url = new URL(`${settings.neteaseApiUrl.replace(/\/$/, '')}${path}`)
  if (settings.neteaseCookie) {
    url.searchParams.set('cookie', settings.neteaseCookie)
  }
  url.searchParams.set('timestamp', String(Date.now()))
  return url
}

function getNeteaseSongArtists(song: { artists?: Array<{ name?: string }>; ar?: Array<{ name?: string }> }): string[] {
  return (song.artists ?? song.ar ?? []).map((artist) => artist.name?.trim()).filter((name): name is string => Boolean(name))
}

function mapNeteaseTasteTracks(songs: Array<{ name?: string; artists?: Array<{ name?: string }>; ar?: Array<{ name?: string }> }>): TasteTrackInput[] {
  return songs
    .map((song) => ({
      title: song.name?.trim() ?? '',
      artists: getNeteaseSongArtists(song)
    }))
    .filter((track) => track.title || track.artists.length > 0)
}

async function getNeteaseLoginUser(settings: UserSettings): Promise<{ userId: number; nickname?: string } | null> {
  const statusUrl = createNeteaseUrl(settings, '/login/status')
  const statusResponse = await fetch(statusUrl)
  if (!statusResponse.ok) {
    throw new Error(`NetEase status failed with ${statusResponse.status}`)
  }

  const status = (await statusResponse.json()) as NeteaseLoginStatus
  const userId = status.data?.profile?.userId ?? status.data?.account?.id
  const nickname = status.data?.profile?.nickname
  const isAnonymous = status.data?.account?.anonimousUser === true

  return status.data?.code === 200 && userId && !isAnonymous ? { userId, nickname } : null
}

async function getNeteaseLikedPlaylist(settings: UserSettings, userId: number): Promise<NeteasePlaylistSummary | null> {
  const playlistsUrl = createNeteaseUrl(settings, '/user/playlist')
  playlistsUrl.searchParams.set('uid', String(userId))
  const playlistsResponse = await fetch(playlistsUrl)
  if (!playlistsResponse.ok) {
    throw new Error(`NetEase user playlist failed with ${playlistsResponse.status}`)
  }

  const playlistsData = (await playlistsResponse.json()) as NeteaseUserPlaylistResponse
  return (
    (playlistsData.playlist ?? []).find((playlist) => {
      const name = playlist.name?.toLowerCase() ?? ''
      return playlist.specialType === 5 || name.includes('喜欢') || name.includes('liked')
    }) ?? null
  )
}

async function fetchNeteaseLikedTracks(settings: UserSettings, playlistId: number): Promise<TasteTrackInput[]> {
  const detailUrl = createNeteaseUrl(settings, '/playlist/detail')
  detailUrl.searchParams.set('id', String(playlistId))
  const detailResponse = await fetch(detailUrl)
  if (detailResponse.ok) {
    const detail = (await detailResponse.json()) as NeteasePlaylistDetailResponse
    const detailTracks = mapNeteaseTasteTracks(detail.playlist?.tracks ?? [])
    if (detailTracks.length > 0) {
      return detailTracks.slice(0, 100)
    }
  }

  const allTracksUrl = createNeteaseUrl(settings, '/playlist/track/all')
  allTracksUrl.searchParams.set('id', String(playlistId))
  allTracksUrl.searchParams.set('limit', '100')

  const allTracksResponse = await fetch(allTracksUrl)
  if (!allTracksResponse.ok) {
    throw new Error(`网易云歌曲列表接口返回 ${allTracksResponse.status}`)
  }

  const allTracksData = (await allTracksResponse.json()) as NeteasePlaylistTrackAllResponse
  return mapNeteaseTasteTracks(allTracksData.songs ?? []).slice(0, 100)
}

async function checkNeteaseCookie(): Promise<void> {
  const settings = normalizeSettings(draft)
  if (!settings.neteaseCookie) {
    neteaseCookieState.value = 'invalid'
    neteaseCookieMessage.value = '还没有填写 Cookie'
    return
  }

  neteaseCookieState.value = 'checking'
  neteaseCookieMessage.value = '正在检测 Cookie...'

  try {
    const url = createNeteaseUrl(settings, '/login/status')

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`NetEase status failed with ${response.status}`)
    }

    const data = (await response.json()) as NeteaseLoginStatus
    const nickname = data.data?.profile?.nickname
    const isAnonymous = data.data?.account?.anonimousUser === true

    if (data.data?.code === 200 && nickname && !isAnonymous) {
      neteaseCookieState.value = 'valid'
      neteaseCookieMessage.value = `Cookie 有效，当前账号：${nickname}`
      return
    }

    neteaseCookieState.value = 'invalid'
    neteaseCookieMessage.value = 'Cookie 可能已失效，请重新获取'
  } catch {
    neteaseCookieState.value = 'error'
    neteaseCookieMessage.value = '检测失败，请确认本地网易云 API 服务已启动'
  }
}

async function checkNeteaseLikedPlaylist(): Promise<void> {
  const settings = normalizeSettings(draft)
  if (!settings.neteaseCookie) {
    neteaseLikedState.value = 'invalid'
    neteaseLikedMessage.value = '先填写网易云 Cookie'
    return
  }

  neteaseLikedState.value = 'checking'
  neteaseLikedMessage.value = '正在读取账号歌单...'

  try {
    const user = await getNeteaseLoginUser(settings)
    if (!user) {
      neteaseLikedState.value = 'invalid'
      neteaseLikedMessage.value = 'Cookie 可能已失效，暂时读不到账号'
      return
    }

    const likedPlaylist = await getNeteaseLikedPlaylist(settings, user.userId)

    if (!likedPlaylist) {
      neteaseLikedState.value = 'invalid'
      neteaseLikedMessage.value = '账号可读，但没有找到“我喜欢的音乐”歌单'
      return
    }

    const detailUrl = createNeteaseUrl(settings, '/playlist/detail')
    detailUrl.searchParams.set('id', String(likedPlaylist.id))
    const detailResponse = await fetch(detailUrl)
    if (!detailResponse.ok) {
      throw new Error(`NetEase playlist detail failed with ${detailResponse.status}`)
    }

    const detail = (await detailResponse.json()) as NeteasePlaylistDetailResponse
    const previewTracks = (detail.playlist?.tracks ?? []).map((track) => track.name).filter((name): name is string => Boolean(name))
    const trackCount = detail.playlist?.trackIds?.length ?? likedPlaylist.trackCount ?? previewTracks.length
    const preview = previewTracks.slice(0, 3).join('、')
    const accountText = user.nickname ? `${user.nickname} 的` : ''

    neteaseLikedState.value = 'valid'
    neteaseLikedMessage.value = preview
      ? `能拿到${accountText}“我喜欢的音乐”：${trackCount} 首，前几首：${preview}`
      : `能找到${accountText}“我喜欢的音乐”，共 ${trackCount} 首；歌曲详情可能需要稍后再试`
  } catch {
    neteaseLikedState.value = 'error'
    neteaseLikedMessage.value = '检测失败，请确认本地网易云 API 服务已启动'
  }
}

async function refreshNeteaseLikedTaste(settings: UserSettings, mode: 'manual' | 'auto'): Promise<void> {
  if (!settings.neteaseCookie) {
    musicTasteState.value = 'invalid'
    musicTasteMessage.value = '先填写网易云 Cookie'
    return
  }

  musicTasteState.value = 'checking'
  musicTasteMessage.value = mode === 'auto' ? '检测到 Cookie 更新，正在自动刷新音乐口味...' : '正在分析前 100 首喜欢的音乐...'

  try {
    const user = await getNeteaseLoginUser(settings)
    if (!user) {
      musicTasteState.value = 'invalid'
      musicTasteMessage.value = 'Cookie 可能已失效，暂时读不到账号'
      return
    }

    const likedPlaylist = await getNeteaseLikedPlaylist(settings, user.userId)
    if (!likedPlaylist) {
      musicTasteState.value = 'invalid'
      musicTasteMessage.value = '没有找到“我喜欢的音乐”歌单'
      return
    }

    const tracks = await fetchNeteaseLikedTracks(settings, likedPlaylist.id)
    if (tracks.length === 0) {
      musicTasteState.value = 'invalid'
      musicTasteMessage.value = '找到了歌单，但暂时没有读到歌曲'
      return
    }

    draft.musicTasteProfile = analyzeMusicTaste(tracks, { likedPlaylistId: String(likedPlaylist.id) })
    isSavingMusicTasteProfile.value = true
    try {
      await saveSettings()
    } finally {
      isSavingMusicTasteProfile.value = false
    }
    musicTasteState.value = 'valid'
    const summary = musicTasteSummary.value || '音乐口味画像已更新'
    musicTasteMessage.value = mode === 'auto' ? `Cookie 已更新，${summary}` : summary
  } catch (error) {
    musicTasteState.value = 'error'
    const reason = error instanceof Error ? error.message : '未知错误'
    musicTasteMessage.value = `分析失败：${reason}`
  }
}

async function analyzeNeteaseLikedTaste(): Promise<void> {
  await refreshNeteaseLikedTaste(normalizeSettings(draft), 'manual')
}

async function clearMusicTasteProfile(): Promise<void> {
  draft.musicTasteProfile = undefined
  musicTasteState.value = 'idle'
  musicTasteMessage.value = '音乐口味画像已清空'
  await saveSettings()
}

async function clearNeteaseCookie(): Promise<void> {
  draft.neteaseCookie = undefined
  lastNeteaseCookieForAutoTaste.value = undefined
  if (musicTasteRefreshTimer) {
    window.clearTimeout(musicTasteRefreshTimer)
    musicTasteRefreshTimer = undefined
  }
  neteaseCookieState.value = 'idle'
  neteaseCookieMessage.value = '网易云 Cookie 已清空'
  neteaseLikedState.value = 'idle'
  neteaseLikedMessage.value = ''
  draft.musicTasteProfile = undefined
  musicTasteState.value = 'idle'
  musicTasteMessage.value = ''
  await saveSettings()
}

async function importLocalData(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) {
    return
  }

  isImporting.value = true
  try {
    const text = await file.text()
    const payload = JSON.parse(text) as Partial<{
      data: {
        messages?: unknown[]
        emotions?: unknown[]
        favorites?: unknown[]
        settings?: unknown[]
        profile?: unknown[]
        longTermMemory?: unknown[]
      }
    }>
    const data = payload.data
    if (!data) {
      throw new Error('Invalid SoulEcho backup')
    }

    await db.transaction('rw', [db.messages, db.emotions, db.favorites, db.settings, db.profile, db.longTermMemory], async () => {
      await db.messages.bulkPut((data.messages ?? []) as Message[])
      await db.emotions.bulkPut((data.emotions ?? []) as EmotionRecord[])
      await db.favorites.bulkPut((data.favorites ?? []) as FavoriteTrack[])
      await db.settings.bulkPut((data.settings ?? []) as SettingsEntity[])
      await db.profile.bulkPut((data.profile ?? []) as ProfileEntity[])
      await db.longTermMemory.bulkPut((data.longTermMemory ?? []) as Array<{ id: string; summary: string; updatedAt: number }>)
    })

    await settingsStore.initialize()
    await chatStore.initialize()
    Object.assign(draft, settingsStore.settings)
    saveState.value = 'saved'
  } catch {
    saveState.value = 'error'
  } finally {
    input.value = ''
    isImporting.value = false
  }
}
</script>

<template>
  <main class="settings-view">
    <section class="settings-view__shell">
      <header class="settings-view__header">
        <div>
          <p class="settings-view__eyebrow">SoulEcho</p>
          <h1 class="settings-view__title">设置</h1>
        </div>

        <div class="settings-view__header-actions">
          <span class="settings-view__status" :class="`is-${saveState}`" aria-live="polite">{{ statusText }}</span>
          <RouterLink class="settings-view__back" to="/" aria-label="回到聊天">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 18 9 12l6-6" />
            </svg>
            回到聊天
          </RouterLink>
        </div>
      </header>

      <div v-if="!isLoaded" class="settings-view__loading">正在读取本地设置...</div>

      <div v-else class="settings-view__content">
        <aside class="settings-nav" aria-label="设置快捷导航">
          <p class="settings-nav__title">快捷导航</p>
          <button v-for="item in navItems" :key="item.id" class="settings-nav__item" type="button" @click="scrollToSection(item.id)">
            <span>{{ item.label }}</span>
            <small>{{ item.hint }}</small>
          </button>
        </aside>

        <form class="settings-form" @submit.prevent="saveSettings">
          <section id="identity" class="settings-section" aria-labelledby="identity-title">
            <div class="settings-section__intro">
              <h2 id="identity-title">称呼</h2>
              <p>这些会直接进入 momo 的对话上下文，保存后下一句就会生效。</p>
            </div>

            <div class="settings-section__body">
              <label class="field">
                <span class="field__label">你的称呼</span>
                <input v-model="draft.userNickname" class="field__control" type="text" autocomplete="nickname" />
              </label>

              <label class="field">
                <span class="field__label">momo 的名字</span>
                <input v-model="draft.momoName" class="field__control" type="text" autocomplete="off" />
              </label>
            </div>
          </section>

          <section id="persona" class="settings-section" aria-labelledby="persona-title">
            <div class="settings-section__intro">
              <h2 id="persona-title">momo 的说话方式</h2>
              <p>风格和长度会注入 prompt，不需要刷新页面。</p>
            </div>

            <div class="settings-section__body">
              <fieldset class="choice-group">
                <legend>回复风格</legend>
                <label v-for="choice in momoStyleChoices" :key="choice.value" class="choice-card">
                  <input v-model="draft.momoStyle" type="radio" name="momoStyle" :value="choice.value" />
                  <span>
                    <strong>{{ choice.label }}</strong>
                    <small>{{ choice.hint }}</small>
                  </span>
                </label>
              </fieldset>

              <fieldset class="segmented-group">
                <legend>回复长度</legend>
                <label v-for="choice in momoLengthChoices" :key="choice.value" class="segment">
                  <input v-model="draft.momoLength" type="radio" name="momoLength" :value="choice.value" />
                  <span>{{ choice.label }}</span>
                </label>
              </fieldset>
            </div>
          </section>

          <section id="behavior" class="settings-section" aria-labelledby="behavior-title">
            <div class="settings-section__intro">
              <h2 id="behavior-title">推荐行为</h2>
              <p>控制 momo 主动问候和音乐源偏好。</p>
            </div>

            <div class="settings-section__body">
              <fieldset class="choice-group">
                <legend>主动推荐频率</legend>
                <label v-for="choice in recommendFrequencyChoices" :key="choice.value" class="choice-card">
                  <input v-model="draft.recommendFrequency" type="radio" name="recommendFrequency" :value="choice.value" />
                  <span>
                    <strong>{{ choice.label }}</strong>
                    <small>{{ choice.hint }}</small>
                  </span>
                </label>
              </fieldset>

              <fieldset class="choice-group">
                <legend>默认音乐源</legend>
                <label v-for="choice in sourceLockChoices" :key="choice.value" class="choice-card">
                  <input v-model="draft.sourceLock" type="radio" name="sourceLock" :value="choice.value" />
                  <span>
                    <strong>{{ choice.label }}</strong>
                    <small>{{ choice.hint }}</small>
                  </span>
                </label>
              </fieldset>
            </div>
          </section>

          <section id="local-services" class="settings-section" aria-labelledby="api-title">
            <div class="settings-section__intro">
              <h2 id="api-title">本地服务</h2>
              <p>这些信息只保存在你的浏览器 IndexedDB，不会上传。</p>
            </div>

            <div class="settings-section__body">
              <div class="api-state" :class="{ 'is-ready': hasOpenAiKey }">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 3 4.5 6.5v5.7c0 4.5 3.1 7.3 7.5 8.8 4.4-1.5 7.5-4.3 7.5-8.8V6.5L12 3Z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                <span>{{ hasOpenAiKey ? 'OpenAI Key 已配置' : '还没有 OpenAI Key，聊天会进入友好兜底模式' }}</span>
              </div>

              <label class="field">
                <span class="field__label">OpenAI API Key</span>
                <span class="secret-field">
                  <input
                    v-model="draft.openaiApiKey"
                    class="field__control secret-field__control"
                    :type="secretVisibility.openaiApiKey ? 'text' : 'password'"
                    autocomplete="off"
                  />
                  <button
                    class="secret-field__toggle"
                    type="button"
                    :aria-label="secretVisibility.openaiApiKey ? '隐藏 OpenAI API Key' : '显示 OpenAI API Key'"
                    :aria-pressed="secretVisibility.openaiApiKey"
                    @click="toggleSecretVisibility('openaiApiKey')"
                  >
                    <svg v-if="secretVisibility.openaiApiKey" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M3 3l18 18" />
                      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                      <path d="M9.9 5.2A9.7 9.7 0 0 1 12 5c4.4 0 7.4 2.7 9 7a12.3 12.3 0 0 1-2.1 3.5" />
                      <path d="M6.4 6.5A12.2 12.2 0 0 0 3 12c1.6 4.3 4.6 7 9 7 1.3 0 2.5-.2 3.5-.7" />
                    </svg>
                    <svg v-else viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M3 12c1.6-4.3 4.6-7 9-7s7.4 2.7 9 7c-1.6 4.3-4.6 7-9 7s-7.4-2.7-9-7Z" />
                      <circle cx="12" cy="12" r="2.5" />
                    </svg>
                  </button>
                </span>
              </label>

              <label class="field">
                <span class="field__label">YouTube API Key</span>
                <span class="secret-field">
                  <input
                    v-model="draft.youtubeApiKey"
                    class="field__control secret-field__control"
                    :type="secretVisibility.youtubeApiKey ? 'text' : 'password'"
                    autocomplete="off"
                  />
                  <button
                    class="secret-field__toggle"
                    type="button"
                    :aria-label="secretVisibility.youtubeApiKey ? '隐藏 YouTube API Key' : '显示 YouTube API Key'"
                    :aria-pressed="secretVisibility.youtubeApiKey"
                    @click="toggleSecretVisibility('youtubeApiKey')"
                  >
                    <svg v-if="secretVisibility.youtubeApiKey" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M3 3l18 18" />
                      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                      <path d="M9.9 5.2A9.7 9.7 0 0 1 12 5c4.4 0 7.4 2.7 9 7a12.3 12.3 0 0 1-2.1 3.5" />
                      <path d="M6.4 6.5A12.2 12.2 0 0 0 3 12c1.6 4.3 4.6 7 9 7 1.3 0 2.5-.2 3.5-.7" />
                    </svg>
                    <svg v-else viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M3 12c1.6-4.3 4.6-7 9-7s7.4 2.7 9 7c-1.6 4.3-4.6 7-9 7s-7.4-2.7-9-7Z" />
                      <circle cx="12" cy="12" r="2.5" />
                    </svg>
                  </button>
                </span>
                <small class="field__hint">可选。填写后 YouTube 搜索会使用 YouTube Data API v3；不填则使用本地兜底曲库。</small>
              </label>

              <label class="field">
                <span class="field__label">网易云 API 地址</span>
                <input v-model="draft.neteaseApiUrl" class="field__control" type="url" autocomplete="url" />
              </label>

              <label class="field">
                <span class="field__label">网易云 Cookie</span>
                <textarea v-model="draft.neteaseCookie" class="field__control field__control--textarea" autocomplete="off" rows="4" />
                <small class="field__hint">可选。登录网易云网页版后手动复制 Cookie，会员歌曲会更容易拿到播放链接。</small>
              </label>

              <div class="cookie-actions">
                <button class="secondary-button" type="button" :disabled="neteaseCookieState === 'checking' || neteaseLikedState === 'checking'" @click="checkNeteaseCookie">
                  {{ neteaseCookieState === 'checking' ? '检测中...' : '检测 Cookie' }}
                </button>
                <button class="secondary-button" type="button" :disabled="!hasNeteaseCookie || neteaseCookieState === 'checking' || neteaseLikedState === 'checking'" @click="checkNeteaseLikedPlaylist">
                  {{ neteaseLikedState === 'checking' ? '读取中...' : '检测我喜欢的音乐' }}
                </button>
                <button class="secondary-button" type="button" :disabled="!hasNeteaseCookie || musicTasteState === 'checking'" @click="analyzeNeteaseLikedTaste">
                  {{ musicTasteState === 'checking' ? '分析中...' : '分析我的音乐口味' }}
                </button>
                <button class="secondary-button" type="button" :disabled="!draft.musicTasteProfile" @click="clearMusicTasteProfile">清空音乐口味</button>
                <button class="secondary-button" type="button" :disabled="!hasNeteaseCookie" @click="clearNeteaseCookie">清空 Cookie</button>
                <span v-if="neteaseCookieMessage" class="cookie-actions__status" :class="`is-${neteaseCookieState}`">
                  {{ neteaseCookieMessage }}
                </span>
                <span v-if="neteaseLikedMessage" class="cookie-actions__status" :class="`is-${neteaseLikedState}`">
                  {{ neteaseLikedMessage }}
                </span>
                <span v-if="musicTasteMessage || musicTasteSummary" class="cookie-actions__status cookie-actions__status--wide" :class="`is-${musicTasteState}`">
                  {{ musicTasteMessage || musicTasteSummary }}
                </span>
              </div>

              <label class="field">
                <span class="field__label">OpenWeather API Key</span>
                <span class="secret-field">
                  <input
                    v-model="draft.openweatherApiKey"
                    class="field__control secret-field__control"
                    :type="secretVisibility.openweatherApiKey ? 'text' : 'password'"
                    autocomplete="off"
                  />
                  <button
                    class="secret-field__toggle"
                    type="button"
                    :aria-label="secretVisibility.openweatherApiKey ? '隐藏 OpenWeather API Key' : '显示 OpenWeather API Key'"
                    :aria-pressed="secretVisibility.openweatherApiKey"
                    @click="toggleSecretVisibility('openweatherApiKey')"
                  >
                    <svg v-if="secretVisibility.openweatherApiKey" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M3 3l18 18" />
                      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                      <path d="M9.9 5.2A9.7 9.7 0 0 1 12 5c4.4 0 7.4 2.7 9 7a12.3 12.3 0 0 1-2.1 3.5" />
                      <path d="M6.4 6.5A12.2 12.2 0 0 0 3 12c1.6 4.3 4.6 7 9 7 1.3 0 2.5-.2 3.5-.7" />
                    </svg>
                    <svg v-else viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M3 12c1.6-4.3 4.6-7 9-7s7.4 2.7 9 7c-1.6 4.3-4.6 7-9 7s-7.4-2.7-9-7Z" />
                      <circle cx="12" cy="12" r="2.5" />
                    </svg>
                  </button>
                </span>
              </label>

              <label class="field">
                <span class="field__label">默认城市</span>
                <span class="city-combobox">
                  <input
                    v-model="draft.openweatherDefaultCity"
                    class="field__control city-combobox__input"
                    type="text"
                    autocomplete="address-level2"
                    @input="isCityMenuOpen = false"
                    @focus="isCityMenuOpen = false"
                  />
                  <button
                    class="city-combobox__toggle"
                    type="button"
                    :aria-expanded="isCityMenuOpen"
                    aria-label="选择中国城市"
                    @click="isCityMenuOpen = !isCityMenuOpen"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="m7 10 5 5 5-5" />
                    </svg>
                  </button>
                  <span v-if="isCityMenuOpen" class="city-combobox__menu" role="listbox">
                    <button
                      v-for="city in chinaCityOptions"
                      :key="city.value"
                      class="city-combobox__option"
                      type="button"
                      role="option"
                      :aria-selected="draft.openweatherDefaultCity === city.value"
                      @click="selectCity(city)"
                    >
                      <span>{{ city.label }}</span>
                      <small>{{ city.value }}</small>
                    </button>
                  </span>
                </span>
                <small class="field__hint">可以手动输入城市，也可以从候选里选择；常用中文城市会自动转换。</small>
              </label>
            </div>
          </section>

          <section id="local-data" class="settings-section settings-section--danger" aria-labelledby="data-title">
            <div class="settings-section__intro">
              <h2 id="data-title">本地数据</h2>
              <p>清空对话只会删除聊天消息；情绪花园、收藏和用户画像会保留。</p>
            </div>

            <div class="settings-section__body">
              <div class="data-actions">
                <button class="secondary-button" type="button" @click="exportLocalData">导出数据</button>
                <button class="secondary-button" type="button" :disabled="isImporting" @click="openImportPicker">
                  {{ isImporting ? '导入中...' : '导入数据' }}
                </button>
                <button class="danger-button" type="button" @click="isClearDialogOpen = true">清空对话历史</button>
              </div>

              <input ref="importInputRef" class="settings-view__file" type="file" accept="application/json" @change="importLocalData" />
            </div>
          </section>
        </form>
      </div>
    </section>

    <div v-if="isClearDialogOpen" class="dialog-backdrop" role="presentation">
      <section class="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="clear-title">
        <h2 id="clear-title">清空对话历史？</h2>
        <p>聊天记录会从本地删除，但情绪记录、收藏和用户画像会继续保留。</p>
        <div class="confirm-dialog__actions">
          <button class="secondary-button" type="button" @click="isClearDialogOpen = false">取消</button>
          <button class="danger-button" type="button" @click="clearConversationHistory">确认清空</button>
        </div>
      </section>
    </div>
  </main>
</template>

<style scoped>
.settings-view {
  min-height: 100vh;
  padding: var(--space-xl);
  background: linear-gradient(135deg, var(--bg-primary), var(--bg-secondary));
  color: var(--text-primary);
}

.settings-view__shell {
  width: min(100%, var(--app-shell-width));
  margin: 0 auto;
}

.settings-view__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-lg);
  min-height: var(--app-header-min-height);
  margin-bottom: var(--space-lg);
  padding: var(--app-header-padding);
}

.settings-view__eyebrow {
  margin: 0 0 var(--space-xs);
  color: var(--text-secondary);
  font-size: var(--app-brand-font-size);
  font-weight: var(--app-brand-font-weight);
}

.settings-view__title {
  margin: 0;
  font-family: var(--app-title-font);
  font-size: var(--app-title-size);
  letter-spacing: 0;
  line-height: var(--app-title-line-height);
}

.settings-view__header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.settings-view__status,
.settings-view__back,
.secondary-button,
.danger-button {
  min-height: 2.75rem;
  border-radius: var(--radius-pill);
  font-weight: 800;
}

.settings-view__status {
  display: inline-flex;
  align-items: center;
  padding: 0 var(--space-md);
  border: 1px solid var(--color-border);
  background: var(--bg-card);
  color: var(--text-secondary);
  box-shadow: var(--shadow-card);
}

.settings-view__status.is-saved {
  color: var(--color-balanced);
}

.settings-view__status.is-error {
  color: var(--color-danger);
}

.settings-view__back {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: 0 var(--space-md);
  border: 1px solid var(--color-border);
  background: color-mix(in srgb, var(--bg-card) 78%, var(--color-primary));
  color: var(--text-primary);
  text-decoration: none;
  box-shadow: var(--shadow-card);
  transition:
    background var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-out);
}

.settings-view__back:hover {
  background: color-mix(in srgb, var(--color-primary) 36%, var(--bg-card));
  transform: translateY(-1px);
}

.settings-view__back svg,
.api-state svg {
  width: 1.2rem;
  height: 1.2rem;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.settings-view__loading,
.settings-section {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: var(--bg-card);
  box-shadow: var(--shadow-card);
}

.settings-view__loading {
  padding: var(--space-xl);
}

.settings-view__content {
  display: grid;
  grid-template-columns: 10.75rem minmax(0, 1fr);
  gap: var(--space-md);
  align-items: start;
}

.settings-nav {
  position: sticky;
  top: var(--space-xl);
  display: grid;
  gap: var(--space-xs);
  padding: var(--space-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: var(--bg-card);
  box-shadow: var(--shadow-card);
}

.settings-nav__title {
  margin: 0 0 var(--space-xs);
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 800;
}

.settings-nav__item {
  display: grid;
  gap: 0.15rem;
  min-height: 3rem;
  padding: 0.58rem 0.68rem;
  border: 1px solid transparent;
  border-radius: var(--radius-lg);
  background: transparent;
  color: var(--text-primary);
  cursor: pointer;
  text-align: left;
  transition:
    border-color var(--duration-fast) var(--ease-out),
    background var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-out);
}

.settings-nav__item:hover,
.settings-nav__item:focus-visible {
  border-color: var(--color-border);
  background: color-mix(in srgb, var(--color-primary) 22%, var(--bg-card));
  outline: none;
  transform: translateX(2px);
}

.settings-nav__item span {
  font-weight: 900;
}

.settings-nav__item small {
  color: var(--text-secondary);
  line-height: 1.35;
}

.settings-form {
  display: grid;
  gap: var(--space-lg);
}

.settings-section {
  display: grid;
  grid-template-columns: minmax(9rem, 0.58fr) minmax(0, 1fr);
  gap: var(--space-md);
  padding: var(--space-lg);
  scroll-margin-top: var(--space-xl);
}

.settings-section__intro h2 {
  margin: 0 0 var(--space-xs);
  font-size: 1.15rem;
}

.settings-section__intro p {
  max-width: 14rem;
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.65;
}

.settings-section__body {
  display: grid;
  min-width: 0;
  align-content: start;
  gap: var(--space-md);
}

.field {
  display: grid;
  gap: var(--space-xs);
}

.field + .field,
.choice-group + .segmented-group,
.choice-group + .choice-group,
.api-state + .field {
  margin-top: 0;
}

.field__label,
.field__hint,
.choice-group legend,
.segmented-group legend {
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 800;
}

.field__hint {
  font-size: 0.78rem;
  font-weight: 700;
  line-height: 1.45;
}

.field__control {
  width: 100%;
  min-height: 3rem;
  padding: 0.75rem 0.95rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  outline: none;
  background: color-mix(in srgb, var(--bg-card) 82%, var(--bg-primary));
  color: var(--text-primary);
  transition:
    border-color var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out);
}

.field__control:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 20%, transparent);
}

.field__control--textarea {
  min-height: 7rem;
  resize: vertical;
}

.secret-field {
  position: relative;
  display: block;
}

.secret-field__control {
  padding-right: 3.35rem;
}

.secret-field__toggle {
  position: absolute;
  top: 0.35rem;
  right: 0.35rem;
  display: grid;
  width: 2.3rem;
  aspect-ratio: 1;
  place-items: center;
  border: 0;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition:
    background var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out);
}

.secret-field__toggle:hover,
.secret-field__toggle:focus-visible {
  background: color-mix(in srgb, var(--color-primary) 24%, transparent);
  color: var(--text-primary);
  outline: none;
}

.secret-field__toggle[aria-pressed='true'] {
  color: var(--color-primary);
}

.secret-field__toggle svg {
  width: 1.25rem;
  height: 1.25rem;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.city-combobox {
  position: relative;
  display: block;
}

.city-combobox__input {
  padding-right: 3.2rem;
}

.city-combobox__toggle {
  position: absolute;
  top: 0.35rem;
  right: 0.35rem;
  display: grid;
  width: 2.3rem;
  aspect-ratio: 1;
  place-items: center;
  border: 0;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
}

.city-combobox__toggle:hover,
.city-combobox__toggle:focus-visible {
  background: color-mix(in srgb, var(--color-primary) 24%, transparent);
  outline: none;
}

.city-combobox__toggle svg {
  width: 1.25rem;
  height: 1.25rem;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2.4;
}

.city-combobox__menu {
  position: absolute;
  top: calc(100% + var(--space-xs));
  right: 0;
  left: 0;
  z-index: 20;
  display: grid;
  max-height: 16rem;
  overflow-y: auto;
  padding: var(--space-xs);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--bg-card) 92%, white);
  box-shadow: var(--shadow-card);
}

.city-combobox__option {
  display: flex;
  min-height: 2.75rem;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  padding: 0 var(--space-md);
  border: 0;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-primary);
  cursor: pointer;
  font-weight: 800;
  text-align: left;
}

.city-combobox__option:hover,
.city-combobox__option[aria-selected='true'] {
  background: color-mix(in srgb, var(--color-primary) 26%, var(--bg-card));
}

.city-combobox__option small {
  color: var(--text-secondary);
  font-size: 0.78rem;
  font-weight: 700;
}

.choice-group,
.segmented-group {
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

.choice-group {
  display: grid;
  gap: var(--space-sm);
}

.choice-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: var(--space-sm);
  align-items: start;
  min-height: 4rem;
  padding: var(--space-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--bg-card) 80%, var(--bg-primary));
  cursor: pointer;
  transition:
    border-color var(--duration-fast) var(--ease-out),
    background var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-out);
}

.choice-card:hover {
  background: color-mix(in srgb, var(--color-primary) 18%, var(--bg-card));
  transform: translateY(-1px);
}

.choice-card input {
  width: 1.15rem;
  height: 1.15rem;
  margin-top: 0.15rem;
  accent-color: var(--color-accent);
}

.choice-card:has(input:checked) {
  border-color: var(--color-accent);
  background: color-mix(in srgb, var(--color-primary) 30%, var(--bg-card));
}

.choice-card strong,
.choice-card small {
  display: block;
}

.choice-card small {
  margin-top: var(--space-xs);
  color: var(--text-secondary);
  line-height: 1.5;
}

.segmented-group {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.segmented-group legend {
  width: 100%;
  margin-bottom: var(--space-xs);
}

.segment {
  position: relative;
  display: inline-flex;
  min-width: 5rem;
  min-height: 2.75rem;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  background: var(--bg-card);
  cursor: pointer;
  font-weight: 800;
}

.segment input {
  position: absolute;
  inset: 0;
  opacity: 0;
}

.segment:has(input:checked) {
  border-color: var(--color-accent);
  background: var(--color-accent);
  color: var(--bg-primary);
}

.api-state {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  min-height: 3rem;
  padding: 0 var(--space-md);
  border: 1px solid color-mix(in srgb, var(--color-danger) 32%, var(--color-border));
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--color-danger) 10%, var(--bg-card));
  color: var(--color-danger);
  font-weight: 800;
}

.api-state.is-ready {
  border-color: color-mix(in srgb, var(--color-balanced) 42%, var(--color-border));
  background: color-mix(in srgb, var(--color-balanced) 12%, var(--bg-card));
  color: var(--color-balanced);
}

.data-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.cookie-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-sm);
}

.cookie-actions__status {
  color: var(--text-secondary);
  font-size: 0.86rem;
  font-weight: 800;
}

.cookie-actions__status--wide {
  flex-basis: 100%;
  line-height: 1.45;
}

.cookie-actions__status.is-valid {
  color: var(--color-balanced);
}

.cookie-actions__status.is-invalid,
.cookie-actions__status.is-error {
  color: var(--color-danger);
}

.secondary-button,
.danger-button {
  padding: 0 var(--space-lg);
  border: 1px solid var(--color-border);
  cursor: pointer;
  transition:
    opacity var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-out);
}

.secondary-button {
  background: var(--bg-card);
  color: var(--text-secondary);
}

.danger-button {
  border-color: color-mix(in srgb, var(--color-danger) 42%, var(--color-border));
  background: color-mix(in srgb, var(--color-danger) 14%, var(--bg-card));
  color: var(--color-danger);
}

.secondary-button:hover,
.danger-button:hover {
  transform: translateY(-1px);
}

.secondary-button:disabled {
  cursor: wait;
  opacity: 0.62;
}

.settings-view__file {
  display: none;
}

.dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  place-items: center;
  padding: var(--space-lg);
  background: color-mix(in srgb, var(--text-primary) 35%, transparent);
}

.confirm-dialog {
  width: min(100%, 28rem);
  padding: var(--space-xl);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: var(--bg-card);
  color: var(--text-primary);
  box-shadow: var(--shadow-card);
}

.confirm-dialog h2 {
  margin: 0 0 var(--space-sm);
}

.confirm-dialog p {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.65;
}

.confirm-dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
  margin-top: var(--space-lg);
}

@media (prefers-reduced-motion: reduce) {
  .settings-view__back,
  .settings-nav__item,
  .choice-card,
  .secondary-button,
  .danger-button {
    transition: none;
  }
}

@media (max-width: 760px) {
  .settings-view {
    padding: var(--space-md);
  }

  .settings-view__header,
  .settings-view__content,
  .settings-section {
    grid-template-columns: 1fr;
  }

  .settings-nav {
    position: static;
    grid-auto-columns: minmax(9.5rem, 1fr);
    grid-auto-flow: column;
    overflow-x: auto;
    padding: var(--space-sm);
  }

  .settings-nav__title {
    display: none;
  }

  .settings-nav__item:hover,
  .settings-nav__item:focus-visible {
    transform: none;
  }

  .settings-view__header {
    align-items: flex-start;
    flex-direction: column;
  }

  .settings-view__header-actions {
    width: 100%;
    flex-wrap: wrap;
  }

  .settings-section {
    padding: var(--space-lg);
  }

  .settings-section__intro p {
    max-width: none;
  }
}
</style>
