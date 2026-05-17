export function getDateKey(date = new Date()): string {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function isSameDay(a: number, b: number): boolean {
  return getDateKey(new Date(a)) === getDateKey(new Date(b))
}

export function formatChatTime(timestamp: number): string {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(timestamp)
}

export function formatChatTimestamp(timestamp: number, now = Date.now()): string {
  if (isSameDay(timestamp, now)) {
    return formatChatTime(timestamp)
  }

  const messageDate = new Date(timestamp)
  const nowDate = new Date(now)
  const isSameYear = messageDate.getFullYear() === nowDate.getFullYear()

  const date = new Intl.DateTimeFormat('zh-CN', {
    ...(isSameYear ? {} : { year: 'numeric' }),
    month: 'numeric',
    day: 'numeric'
  }).format(timestamp)

  return `${date} ${formatChatTime(timestamp)}`
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}
