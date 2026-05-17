import { describe, expect, it } from 'vitest'

import { formatChatTimestamp } from '@/utils/time'

describe('formatChatTimestamp', () => {
  it('shows only time for messages from today', () => {
    const now = new Date('2026-05-17T21:30:00+08:00').getTime()
    const messageTime = new Date('2026-05-17T09:08:00+08:00').getTime()

    expect(formatChatTimestamp(messageTime, now)).toBe('09:08')
  })

  it('shows month and day for earlier messages in the same year', () => {
    const now = new Date('2026-05-17T21:30:00+08:00').getTime()
    const messageTime = new Date('2026-05-16T09:08:00+08:00').getTime()

    expect(formatChatTimestamp(messageTime, now)).toBe('5/16 09:08')
  })

  it('shows year for messages from a different year', () => {
    const now = new Date('2026-05-17T21:30:00+08:00').getTime()
    const messageTime = new Date('2025-12-31T23:08:00+08:00').getTime()

    expect(formatChatTimestamp(messageTime, now)).toBe('2025/12/31 23:08')
  })
})
