import { describe, expect, it } from 'vitest'

import { isStorageQuotaExceeded } from '@/services/storage/storageErrors'

describe('storageErrors', () => {
  it('detects browser quota errors', () => {
    expect(isStorageQuotaExceeded(new DOMException('full', 'QuotaExceededError'))).toBe(true)
  })

  it('ignores unrelated errors', () => {
    expect(isStorageQuotaExceeded(new Error('network failed'))).toBe(false)
  })
})
