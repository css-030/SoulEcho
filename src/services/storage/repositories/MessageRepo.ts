import type { Message } from '@/types/message'

import { db } from '../db'

export class MessageRepo {
  async save(message: Message): Promise<void> {
    await db.messages.put(message)
  }

  async loadRecent(limit: number): Promise<Message[]> {
    const messages = await db.messages.orderBy('timestamp').reverse().limit(limit).toArray()
    return messages.reverse()
  }

  async loadAll(): Promise<Message[]> {
    return db.messages.orderBy('timestamp').toArray()
  }

  async clear(): Promise<void> {
    await db.messages.clear()
  }
}

export const messageRepo = new MessageRepo()
