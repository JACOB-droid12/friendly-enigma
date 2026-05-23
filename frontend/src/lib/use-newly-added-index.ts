import { useEffect, useRef, useState } from "react"

/**
 * Track which list index was most recently added to a controlled array,
 * so a list editor can apply an entrance animation to only that row.
 *
 * Returns the index of the freshly added entry while the entrance
 * animation is playing, then clears back to `null`. This keeps existing
 * rows from re-animating on every state update (typing into another
 * row would otherwise re-trigger the whole list).
 *
 * Contract:
 *   - On initial mount, returns null. The initial rows do not animate.
 *   - When `length` grows, returns `length - 1` for `holdMs` ms, then null.
 *   - When `length` shrinks or stays equal, returns null.
 *
 * The component is responsible for using `key` values that follow the
 * row identity so React doesn't tear down rows above the insertion
 * point (push-to-end is the safe pattern).
 */
export function useNewlyAddedIndex(length: number, holdMs = 220): number | null {
  const prevLength = useRef(length)
  const [freshIndex, setFreshIndex] = useState<number | null>(null)

  useEffect(() => {
    if (length > prevLength.current) {
      setFreshIndex(length - 1)
      const timer = window.setTimeout(() => setFreshIndex(null), holdMs)
      prevLength.current = length
      return () => window.clearTimeout(timer)
    }
    prevLength.current = length
  }, [length, holdMs])

  return freshIndex
}
