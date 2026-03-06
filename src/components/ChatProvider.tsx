'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChatContext, ChatContextValue } from './ChatContext'
import { AgentClient } from '../core/AgentClient'
import { applyJsonPatch } from '../utils/jsonPatch'
import type {
  Message,
  ToolCall,
  ToolDefinition,
  ConnectionStatus,
  ChatError,
  ChatProviderConfig,
  JsonPatch,
  ReadableContextEntry,
} from '../core/types'

interface ChatProviderProps extends ChatProviderConfig {
  children: React.ReactNode
}

/**
 * ChatProvider is the root component that wires together all chat functionality.
 *
 * Responsibilities:
 * - Manages AgentClient lifecycle (connect, disconnect, reconnect)
 * - Maintains message, tool, and state history
 * - Provides context API for hooks to access chat state
 * - Syncs registered tools and readable context to backend
 *
 * Security considerations:
 * - Tool execution happens in controlled context via AgentClient
 * - Context data is sent to backend - consumers should be careful about sensitive data
 * - AbortController allows cancellation of in-flight operations
 */
export function ChatProvider({ children, ...config }: ChatProviderProps) {
  // Connection state
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const [error, setError] = useState<ChatError | null>(null)

  // Message state
  const [messages, setMessages] = useState<Message[]>([])
  const [isStreaming, setIsStreaming] = useState(false)

  // Tool state
  const [tools, setTools] = useState<ToolCall[]>([])

  // Agent state (from STATE_DELTA events)
  const [agentState, setAgentState] = useState<Record<string, unknown>>({})

  // Refs for registries (avoid re-renders when they change)
  const toolRegistry = useRef<Map<string, ToolDefinition>>(new Map())
  const contextRegistry = useRef<Map<string, ReadableContextEntry>>(new Map())
  const stateDeltaSubscribers = useRef<Set<(patch: JsonPatch) => void>>(new Set())
  const clientRef = useRef<AgentClient | null>(null)

  // Initialize AgentClient on mount
  useEffect(() => {
    const client = new AgentClient(config, {
      onStatusChange: setStatus,
      onError: (err) => {
        setError(err)
        config.onError?.(err)
      },
      onMessage: (message) => {
        setMessages(prev => [...prev, message])
        setIsStreaming(true)
      },
      onMessageUpdate: (message) => {
        setMessages(prev =>
          prev.map(m => m.id === message.id ? message : m)
        )
        if (message.status === 'complete' || message.status === 'error') {
          setIsStreaming(false)
        }
      },
      onToolCall: (toolCall) => {
        setTools(prev => [...prev, toolCall])
      },
      onToolCallUpdate: (toolCall) => {
        setTools(prev =>
          prev.map(t => t.id === toolCall.id ? toolCall : t)
        )
      },
      onStateDelta: (patch) => {
        setAgentState(prev => applyJsonPatch(prev, patch))
        stateDeltaSubscribers.current.forEach(sub => sub(patch))
      },
      onRunStart: (runId) => {
        setIsStreaming(true)
        config.onRunStart?.(runId)
      },
      onRunFinish: (runId) => {
        setIsStreaming(false)
        config.onRunFinish?.(runId)
      },
    })

    clientRef.current = client

    return () => {
      client.disconnect()
    }
  }, [config.endpoint])

  // Sync tools with client when registry changes
  useEffect(() => {
    if (clientRef.current) {
      clientRef.current.setTools(Array.from(toolRegistry.current.values()))
    }
  }, [toolRegistry.current.size])

  // Sync context with client when registry changes
  useEffect(() => {
    if (clientRef.current) {
      const context: Record<string, unknown> = {}
      contextRegistry.current.forEach((entry) => {
        context[entry.key] = entry.value
      })
      clientRef.current.setContext(context)
    }
  }, [contextRegistry.current.size])

  const connect = useCallback(() => {
    clientRef.current?.connect()
  }, [])

  const disconnect = useCallback(() => {
    clientRef.current?.disconnect()
  }, [])

  const send = useCallback((content: string) => {
    // Add user message immediately for optimistic UI
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      status: 'complete',
      toolCalls: [],
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMessage])

    // Send to backend
    clientRef.current?.send(content)
  }, [])

  const stop = useCallback(() => {
    clientRef.current?.stop()
    setIsStreaming(false)
  }, [])

  const reset = useCallback(() => {
    setMessages([])
    setTools([])
    setError(null)
    setIsStreaming(false)
  }, [])

  const registerTool = useCallback((tool: ToolDefinition) => {
    toolRegistry.current.set(tool.name, tool)
    if (clientRef.current) {
      clientRef.current.setTools(Array.from(toolRegistry.current.values()))
    }
  }, [])

  const unregisterTool = useCallback((name: string) => {
    toolRegistry.current.delete(name)
    if (clientRef.current) {
      clientRef.current.setTools(Array.from(toolRegistry.current.values()))
    }
  }, [])

  const setContext = useCallback((key: string, value: unknown, description: string) => {
    contextRegistry.current.set(key, { key, value, description })
    if (clientRef.current) {
      const context: Record<string, unknown> = {}
      contextRegistry.current.forEach((entry) => {
        context[entry.key] = entry.value
      })
      clientRef.current.setContext(context)
    }
  }, [])

  const removeContext = useCallback((key: string) => {
    contextRegistry.current.delete(key)
    if (clientRef.current) {
      const context: Record<string, unknown> = {}
      contextRegistry.current.forEach((entry) => {
        context[entry.key] = entry.value
      })
      clientRef.current.setContext(context)
    }
  }, [])

  const value: ChatContextValue = useMemo(() => ({
    status,
    error,
    connect,
    disconnect,
    messages,
    isStreaming,
    send,
    stop,
    reset,
    registerTool,
    unregisterTool,
    tools,
    setContext,
    removeContext,
    agentState,
    stateDeltaSubscribers: stateDeltaSubscribers.current,
  }), [
    status,
    error,
    connect,
    disconnect,
    messages,
    isStreaming,
    send,
    stop,
    reset,
    registerTool,
    unregisterTool,
    tools,
    setContext,
    removeContext,
    agentState,
  ])

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  )
}
