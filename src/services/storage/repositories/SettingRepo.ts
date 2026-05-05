import { getAppEnv } from '@/services/config/env'
import type { UserSettings } from '@/types/settings'

import { db, type SettingsEntity } from '../db'

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
      neteaseApiUrl: env.neteaseApiUrl
    }
  }

  async load(): Promise<UserSettings> {
    const saved = await db.settings.get('singleton')
    if (!saved) {
      return this.getDefault()
    }

    const { id: _id, ...settings } = saved
    return settings
  }

  async save(settings: UserSettings): Promise<void> {
    const entity: SettingsEntity = {
      id: 'singleton',
      ...settings
    }

    await db.settings.put(entity)
  }
}

export const settingRepo = new SettingRepo()
