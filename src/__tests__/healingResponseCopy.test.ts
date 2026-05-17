import { describe, expect, it } from 'vitest'

import { getHealingStartCopy } from '@/services/momo/HealingResponseCopy'

describe('HealingResponseCopy', () => {
  it('keeps the default healing start copy light for non-doctor styles', () => {
    expect(getHealingStartCopy('gentle_sister', 'wood')).toContain('我把音乐放上了')
    expect(getHealingStartCopy('gentle_sister', 'wood')).not.toContain('木对应肝')
  })

  it('explains wuxing and organ choice for calm doctor healing starts', () => {
    const copy = getHealingStartCopy('calm_doctor', 'wood')

    expect(copy).toContain('木气郁住了')
    expect(copy).toContain('木对应肝')
    expect(copy).toContain('偏角调')
    expect(copy).toContain('先帮那股绷紧的劲慢慢松一点')
  })
})
