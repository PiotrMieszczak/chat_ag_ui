import { useEffect, useRef } from 'react'
import { useChatContext } from '../components/ChatContext'
import type { ToolDefinition, ToolParameterSchema, ToolExecutor, ToolExecutionContext } from '../core/types'

export interface UseRegisterToolOptions<TArgs, TResult> {
  name: string
  description: string
  parameters: ToolParameterSchema
  execute: ToolExecutor<TArgs, TResult>
  /**
   * Dependencies that, when changed, cause the tool to be re-registered.
   * Useful for functions that close over external state.
   */
  deps?: unknown[]
}

/**
 * useRegisterTool registers a frontend-executable tool with the chat agent.
 *
 * The tool will be executed locally in the browser when the agent requests it.
 * Results are sent back to the backend via the /tool-result endpoint.
 *
 * Features:
 * - Automatic cleanup on unmount
 * - Re-registers when dependencies change
 * - Stable reference to execute function (via useRef)
 *
 * Example usage:
 * ```tsx
 * useRegisterTool({
 *   name: 'filterEvents',
 *   description: 'Filter events by faction',
 *   parameters: {
 *     type: 'object',
 *     properties: {
 *       faction: { type: 'string', description: 'Faction name' }
 *     },
 *     required: ['faction']
 *   },
 *   execute: async (args, context) => {
 *     return events.filter(e => e.faction === args.faction)
 *   },
 *   deps: [events] // Re-register when events change
 * })
 * ```
 *
 * Security considerations:
 * - Tool arguments come from the backend - validate before use
 * - AbortSignal allows cancellation of long-running operations
 * - Be careful not to expose sensitive application state through tool results
 */
export function useRegisterTool<
  TArgs = Record<string, unknown>,
  TResult = unknown
>(options: UseRegisterToolOptions<TArgs, TResult>): void {
  const { registerTool, unregisterTool } = useChatContext()
  const optionsRef = useRef(options)
  optionsRef.current = options

  useEffect(() => {
    const name = optionsRef.current.name
    const tool: ToolDefinition<TArgs, TResult> = {
      name,
      description: optionsRef.current.description,
      parameters: optionsRef.current.parameters,
      execute: (args: TArgs, context: ToolExecutionContext) =>
        optionsRef.current.execute(args, context),
    }

    registerTool(tool as ToolDefinition)

    return () => {
      unregisterTool(name)
    }
  }, [options.name, registerTool, unregisterTool, ...(options.deps || [])])
}
