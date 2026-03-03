// ============================================
// MESSAGE TYPES
// ============================================

export type MessageRole = 'user' | 'assistant'
export type MessageStatus = 'pending' | 'streaming' | 'complete' | 'error'

export interface Message {
  readonly id: string
  readonly role: MessageRole
  readonly content: string
  readonly status: MessageStatus
  readonly toolCalls: readonly ToolCall[]
  readonly timestamp: Date
  readonly metadata?: Readonly<Record<string, unknown>>
}

// ============================================
// TOOL TYPES
// ============================================

export type ToolStatus = 'pending' | 'running' | 'complete' | 'error'

export interface ToolCall {
  readonly id: string
  readonly name: string
  readonly args: Readonly<Record<string, unknown>>
  readonly status: ToolStatus
  readonly result?: unknown
  readonly error?: Error
}

export interface ToolParameterSchema {
  readonly type: 'object'
  readonly properties: Readonly<Record<string, {
    readonly type: 'string' | 'number' | 'boolean' | 'object' | 'array'
    readonly description?: string
    readonly enum?: readonly unknown[]
    readonly items?: ToolParameterSchema
    readonly properties?: ToolParameterSchema['properties']
  }>>
  readonly required?: readonly string[]
}

export interface ToolDefinition<TArgs = Record<string, unknown>, TResult = unknown> {
  readonly name: string
  readonly description: string
  readonly parameters: ToolParameterSchema
  readonly execute: ToolExecutor<TArgs, TResult>
}

export type ToolExecutor<TArgs, TResult> = (
  args: TArgs,
  context: ToolExecutionContext
) => Promise<TResult>

export interface ToolExecutionContext {
  readonly toolCallId: string
  readonly abortSignal: AbortSignal
}

// ============================================
// CONNECTION TYPES
// ============================================

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

export interface ConnectionState {
  readonly status: ConnectionStatus
  readonly error: Error | null
  readonly reconnectAttempts: number
}

// ============================================
// CONTEXT TYPES
// ============================================

export interface ReadableContextEntry<T = unknown> {
  readonly key: string
  readonly value: T
  readonly description: string
}

// ============================================
// JSON PATCH TYPES
// ============================================

export interface JsonPatchOperation {
  readonly op: 'add' | 'remove' | 'replace' | 'move' | 'copy' | 'test'
  readonly path: string
  readonly value?: unknown
  readonly from?: string
}

export type JsonPatch = readonly JsonPatchOperation[]

// ============================================
// ERROR TYPES
// ============================================

export type ChatErrorCode =
  | 'CONNECTION_FAILED'
  | 'CONNECTION_LOST'
  | 'MESSAGE_SEND_FAILED'
  | 'TOOL_EXECUTION_FAILED'
  | 'TOOL_NOT_FOUND'
  | 'INVALID_EVENT'
  | 'STATE_PATCH_FAILED'
  | 'TIMEOUT'

export class ChatError extends Error {
  readonly code: ChatErrorCode
  readonly cause?: Error
  readonly metadata?: Readonly<Record<string, unknown>>

  constructor(
    code: ChatErrorCode,
    message: string,
    options?: { cause?: Error; metadata?: Record<string, unknown> }
  ) {
    super(message)
    this.name = 'ChatError'
    this.code = code
    this.cause = options?.cause
    this.metadata = options?.metadata
  }
}

// ============================================
// CONFIG TYPES
// ============================================

export interface ReconnectConfig {
  readonly enabled: boolean
  readonly maxAttempts: number
  readonly delayMs: number
  readonly backoffMultiplier: number
}

export interface ChatProviderConfig {
  readonly endpoint: string
  readonly headers?: Readonly<Record<string, string>>
  readonly reconnect?: ReconnectConfig
  readonly onConnect?: () => void
  readonly onDisconnect?: () => void
  readonly onError?: (error: ChatError) => void
  readonly onRunStart?: (runId: string) => void
  readonly onRunFinish?: (runId: string) => void
}
