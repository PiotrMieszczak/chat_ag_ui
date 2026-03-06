import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAgentState } from '../../src/hooks/useAgentState'
import { ChatContext } from '../../src/components/ChatContext'
import type { ChatContextValue } from '../../src/components/ChatContext'
import type { JsonPatch } from '../../src/core/types'

function makeMockContext(overrides?: Partial<ChatContextValue>): ChatContextValue {
  return {
    status: 'disconnected',
    error: null,
    connect: vi.fn(),
    disconnect: vi.fn(),
    messages: [],
    isStreaming: false,
    send: vi.fn(),
    stop: vi.fn(),
    reset: vi.fn(),
    registerTool: vi.fn(),
    unregisterTool: vi.fn(),
    tools: [],
    setContext: vi.fn(),
    removeContext: vi.fn(),
    agentState: {},
    stateDeltaSubscribers: new Set(),
    ...overrides,
  }
}

function wrapper(ctx: ChatContextValue) {
  return ({ children }: { children: React.ReactNode }) => (
    <ChatContext.Provider value={ctx}>{children}</ChatContext.Provider>
  )
}

describe('useAgentState', () => {
  it('returns initial state', () => {
    const ctx = makeMockContext()
    const { result } = renderHook(
      () => useAgentState({ initialState: { doomClock: 5 } }),
      { wrapper: wrapper(ctx) }
    )
    expect(result.current.doomClock).toBe(5)
  })

  it('applies JSON Patch when a subscriber fires', () => {
    const subscribers = new Set<(patch: JsonPatch) => void>()
    const ctx = makeMockContext({ stateDeltaSubscribers: subscribers })

    const { result } = renderHook(
      () => useAgentState({ initialState: { doomClock: 5 } }),
      { wrapper: wrapper(ctx) }
    )

    act(() => {
      subscribers.forEach(sub =>
        sub([{ op: 'replace', path: '/doomClock', value: 8 }])
      )
    })

    expect(result.current.doomClock).toBe(8)
  })

  it('applies add patch to create new keys', () => {
    const subscribers = new Set<(patch: JsonPatch) => void>()
    const ctx = makeMockContext({ stateDeltaSubscribers: subscribers })

    const { result } = renderHook(
      () => useAgentState<Record<string, unknown>>({ initialState: {} }),
      { wrapper: wrapper(ctx) }
    )

    act(() => {
      subscribers.forEach(sub =>
        sub([{ op: 'add', path: '/newKey', value: 'hello' }])
      )
    })

    expect(result.current.newKey).toBe('hello')
  })

  it('keeps previous state when validate returns false', () => {
    const subscribers = new Set<(patch: JsonPatch) => void>()
    const ctx = makeMockContext({ stateDeltaSubscribers: subscribers })
    const validate = vi.fn().mockReturnValue(false)

    const { result } = renderHook(
      () => useAgentState({ initialState: { doomClock: 5 }, validate }),
      { wrapper: wrapper(ctx) }
    )

    act(() => {
      subscribers.forEach(sub =>
        sub([{ op: 'replace', path: '/doomClock', value: 99 }])
      )
    })

    expect(result.current.doomClock).toBe(5)
    expect(validate).toHaveBeenCalled()
  })

  it('calls onDelta callback after successful patch', () => {
    const subscribers = new Set<(patch: JsonPatch) => void>()
    const ctx = makeMockContext({ stateDeltaSubscribers: subscribers })
    const onDelta = vi.fn()

    renderHook(
      () => useAgentState({ initialState: { doomClock: 5 }, onDelta }),
      { wrapper: wrapper(ctx) }
    )

    const patch: JsonPatch = [{ op: 'replace', path: '/doomClock', value: 7 }]
    act(() => {
      subscribers.forEach(sub => sub(patch))
    })

    expect(onDelta).toHaveBeenCalledWith(patch, { doomClock: 7 })
  })

  it('keeps state and does not throw on invalid patch path', () => {
    const subscribers = new Set<(patch: JsonPatch) => void>()
    const ctx = makeMockContext({ stateDeltaSubscribers: subscribers })

    const { result } = renderHook(
      () => useAgentState({ initialState: { doomClock: 5 } }),
      { wrapper: wrapper(ctx) }
    )

    act(() => {
      // remove on a non-existent path — applyJsonPatch should throw, hook catches it
      subscribers.forEach(sub =>
        sub([{ op: 'remove', path: '/nonExistent' }])
      )
    })

    expect(result.current.doomClock).toBe(5)
  })

  it('unsubscribes on unmount', () => {
    const subscribers = new Set<(patch: JsonPatch) => void>()
    const ctx = makeMockContext({ stateDeltaSubscribers: subscribers })

    const { unmount } = renderHook(
      () => useAgentState({ initialState: { x: 1 } }),
      { wrapper: wrapper(ctx) }
    )

    expect(subscribers.size).toBe(1)
    unmount()
    expect(subscribers.size).toBe(0)
  })

  it('supports multiple independent subscribers', () => {
    const subscribers = new Set<(patch: JsonPatch) => void>()
    const ctx = makeMockContext({ stateDeltaSubscribers: subscribers })

    const { result: r1 } = renderHook(
      () => useAgentState({ initialState: { counter: 0 } }),
      { wrapper: wrapper(ctx) }
    )
    const { result: r2 } = renderHook(
      () => useAgentState({ initialState: { counter: 100 } }),
      { wrapper: wrapper(ctx) }
    )

    act(() => {
      subscribers.forEach(sub =>
        sub([{ op: 'replace', path: '/counter', value: 42 }])
      )
    })

    expect(r1.current.counter).toBe(42)
    expect(r2.current.counter).toBe(42)
  })
})
