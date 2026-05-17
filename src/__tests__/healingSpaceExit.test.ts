import { describe, expect, it } from 'vitest'

import source from '@/views/HealingSpaceView.vue?raw'

describe('HealingSpaceView exit button', () => {
  it('leaves immersive mode without completing the session', () => {
    expect(source).toContain('@click="leaveHealingSpace()"')
    expect(source).not.toContain('@click="leaveHealingSpace({ completeSession: true })">退出</button>')
  })
})
