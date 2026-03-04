import { useEffect, useRef } from 'react'
import { useChatContext } from '../components/ChatContext'

export interface UseReadableContextOptions {
  /**
   * Human-readable description of what this context represents.
   * Sent to the backend to help the agent understand the data.
   */
  description: string
  /**
   * If true, don't send context automatically.
   * Consumer must manually call setContext when needed.
   */
  lazy?: boolean
}

/**
 * useReadableContext provides application state to the agent.
 *
 * The context is sent with each message so the agent can "see" relevant
 * application state when generating responses.
 *
 * Features:
 * - Automatic cleanup on unmount
 * - Updates context when value changes (unless lazy)
 * - Stable reference pattern to avoid unnecessary re-registrations
 *
 * Example usage:
 * ```tsx
 * useReadableContext('selectedEvents', selectedEvents, {
 *   description: 'Currently selected events on the map',
 * })
 * ```
 *
 * Security considerations:
 * - Context data is sent to the backend with each message
 * - Be careful not to expose sensitive user data through context
 * - Use the `lazy` option for sensitive data that should only be sent explicitly
 */
export function useReadableContext<T>(
  key: string,
  value: T,
  options: UseReadableContextOptions
): void {
  const { setContext, removeContext } = useChatContext()
  const valueRef = useRef(value)
  valueRef.current = value

  // Register context on mount
  useEffect(() => {
    if (!options.lazy) {
      setContext(key, valueRef.current, options.description)
    }

    return () => {
      removeContext(key)
    }
  }, [key, options.description, options.lazy, setContext, removeContext])

  // Update context when value changes (unless lazy)
  useEffect(() => {
    if (!options.lazy) {
      setContext(key, value, options.description)
    }
  }, [key, value, options.description, options.lazy, setContext])
}
