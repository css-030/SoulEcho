export function isStorageQuotaExceeded(error: unknown): boolean {
  if (!(error instanceof DOMException)) {
    return false
  }

  return error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
}

export const STORAGE_QUOTA_MESSAGE =
  '本地空间好像快满了，这一条我暂时没能替你保存下来。可以先清理一点浏览器存储，再继续和我聊天。'
