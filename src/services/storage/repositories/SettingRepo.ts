import { getAppEnv } from '@/services/config/env'
import type { UserSettings } from '@/types/settings'

import { db, type SettingsEntity } from '../db'

function toStoredSettings(settings: UserSettings): UserSettings {
  return {
    userNickname: settings.userNickname,
    momoName: settings.momoName,
    momoStyle: settings.momoStyle,
    momoLength: settings.momoLength,
    recommendFrequency: settings.recommendFrequency,
    sourceLock: settings.sourceLock,
    openaiApiKey: settings.openaiApiKey,
    youtubeApiKey: settings.youtubeApiKey,
    neteaseApiUrl: settings.neteaseApiUrl,
    neteaseCookie: settings.neteaseCookie,
    openweatherApiKey: settings.openweatherApiKey,
    openweatherDefaultCity: settings.openweatherDefaultCity,
    musicTasteProfile: settings.musicTasteProfile
      ? {
          source: settings.musicTasteProfile.source,
          updatedAt: settings.musicTasteProfile.updatedAt,
          sampledTrackCount: settings.musicTasteProfile.sampledTrackCount,
          likedPlaylistId: settings.musicTasteProfile.likedPlaylistId,
          topArtists: [...settings.musicTasteProfile.topArtists],
          styleTags: [...settings.musicTasteProfile.styleTags],
          languageHints: [...settings.musicTasteProfile.languageHints],
          seedTracks: [...settings.musicTasteProfile.seedTracks],
          searchBias: settings.musicTasteProfile.searchBias
        }
      : undefined,
    lastGreetedAt: settings.lastGreetedAt
  }
}

export class SettingRepo {
  getDefault(): UserSettings {
    const env = getAppEnv()

    return {
      userNickname: '宝贝',
      momoName: 'momo',
      momoStyle: 'gentle_sister',
      momoLength: 'medium',
      recommendFrequency: 'every_open',
      sourceLock: 'auto',
      openaiApiKey: env.openaiApiKey,
      youtubeApiKey: env.youtubeApiKey,
      neteaseApiUrl: env.neteaseApiUrl,
      openweatherApiKey: env.openweatherApiKey,
      openweatherDefaultCity: env.openweatherDefaultCity,
      lastGreetedAt: 0
    }
  }

  async load(): Promise<UserSettings> {
    const saved = await db.settings.get('singleton')
    if (!saved) {
      return this.getDefault()
    }

    const { id: _id, ...settings } = saved
    return {
      ...this.getDefault(),
      ...settings
    }
  }

  async save(settings: UserSettings): Promise<void> {
    const entity: SettingsEntity = {
      id: 'singleton',
      ...toStoredSettings(settings)
    }

    await db.settings.put(entity)
  }
}

export const settingRepo = new SettingRepo()
