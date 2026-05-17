import { describe, expect, it } from 'vitest'

import { shouldGreetAfterReturn } from '@/utils/appLifecycle'

describe('shouldGreetAfterReturn', () => {
  it('does not greet when the app was never hidden', () => {
    expect(
      shouldGreetAfterReturn({
        hiddenAt: null,
        hadPageExit: false
      })
    ).toBe(false)
  })

  it('greets immediately after an explicit page exit', () => {
    expect(
      shouldGreetAfterReturn({
        hiddenAt: 10_000,
        hadPageExit: true
      })
    ).toBe(true)
  })

  it('does not greet after a brief background switch', () => {
    expect(
      shouldGreetAfterReturn({
        hiddenAt: 10_000,
        hadPageExit: false
      })
    ).toBe(false)
  })

  it('does not greet after staying in the background for a long time', () => {
    expect(
      shouldGreetAfterReturn({
        hiddenAt: 10_000,
        hadPageExit: false
      })
    ).toBe(false)
  })
})
