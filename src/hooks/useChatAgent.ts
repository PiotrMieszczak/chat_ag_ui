import { useChatContext } from '../components/ChatContext'

export interface UseChatAgentOptions {
  /**
   * If true, don't auto-connect on mount.
   * Consumer must call `connect()` manually.
   */
  manual?: boolean
}

/**
 * useChatAgent is the primary hook for consumers to interact with the chat agent.
 *
 * Provides:
 * - Connection status and error state
 * - Message history and streaming status
 * - Methods to send messages, stop streaming, reset history
 *
 * Example usage:
 * ```tsx
 * const { messages, send, isStreaming } = useChatAgent()
 * ```
 */
export function useChatAgent(_options: UseChatAgentOptions = {}) {
  const context = useChatContext()

  return {
    status: context.status,
    error: context.error,
    messages: context.messages,
    isStreaming: context.isStreaming,
    send: context.send,
    stop: context.stop,
    reset: context.reset,
  }
}
