import { describe, expect, it, vi } from 'vitest'

const { put } = vi.hoisted(() => ({
  put: vi.fn(async (_profile: unknown) => undefined)
}))

vi.mock('@/services/storage/db', () => ({
  db: {
    profile: {
      put
    }
  }
}))

import { ProfileRepo } from '@/services/storage/repositories/ProfileRepo'
import type { ProfileEntity } from '@/services/storage/db'

describe('ProfileRepo', () => {
  it('stores a cloned likedTrackIds array', async () => {
    const likedTrackIds = ['track-1', 'track-2']
    const repo = new ProfileRepo()

    await repo.save({
      musicPreferences: '',
      likedTrackIds,
      longTermMemory: '',
      longTermMemoryUpdatedAt: 0
    })

    expect(put).toHaveBeenCalledWith({
      id: 'singleton',
      musicPreferences: '',
      likedTrackIds: ['track-1', 'track-2'],
      longTermMemory: '',
      longTermMemoryUpdatedAt: 0
    })
    const savedProfile = put.mock.calls[0]?.[0] as ProfileEntity | undefined
    expect(savedProfile).toBeDefined()
    expect(savedProfile?.likedTrackIds).not.toBe(likedTrackIds)
  })
})
