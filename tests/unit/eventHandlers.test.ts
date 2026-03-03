import { describe, it, expect } from 'vitest'
import {
  createMessageFromEvent,
  appendContentToMessage,
  createToolCallFromEvent,
  appendArgsToToolCall,
} from '../../src/core/eventHandlers'
import type { Message, ToolCall } from '../../src/core/types'

describe('eventHandlers', () => {
  describe('createMessageFromEvent', () => {
    it('creates message with streaming status', () => {
      const message = createMessageFromEvent('m1', 'assistant')
      expect(message.id).toBe('m1')
      expect(message.role).toBe('assistant')
      expect(message.status).toBe('streaming')
      expect(message.content).toBe('')
      expect(message.toolCalls).toEqual([])
    })
  })

  describe('appendContentToMessage', () => {
    it('appends delta to content', () => {
      const message: Message = {
        id: 'm1',
        role: 'assistant',
        content: 'Hello ',
        status: 'streaming',
        toolCalls: [],
        timestamp: new Date(),
      }
      const updated = appendContentToMessage(message, 'world')
      expect(updated.content).toBe('Hello world')
      expect(updated.status).toBe('streaming')
    })

    it('does not mutate original', () => {
      const message: Message = {
        id: 'm1',
        role: 'assistant',
        content: 'Hello',
        status: 'streaming',
        toolCalls: [],
        timestamp: new Date(),
      }
      appendContentToMessage(message, ' world')
      expect(message.content).toBe('Hello')
    })
  })

  describe('createToolCallFromEvent', () => {
    it('creates tool call with pending status', () => {
      const toolCall = createToolCallFromEvent('t1', 'filterEvents')
      expect(toolCall.id).toBe('t1')
      expect(toolCall.name).toBe('filterEvents')
      expect(toolCall.status).toBe('pending')
      expect(toolCall.args).toEqual({})
    })
  })

  describe('appendArgsToToolCall', () => {
    it('accumulates JSON argument chunks', () => {
      let toolCall = createToolCallFromEvent('t1', 'test')
      toolCall = appendArgsToToolCall(toolCall, '{"name":')
      toolCall = appendArgsToToolCall(toolCall, '"test"}')
      expect(toolCall.args).toEqual({})  // Not parsed yet
    })
  })
})
