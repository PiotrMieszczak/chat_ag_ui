import React from 'react'
import { useChatContext } from '../ChatContext'
import type { ToolCall } from '../../core/types'

export interface ToolCallListRenderProps {
  tools: ToolCall[]
}

export interface ToolCallListProps {
  children: (props: ToolCallListRenderProps) => React.ReactNode
}

/**
 * ToolCallList is a headless component for displaying tool execution status.
 *
 * Features:
 * - Render prop pattern for custom tool UI
 * - Access to all tool calls with their status
 *
 * Example usage:
 * ```tsx
 * <ToolCallList>
 *   {({ tools }) => (
 *     <div>
 *       {tools.map(tool => (
 *         <div key={tool.id}>
 *           <span>{tool.name}</span>
 *           <span>{tool.status}</span>
 *         </div>
 *       ))}
 *     </div>
 *   )}
 * </ToolCallList>
 * ```
 */
export function ToolCallList({ children }: ToolCallListProps) {
  const { tools } = useChatContext()

  return <>{children({ tools })}</>
}
