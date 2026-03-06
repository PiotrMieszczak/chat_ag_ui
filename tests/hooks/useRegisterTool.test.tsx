import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useRegisterTool } from '../../src/hooks/useRegisterTool'
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

const sampleTool = {
  name: 'filterEvents',
  description: 'Filter events by faction',
  parameters: {
    type: 'object' as const,
    properties: {
      faction: { type: 'string' as const, description: 'Faction name' },
    },
    required: ['faction'],
  },
  execute: vi.fn().mockResolvedValue({ count: 0 }),
}

describe('useRegisterTool', () => {
  it('calls registerTool on mount', () => {
    const registerTool = vi.fn()
    const ctx = makeMockContext({ registerTool })

    renderHook(() => useRegisterTool(sampleTool), { wrapper: wrapper(ctx) })

    expect(registerTool).toHaveBeenCalledOnce()
    expect(registerTool).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'filterEvents' })
    )
  })

  it('calls unregisterTool on unmount', () => {
    const unregisterTool = vi.fn()
    const ctx = makeMockContext({ unregisterTool })

    const { unmount } = renderHook(() => useRegisterTool(sampleTool), { wrapper: wrapper(ctx) })
    unmount()

    expect(unregisterTool).toHaveBeenCalledWith('filterEvents')
  })

  it('re-registers when name changes', () => {
    const registerTool = vi.fn()
    const unregisterTool = vi.fn()
    const ctx = makeMockContext({ registerTool, unregisterTool })

    const { rerender } = renderHook(
      ({ name }: { name: string }) => useRegisterTool({ ...sampleTool, name }),
      { wrapper: wrapper(ctx), initialProps: { name: 'toolA' } }
    )

    expect(registerTool).toHaveBeenCalledTimes(1)

    rerender({ name: 'toolB' })

    expect(unregisterTool).toHaveBeenCalledWith('toolA')
    expect(registerTool).toHaveBeenCalledTimes(2)
    expect(registerTool).toHaveBeenLastCalledWith(
      expect.objectContaining({ name: 'toolB' })
    )
  })

  it('wraps execute through stable ref — latest closure is called', async () => {
    const registerTool = vi.fn()
    const ctx = makeMockContext({ registerTool })

    let capturedValue = 'initial'
    const execute = vi.fn().mockImplementation(() =>
      Promise.resolve({ value: capturedValue })
    )

    const { rerender } = renderHook(
      ({ v }: { v: string }) => {
        capturedValue = v
        return useRegisterTool({ ...sampleTool, execute })
      },
      { wrapper: wrapper(ctx), initialProps: { v: 'initial' } }
    )

    rerender({ v: 'updated' })

    // The registered tool's execute should use the latest capturedValue
    const registeredTool = registerTool.mock.calls[0][0]
    const result = await registeredTool.execute({}, { toolCallId: 'x', abortSignal: new AbortController().signal })
    expect(result.value).toBe('updated')
  })

  it('registers tool with correct schema', () => {
    const registerTool = vi.fn()
    const ctx = makeMockContext({ registerTool })

    renderHook(() => useRegisterTool(sampleTool), { wrapper: wrapper(ctx) })

    expect(registerTool).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'filterEvents',
        description: 'Filter events by faction',
        parameters: expect.objectContaining({ type: 'object' }),
      })
    )
  })
})
