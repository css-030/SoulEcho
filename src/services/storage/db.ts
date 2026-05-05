import Dexie, { type Table } from 'dexie'

import type { EmotionRecord } from '@/types/emotion'
import type { FavoriteTrack } from '@/types/favorite'
import type { Message } from '@/types/message'
import type { UserProfile, UserSettings } from '@/types/settings'

export type SingletonId = 'singleton'
export type SettingsEntity = UserSettings & { id: SingletonId }
export type ProfileEntity = UserProfile & { id: SingletonId }

export class SoulEchoDB extends Dexie {
  messages!: Table<Message, string>
  emotions!: Table<EmotionRecord, string>
  favorites!: Table<FavoriteTrack, string>
  settings!: Table<SettingsEntity, SingletonId>
  profile!: Table<ProfileEntity, SingletonId>
  longTermMemory!: Table<{ id: string; summary: string; updatedAt: number }, string>

  constructor() {
    super('SoulEchoDB')

    this.version(1).stores({
      messages: 'id, role, type, timestamp',
      emotions: 'id, date, wuxingTag, timestamp, source',
      favorites: 'id, addedAt, wuxingTag, [youtubeId+neteaseId]',
      settings: 'id',
      profile: 'id',
      longTermMemory: 'id, updatedAt'
    })
  }
}

export const db = new SoulEchoDB()
