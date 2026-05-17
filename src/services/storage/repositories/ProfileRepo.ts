import type { UserProfile } from '@/types/settings'

import { db, type ProfileEntity } from '../db'

export class ProfileRepo {
  getDefault(): UserProfile {
    return {
      musicPreferences: '',
      likedTrackIds: [],
      longTermMemory: '',
      longTermMemoryUpdatedAt: 0
    }
  }

  async load(): Promise<UserProfile> {
    const saved = await db.profile.get('singleton')
    if (!saved) {
      return this.getDefault()
    }

    const { id: _id, ...profile } = saved
    return profile
  }

  async save(profile: UserProfile): Promise<void> {
    const entity: ProfileEntity = {
      id: 'singleton',
      musicPreferences: profile.musicPreferences,
      likedTrackIds: [...profile.likedTrackIds],
      longTermMemory: profile.longTermMemory,
      longTermMemoryUpdatedAt: profile.longTermMemoryUpdatedAt
    }

    await db.profile.put(entity)
  }
}

export const profileRepo = new ProfileRepo()
