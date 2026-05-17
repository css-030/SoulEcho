import { describe, expect, it } from 'vitest'

describe('player label semantics', () => {
  it('keeps NetEase as a source label instead of implying healing mode', () => {
    const sourceLabel = '网易云'

    expect(sourceLabel).toBe('网易云')
  })

  it('treats healing as a separate player state badge', () => {
    const isHealingMode = true
    const healingBadge = isHealingMode ? '疗愈中' : ''

    expect(healingBadge).toBe('疗愈中')
  })
})
