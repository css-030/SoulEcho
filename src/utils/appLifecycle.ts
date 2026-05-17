interface ShouldGreetAfterReturnOptions {
  hiddenAt: number | null
  hadPageExit: boolean
}

export function shouldGreetAfterReturn({
  hiddenAt,
  hadPageExit
}: ShouldGreetAfterReturnOptions): boolean {
  if (hiddenAt === null) {
    return false
  }

  return hadPageExit
}
