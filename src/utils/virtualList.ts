export interface VirtualWindow {
  startIndex: number
  endIndex: number
  topSpacerHeight: number
  bottomSpacerHeight: number
}

interface VirtualWindowOptions {
  itemCount: number
  scrollTop: number
  viewportHeight: number
  getItemHeight: (index: number) => number
  overscan?: number
}

export function getVirtualWindow({
  itemCount,
  scrollTop,
  viewportHeight,
  getItemHeight,
  overscan = 4
}: VirtualWindowOptions): VirtualWindow {
  let startIndex = 0
  let topSpacerHeight = 0

  while (startIndex < itemCount) {
    const nextHeight = getItemHeight(startIndex)
    if (topSpacerHeight + nextHeight > scrollTop) {
      break
    }

    topSpacerHeight += nextHeight
    startIndex += 1
  }

  startIndex = Math.max(0, startIndex - overscan)
  topSpacerHeight = 0
  for (let index = 0; index < startIndex; index += 1) {
    topSpacerHeight += getItemHeight(index)
  }

  let endIndex = startIndex
  let renderedHeight = 0
  const targetHeight = viewportHeight + overscan * 2 * getItemHeight(startIndex)
  while (endIndex < itemCount && renderedHeight < targetHeight) {
    renderedHeight += getItemHeight(endIndex)
    endIndex += 1
  }

  endIndex = Math.min(itemCount, endIndex + overscan)

  let bottomSpacerHeight = 0
  for (let index = endIndex; index < itemCount; index += 1) {
    bottomSpacerHeight += getItemHeight(index)
  }

  return {
    startIndex,
    endIndex,
    topSpacerHeight,
    bottomSpacerHeight
  }
}
