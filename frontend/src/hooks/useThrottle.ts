import { useState, useEffect, useRef } from "react"

export function useThrottle<T>(value: T, delay: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value)
  const lastExecuted = useRef<number>(Date.now())

  useEffect(() => {
    const now = Date.now()
    const timeSinceLastExecution = now - lastExecuted.current

    if (timeSinceLastExecution >= delay) {
      lastExecuted.current = now
      setThrottledValue(value)
    } else {
      const timerId = setTimeout(() => {
        lastExecuted.current = Date.now()
        setThrottledValue(value)
      }, delay - timeSinceLastExecution)

      return () => {
        clearTimeout(timerId)
      }
    }
  }, [value, delay])

  return throttledValue
}
