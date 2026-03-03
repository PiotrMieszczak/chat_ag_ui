import { describe, it, expect } from 'vitest'
import type {
  Message,
  MessageRole,
  MessageStatus,
  ToolCall,
  ToolStatus,
  ToolDefinition,
  ToolParameterSchema,
  ConnectionStatus,
  ChatErrorCode,
  JsonPatchOperation,
} from '../../src/core/types'
import { ChatError } from '../../src/core/types'

describe('types', () => {
  it('Message type has correct shape', () => {
    const message: Message = {
      id: '1',
      role: 'user',
      content: 'Hello',
      status: 'complete',
      toolCalls: [],
      timestamp: new Date(),
    }
    expect(message.id).toBe('1')
    expect(message.role).toBe('user')
  })

  it('ToolCall type has correct shape', () => {
    const toolCall: ToolCall = {
      id: 't1',
      name: 'filterEvents',
      args: { faction: 'iHatei' },
      status: 'complete',
      result: { count: 3 },
    }
    expect(toolCall.name).toBe('filterEvents')
  })

  it('ChatError has code and message', () => {
    const error = new ChatError('CONNECTION_FAILED', 'Failed to connect')
    expect(error.code).toBe('CONNECTION_FAILED')
    expect(error.message).toBe('Failed to connect')
    expect(error.name).toBe('ChatError')
  })

  it('ChatError preserves cause', () => {
    const cause = new Error('Network error')
    const error = new ChatError('CONNECTION_FAILED', 'Failed', { cause })
    expect(error.cause).toBe(cause)
  })
})
