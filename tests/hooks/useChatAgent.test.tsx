import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useChatAgent } from '../../src/hooks/useChatAgent'
import { ChatContext } from '../../src/components/ChatContext'
import type { ChatContextValue } from '../../src/components/ChatContext'
import { ChatError } from '../../src/core/types'
import type { Message } from '../../src/core/types'

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

describe('useChatAgent', () => {
  it('returns status from context', () => {
    const ctx = makeMockContext({ status: 'connected' })
    const { result } = renderHook(() => useChatAgent(), { wrapper: wrapper(ctx) })
    expect(result.current.status).toBe('connected')
  })

  it('returns messages from context', () => {
    const messages: Message[] = [
      { id: '1', role: 'user', content: 'Hi', status: 'complete', toolCalls: [], timestamp: new Date() },
    ]
    const ctx = makeMockContext({ messages })
    const { result } = renderHook(() => useChatAgent(), { wrapper: wrapper(ctx) })
    expect(result.current.messages).toHaveLength(1)
    expect(result.current.messages[0].content).toBe('Hi')
  })

  it('returns isStreaming from context', () => {
    const ctx = makeMockContext({ isStreaming: true })
    const { result } = renderHook(() => useChatAgent(), { wrapper: wrapper(ctx) })
    expect(result.current.isStreaming).toBe(true)
  })

  it('returns error from context', () => {
    const error = new ChatError('CONNECTION_FAILED', 'boom')
    const ctx = makeMockContext({ error })
    const { result } = renderHook(() => useChatAgent(), { wrapper: wrapper(ctx) })
    expect(result.current.error).toBe(error)
  })

  it('send delegates to context.send', () => {
    const send = vi.fn()
    const ctx = makeMockContext({ send })
    const { result } = renderHook(() => useChatAgent(), { wrapper: wrapper(ctx) })
    act(() => { result.current.send('hello') })
    expect(send).toHaveBeenCalledWith('hello')
  })

  it('stop delegates to context.stop', () => {
    const stop = vi.fn()
    const ctx = makeMockContext({ stop })
    const { result } = renderHook(() => useChatAgent(), { wrapper: wrapper(ctx) })
    act(() => { result.current.stop() })
    expect(stop).toHaveBeenCalled()
  })

  it('reset delegates to context.reset', () => {
    const reset = vi.fn()
    const ctx = makeMockContext({ reset })
    const { result } = renderHook(() => useChatAgent(), { wrapper: wrapper(ctx) })
    act(() => { result.current.reset() })
    expect(reset).toHaveBeenCalled()
  })

  it('throws when used outside ChatProvider', () => {
    expect(() => renderHook(() => useChatAgent())).toThrow(
      'useChatContext must be used within a ChatProvider'
    )
  })
})
