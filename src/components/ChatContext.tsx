import { createContext, useContext } from 'react'
import type {
  Message,
  ToolCall,
  ToolDefinition,
  ConnectionStatus,
  ChatError,
  JsonPatch,
} from '../core/types'

/**
 * ChatContextValue defines the contract between ChatProvider and consumers.
 * All chat functionality (connection, messages, tools, context, state) flows through this interface.
 *
 * Design rationale: Using a single context for all chat state keeps related data together
 * and allows fine-grained control over re-renders via individual hooks (useChatAgent, useRegisterTool, etc.)
 */
export interface ChatContextValue {
  // Connection
  status: ConnectionStatus
  error: ChatError | null
  connect: () => void
  disconnect: () => void

  // Messages
  messages: Message[]
  isStreaming: boolean
  send: (content: string) => void
  stop: () => void
  reset: () => void

  // Tools
  registerTool: (tool: ToolDefinition) => void
  unregisterTool: (name: string) => void
  tools: ToolCall[]

  // Context (data sent to backend with each message)
  setContext: (key: string, value: unknown, description: string) => void
  removeContext: (key: string) => void

  // State (STATE_DELTA from backend)
  agentState: Record<string, unknown>
  stateDeltaSubscribers: Set<(patch: JsonPatch) => void>
}

export const ChatContext = createContext<ChatContextValue | null>(null)

/**
 * useChatContext is the internal hook for accessing chat state.
 * Throws if used outside ChatProvider for early error detection.
 *
 * Security consideration: Throwing immediately prevents silent failures
 * where components might operate with undefined state.
 */
export function useChatContext(): ChatContextValue {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider')
  }
  return context
}
