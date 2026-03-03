export interface BackoffConfig {
  attempt: number
  baseDelay: number
  multiplier: number
  maxDelay?: number
}

const DEFAULT_MAX_DELAY = 30000

export function calculateBackoff(config: BackoffConfig): number {
  const { attempt, baseDelay, multiplier, maxDelay = DEFAULT_MAX_DELAY } = config

  // For attempt 0 or 1, return base delay
  const effectiveAttempt = Math.max(0, attempt - 1)
  const delay = baseDelay * Math.pow(multiplier, effectiveAttempt)

  return Math.min(delay, maxDelay)
}
