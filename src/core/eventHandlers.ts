import type { Message, MessageRole, ToolCall } from './types'

export function createMessageFromEvent(
  messageId: string,
  role: MessageRole
): Message {
  return {
    id: messageId,
    role,
    content: '',
    status: 'streaming',
    toolCalls: [],
    timestamp: new Date(),
  }
}

export function appendContentToMessage(
  message: Message,
  delta: string
): Message {
  return {
    ...message,
    content: message.content + delta,
  }
}

export function completeMessage(message: Message): Message {
  return {
    ...message,
    status: 'complete',
  }
}

export function errorMessage(message: Message, error: Error): Message {
  return {
    ...message,
    status: 'error',
    metadata: { ...message.metadata, error: error.message },
  }
}

export function createToolCallFromEvent(
  toolCallId: string,
  toolCallName: string
): ToolCall {
  return {
    id: toolCallId,
    name: toolCallName,
    args: {},
    status: 'pending',
  }
}

// Internal: tracks accumulated JSON string
const toolCallArgsBuffer = new Map<string, string>()

export function appendArgsToToolCall(
  toolCall: ToolCall,
  delta: string
): ToolCall {
  const buffer = (toolCallArgsBuffer.get(toolCall.id) || '') + delta
  toolCallArgsBuffer.set(toolCall.id, buffer)
  return { ...toolCall }
}

export function finalizeToolCallArgs(toolCall: ToolCall): ToolCall {
  const buffer = toolCallArgsBuffer.get(toolCall.id) || '{}'
  toolCallArgsBuffer.delete(toolCall.id)

  try {
    const args = JSON.parse(buffer)
    return {
      ...toolCall,
      args,
      status: 'running',
    }
  } catch {
    return {
      ...toolCall,
      args: {},
      status: 'error',
      error: new Error('Failed to parse tool arguments'),
    }
  }
}

export function completeToolCall(
  toolCall: ToolCall,
  result: unknown
): ToolCall {
  return {
    ...toolCall,
    status: 'complete',
    result,
  }
}

export function errorToolCall(
  toolCall: ToolCall,
  error: Error
): ToolCall {
  return {
    ...toolCall,
    status: 'error',
    error,
  }
}

export function addToolCallToMessage(
  message: Message,
  toolCall: ToolCall
): Message {
  return {
    ...message,
    toolCalls: [...message.toolCalls, toolCall],
  }
}

export function updateToolCallInMessage(
  message: Message,
  updatedToolCall: ToolCall
): Message {
  return {
    ...message,
    toolCalls: message.toolCalls.map(tc =>
      tc.id === updatedToolCall.id ? updatedToolCall : tc
    ),
  }
}
