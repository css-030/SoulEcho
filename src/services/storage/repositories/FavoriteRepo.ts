import type { FavoriteTrack } from '@/types/favorite'

import { db } from '../db'

export class FavoriteRepo {
  async save(favorite: FavoriteTrack): Promise<void> {
    await db.favorites.put(favorite)
  }

  async loadAll(): Promise<FavoriteTrack[]> {
    return db.favorites.orderBy('addedAt').reverse().toArray()
  }

  async findByTrackIds(opts: { youtubeId?: string; neteaseId?: string }): Promise<FavoriteTrack | undefined> {
    const favorites = await db.favorites.toArray()
    return favorites.find((favorite) => {
      const sameYoutube = opts.youtubeId && favorite.youtubeId === opts.youtubeId
      const sameNetease = opts.neteaseId && favorite.neteaseId === opts.neteaseId
      return Boolean(sameYoutube || sameNetease)
    })
  }

  async delete(id: string): Promise<void> {
    await db.favorites.delete(id)
  }
}

export const favoriteRepo = new FavoriteRepo()
