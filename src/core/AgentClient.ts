import type {
  Message,
  ToolCall,
  ToolDefinition,
  ChatProviderConfig,
  ConnectionStatus,
  JsonPatch,
} from './types'
import {
  createMessageFromEvent,
  appendContentToMessage,
  completeMessage,
  createToolCallFromEvent,
  appendArgsToToolCall,
  finalizeToolCallArgs,
  completeToolCall,
  errorToolCall,
  addToolCallToMessage,
  updateToolCallInMessage,
} from './eventHandlers'
import { calculateBackoff } from '../utils/backoff'
import { ChatError } from './types'

export interface AgentClientCallbacks {
  onStatusChange: (status: ConnectionStatus) => void
  onError: (error: ChatError) => void
  onMessage: (message: Message) => void
  onMessageUpdate: (message: Message) => void
  onToolCall: (toolCall: ToolCall, messageId: string) => void
  onToolCallUpdate: (toolCall: ToolCall, messageId: string) => void
  onStateDelta: (patch: JsonPatch) => void
  onRunStart: (runId: string) => void
  onRunFinish: (runId: string) => void
}

export class AgentClient {
  private config: ChatProviderConfig
  private callbacks: AgentClientCallbacks
  private eventSource: EventSource | null = null
  private abortController: AbortController | null = null
  private reconnectAttempts = 0
  private currentMessage: Message | null = null
  private currentToolCalls: Map<string, ToolCall> = new Map()
  private tools: ToolDefinition[] = []
  private context: Record<string, unknown> = {}

  constructor(config: ChatProviderConfig, callbacks: AgentClientCallbacks) {
    this.config = config
    this.callbacks = callbacks
  }

  setTools(tools: ToolDefinition[]): void {
    this.tools = tools
  }

  setContext(context: Record<string, unknown>): void {
    this.context = context
  }

  async connect(): Promise<void> {
    this.callbacks.onStatusChange('connecting')

    try {
      // Send init payload
      await this.sendInit()

      // Open SSE connection
      this.openEventSource()

      this.reconnectAttempts = 0
      this.callbacks.onStatusChange('connected')
    } catch (error) {
      this.handleConnectionError(error as Error)
    }
  }

  disconnect(): void {
    this.eventSource?.close()
    this.eventSource = null
    this.abortController?.abort()
    this.abortController = null
    this.callbacks.onStatusChange('disconnected')
  }

