import { describe, it, expect } from 'vitest'
import { calculateBackoff } from '../../src/utils/backoff'

describe('calculateBackoff', () => {
  it('returns base delay for first attempt', () => {
    expect(calculateBackoff({
      attempt: 1,
      baseDelay: 1000,
      multiplier: 2,
    })).toBe(1000)
  })

  it('doubles delay on each attempt', () => {
    const config = { baseDelay: 1000, multiplier: 2 }
    expect(calculateBackoff({ ...config, attempt: 2 })).toBe(2000)
    expect(calculateBackoff({ ...config, attempt: 3 })).toBe(4000)
    expect(calculateBackoff({ ...config, attempt: 4 })).toBe(8000)
  })

  it('caps at maxDelay', () => {
    expect(calculateBackoff({
      attempt: 10,
      baseDelay: 1000,
      multiplier: 2,
      maxDelay: 5000,
    })).toBe(5000)
  })

  it('uses default maxDelay of 30000', () => {
    expect(calculateBackoff({
      attempt: 100,
      baseDelay: 1000,
      multiplier: 2,
    })).toBe(30000)
  })

  it('handles zero attempt', () => {
    expect(calculateBackoff({
      attempt: 0,
      baseDelay: 1000,
      multiplier: 2,
    })).toBe(1000)
  })
})
