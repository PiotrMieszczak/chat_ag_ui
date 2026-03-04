// chat-ag-ui - Headless React library for AG-UI protocol
export const VERSION = '0.1.0'

// Provider
export { ChatProvider } from './components/ChatProvider'

// Hooks
export { useChatAgent } from './hooks/useChatAgent'
export { useRegisterTool } from './hooks/useRegisterTool'
export { useReadableContext } from './hooks/useReadableContext'
export { useAgentState } from './hooks/useAgentState'

// Headless Components
export { MessageList } from './components/headless/MessageList'
export { ChatInput } from './components/headless/ChatInput'
export { ToolCallList } from './components/headless/ToolCallList'
export { ConnectionStatus } from './components/headless/ConnectionStatus'

// Types
export type {
  Message,
  MessageRole,
  MessageStatus,
  ToolCall,
  ToolStatus,
  ToolDefinition,
  ToolParameterSchema,
  ToolExecutor,
  ToolExecutionContext,
  ConnectionStatus as ConnectionStatusType,
  ConnectionState,
  ReadableContextEntry,
  JsonPatch,
  JsonPatchOperation,
  ChatErrorCode,
  ChatProviderConfig,
  ReconnectConfig,
} from './core/types'

export { ChatError } from './core/types'

// Utilities (for advanced use)
export { applyJsonPatch } from './utils/jsonPatch'
export { validateToolArgs } from './utils/validation'
export { calculateBackoff } from './utils/backoff'

// Hook option types
export type { UseChatAgentOptions } from './hooks/useChatAgent'
export type { UseRegisterToolOptions } from './hooks/useRegisterTool'
export type { UseReadableContextOptions } from './hooks/useReadableContext'
export type { UseAgentStateOptions } from './hooks/useAgentState'

// Component prop types
export type { MessageListProps, MessageListRenderProps } from './components/headless/MessageList'
export type { ChatInputProps, ChatInputRenderProps } from './components/headless/ChatInput'
export type { ToolCallListProps, ToolCallListRenderProps } from './components/headless/ToolCallList'
export type { ConnectionStatusProps, ConnectionStatusRenderProps } from './components/headless/ConnectionStatus'