  async send(content: string): Promise<void> {
    this.abortController = new AbortController()

    const payload = {
      type: 'message',
      content,
      context: this.context,
    }

    try {
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.config.headers,
        },
        body: JSON.stringify(payload),
        signal: this.abortController.signal,
      })

      if (!response.ok) {
        throw new ChatError(
          'MESSAGE_SEND_FAILED',
          `Failed to send message: ${response.statusText}`
        )
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return
      }
      this.callbacks.onError(error as ChatError)
    }
  }

  stop(): void {
    this.abortController?.abort()
    this.abortController = null
  }

  async executeToolCall(
    toolCall: ToolCall,
    messageId: string
  ): Promise<void> {
    const tool = this.tools.find(t => t.name === toolCall.name)

    if (!tool) {
      const error = new ChatError('TOOL_NOT_FOUND', `Tool not found: ${toolCall.name}`)
      const erroredToolCall = errorToolCall(toolCall, error)
      this.callbacks.onToolCallUpdate(erroredToolCall, messageId)
      return
    }

    const abortController = new AbortController()
    const context = {
      toolCallId: toolCall.id,
      abortSignal: abortController.signal,
    }

    try {
      const result = await tool.execute(toolCall.args, context)
      const completedToolCall = completeToolCall(toolCall, result)
      this.callbacks.onToolCallUpdate(completedToolCall, messageId)

      // Send result back to backend
      await this.sendToolResult(toolCall.id, result)
    } catch (error) {
      const erroredToolCall = errorToolCall(toolCall, error as Error)
      this.callbacks.onToolCallUpdate(erroredToolCall, messageId)
    }
  }

  private async sendInit(): Promise<void> {
    const payload = {
      type: 'init',
      tools: this.tools.map(t => ({
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      })),
      context: this.context,
    }

    const response = await fetch(this.config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.config.headers,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new ChatError(
        'CONNECTION_FAILED',
        `Failed to initialize: ${response.statusText}`
      )
    }
  }

  private async sendToolResult(toolCallId: string, result: unknown): Promise<void> {
    const endpoint = this.config.endpoint.replace(/\/?$/, '/tool-result')

    await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.config.headers,
      },
      body: JSON.stringify({ toolCallId, result }),
    })
  }

  private openEventSource(): void {
    const sseEndpoint = this.config.endpoint.replace(/\/?$/, '/sse')
    this.eventSource = new EventSource(sseEndpoint)

    this.eventSource.onopen = () => {
      this.callbacks.onStatusChange('connected')
    }

    this.eventSource.onerror = () => {
      this.handleConnectionError(new Error('SSE connection error'))
    }

    // Register event handlers
    this.registerEventHandlers()
  }

  private registerEventHandlers(): void {
    if (!this.eventSource) return

    this.eventSource.addEventListener('RunStarted', (e) => {
      const data = JSON.parse((e as MessageEvent).data)
      this.callbacks.onRunStart(data.runId)
    })

    this.eventSource.addEventListener('RunFinished', (e) => {
      const data = JSON.parse((e as MessageEvent).data)
      if (this.currentMessage) {
        const completed = completeMessage(this.currentMessage)
        this.callbacks.onMessageUpdate(completed)
        this.currentMessage = null
      }
      this.callbacks.onRunFinish(data.runId)
    })

    this.eventSource.addEventListener('RunError', (e) => {
      const data = JSON.parse((e as MessageEvent).data)
      const error = new ChatError('CONNECTION_LOST', data.message)
      this.callbacks.onError(error)
    })

    this.eventSource.addEventListener('TextMessageStart', (e) => {
      const data = JSON.parse((e as MessageEvent).data)
      this.currentMessage = createMessageFromEvent(data.messageId, data.role)
      this.callbacks.onMessage(this.currentMessage)
    })

    this.eventSource.addEventListener('TextMessageContent', (e) => {
      const data = JSON.parse((e as MessageEvent).data)
      if (this.currentMessage && this.currentMessage.id === data.messageId) {
        this.currentMessage = appendContentToMessage(this.currentMessage, data.delta)
        this.callbacks.onMessageUpdate(this.currentMessage)
      }
    })

    this.eventSource.addEventListener('TextMessageEnd', (e) => {
      const data = JSON.parse((e as MessageEvent).data)
      if (this.currentMessage && this.currentMessage.id === data.messageId) {
        this.currentMessage = completeMessage(this.currentMessage)
        this.callbacks.onMessageUpdate(this.currentMessage)
      }
    })

    this.eventSource.addEventListener('ToolCallStart', (e) => {
      const data = JSON.parse((e as MessageEvent).data)
      const toolCall = createToolCallFromEvent(data.toolCallId, data.toolCallName)
      this.currentToolCalls.set(toolCall.id, toolCall)

      if (this.currentMessage) {
        this.currentMessage = addToolCallToMessage(this.currentMessage, toolCall)
        this.callbacks.onToolCall(toolCall, this.currentMessage.id)
      }
    })

    this.eventSource.addEventListener('ToolCallArgs', (e) => {
      const data = JSON.parse((e as MessageEvent).data)
      const toolCall = this.currentToolCalls.get(data.toolCallId)
      if (toolCall) {
        const updated = appendArgsToToolCall(toolCall, data.delta)
        this.currentToolCalls.set(updated.id, updated)
      }
    })

    this.eventSource.addEventListener('ToolCallEnd', (e) => {
      const data = JSON.parse((e as MessageEvent).data)
      const toolCall = this.currentToolCalls.get(data.toolCallId)
      if (toolCall && this.currentMessage) {
        const finalized = finalizeToolCallArgs(toolCall)
        this.currentToolCalls.set(finalized.id, finalized)
        this.currentMessage = updateToolCallInMessage(this.currentMessage, finalized)
        this.callbacks.onToolCallUpdate(finalized, this.currentMessage.id)

        // Execute the tool
        this.executeToolCall(finalized, this.currentMessage.id)
      }
    })

    this.eventSource.addEventListener('StateDelta', (e) => {
      const data = JSON.parse((e as MessageEvent).data)
      this.callbacks.onStateDelta(data.delta)
    })
  }

  private handleConnectionError(error: Error): void {
    this.callbacks.onStatusChange('error')
    this.callbacks.onError(error as ChatError)

    // Attempt reconnection
    if (this.config.reconnect?.enabled) {
      this.attemptReconnect()
    }
  }

  private attemptReconnect(): void {
    const maxAttempts = this.config.reconnect?.maxAttempts ?? 3

    if (this.reconnectAttempts >= maxAttempts) {
      return
    }

    this.reconnectAttempts++

    const delay = calculateBackoff({
      attempt: this.reconnectAttempts,
      baseDelay: this.config.reconnect?.delayMs ?? 1000,
      multiplier: this.config.reconnect?.backoffMultiplier ?? 2,
    })

    setTimeout(() => {
      this.connect()
    }, delay)
  }
}
