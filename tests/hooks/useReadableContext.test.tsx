import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useReadableContext } from '../../src/hooks/useReadableContext'
import { ChatContext } from '../../src/components/ChatContext'
import type { ChatContextValue } from '../../src/components/ChatContext'

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

describe('useReadableContext', () => {
  it('calls setContext on mount with key, value, and description', () => {
    const setContext = vi.fn()
    const ctx = makeMockContext({ setContext })

    renderHook(
      () => useReadableContext('events', [1, 2, 3], { description: 'Campaign events' }),
      { wrapper: wrapper(ctx) }
    )

    expect(setContext).toHaveBeenCalledWith('events', [1, 2, 3], 'Campaign events')
  })

  it('calls removeContext on unmount', () => {
    const removeContext = vi.fn()
    const ctx = makeMockContext({ removeContext })

    const { unmount } = renderHook(
      () => useReadableContext('events', [], { description: 'Campaign events' }),
      { wrapper: wrapper(ctx) }
    )
    unmount()

    expect(removeContext).toHaveBeenCalledWith('events')
  })

  it('updates context when value changes', () => {
    const setContext = vi.fn()
    const ctx = makeMockContext({ setContext })

    const { rerender } = renderHook(
      ({ value }: { value: number[] }) =>
        useReadableContext('events', value, { description: 'Campaign events' }),
      { wrapper: wrapper(ctx), initialProps: { value: [1, 2] } }
    )

    rerender({ value: [1, 2, 3] })

    expect(setContext).toHaveBeenLastCalledWith('events', [1, 2, 3], 'Campaign events')
  })

  it('does not call setContext when lazy is true', () => {
    const setContext = vi.fn()
    const ctx = makeMockContext({ setContext })

    renderHook(
      () => useReadableContext('events', [1, 2], { description: 'Events', lazy: true }),
      { wrapper: wrapper(ctx) }
    )

    expect(setContext).not.toHaveBeenCalled()
  })

  it('still calls removeContext on unmount when lazy', () => {
    const removeContext = vi.fn()
    const ctx = makeMockContext({ removeContext })

    const { unmount } = renderHook(
      () => useReadableContext('events', [], { description: 'Events', lazy: true }),
      { wrapper: wrapper(ctx) }
    )
    unmount()

    expect(removeContext).toHaveBeenCalledWith('events')
  })

  it('does not update context when value changes if lazy', () => {
    const setContext = vi.fn()
    const ctx = makeMockContext({ setContext })

    const { rerender } = renderHook(
      ({ value }: { value: number[] }) =>
        useReadableContext('events', value, { description: 'Events', lazy: true }),
      { wrapper: wrapper(ctx), initialProps: { value: [1] } }
    )

    rerender({ value: [1, 2, 3] })

    expect(setContext).not.toHaveBeenCalled()
  })
})
