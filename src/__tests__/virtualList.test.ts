import { describe, expect, it } from 'vitest'

import { getVirtualWindow } from '@/utils/virtualList'

describe('getVirtualWindow', () => {
  it('keeps only the visible range plus overscan', () => {
    const window = getVirtualWindow({
      itemCount: 200,
      scrollTop: 500,
      viewportHeight: 300,
      getItemHeight: () => 100,
      overscan: 2
    })

    expect(window.startIndex).toBe(3)
    expect(window.endIndex).toBe(12)
    expect(window.topSpacerHeight).toBe(300)
    expect(window.bottomSpacerHeight).toBe(18_800)
  })
})
