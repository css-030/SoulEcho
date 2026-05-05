type YouTubeReadyCallback = () => void

declare global {
  interface Window {
    YT?: typeof YT
    onYouTubeIframeAPIReady?: YouTubeReadyCallback
  }
}

let readyPromise: Promise<typeof YT> | null = null

export function waitForYouTubeApi(): Promise<typeof YT> {
  if (window.YT?.Player) {
    return Promise.resolve(window.YT)
  }

  if (readyPromise) {
    return readyPromise
  }

  readyPromise = new Promise((resolve, reject) => {
    const previousCallback = window.onYouTubeIframeAPIReady
    const timeoutId = window.setTimeout(() => {
      reject(new Error('YouTube IFrame API loading timed out'))
    }, 10000)

    window.onYouTubeIframeAPIReady = () => {
      previousCallback?.()
      window.clearTimeout(timeoutId)
      if (window.YT?.Player) {
        resolve(window.YT)
      } else {
        reject(new Error('YouTube IFrame API is unavailable'))
      }
    }
  })

  return readyPromise
}
