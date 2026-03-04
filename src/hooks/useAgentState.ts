import { useEffect, useState } from 'react'
import { useChatContext } from '../components/ChatContext'
import { applyJsonPatch } from '../utils/jsonPatch'
import type { JsonPatch } from '../core/types'

export interface UseAgentStateOptions<T> {
  initialState: T
  /**
   * Optional validator for JSON Patch operations.
   * Return false to reject a patch and keep current state.
   */
  validate?: (patch: JsonPatch, currentState: T) => boolean
  /**
   * Callback called after each successful state update.
   * Useful for side effects like persisting to localStorage.
   */
  onDelta?: (patch: JsonPatch, newState: T) => void
}

/**
 * useAgentState subscribes to STATE_DELTA events from the backend.
 *
 * When the agent dispatches a STATE_DELTA event, the patch is applied
 * to the local state using JSON Patch (RFC 6902).
 *
 * This enables bidirectional state synchronization:
 * - Backend sends patches → Frontend applies them
 * - Multiple components can subscribe to the same state updates
 *
 * Features:
 * - JSON Patch (RFC 6902) for atomic state updates
 * - Optional validation to reject malicious or invalid patches
 * - Callback for side effects after state changes
 *
 * Example usage:
 * ```tsx
 * const gameState = useAgentState({
 *   initialState: { doomClock: { pri: 5, aslan: 3, imperium: 2 } },
 *   onDelta: (patch, newState) => {
 *     console.log('Game state updated:', newState)
 *   }
 * })
 * ```
 *
 * Security considerations:
 * - JSON Patches come from the backend - validate if you don't trust it
 * - Malicious patches could overwrite sensitive state
 * - Use the `validate` option to reject unauthorized state changes
 */
export function useAgentState<T extends Record<string, unknown>>(
  options: UseAgentStateOptions<T>
): T {
  const { stateDeltaSubscribers } = useChatContext()
  const [state, setState] = useState<T>(options.initialState)

  useEffect(() => {
    const handleDelta = (patch: JsonPatch) => {
      setState(currentState => {
        // Validate if validator provided
        if (options.validate && !options.validate(patch, currentState)) {
          return currentState
        }

        try {
          const newState = applyJsonPatch(currentState, patch) as T
          options.onDelta?.(patch, newState)
          return newState
        } catch {
          // If patch fails, keep current state
          return currentState
        }
      })
    }

    stateDeltaSubscribers.add(handleDelta)

    return () => {
      stateDeltaSubscribers.delete(handleDelta)
    }
  }, [stateDeltaSubscribers, options.validate, options.onDelta])

  return state
}
