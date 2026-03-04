import React from 'react'
import { useChatContext } from '../ChatContext'
import type { ConnectionStatus as ConnectionStatusType, ChatError } from '../../core/types'

export interface ConnectionStatusRenderProps {
  status: ConnectionStatusType
  error: ChatError | null
  reconnect: () => void
}

export interface ConnectionStatusProps {
  children: (props: ConnectionStatusRenderProps) => React.ReactNode
}

/**
 * ConnectionStatus is a headless component for displaying connection state.
 *
 * Features:
 * - Render prop pattern for custom status UI
 * - Access to connection status and errors
 * - Reconnect callback for manual reconnection
 *
 * Example usage:
 * ```tsx
 * <ConnectionStatus>
 *   {({ status, error, reconnect }) => (
 *     <div>
 *       <span>Status: {status}</span>
 *       {error && <span>Error: {error.message}</span>}
 *       {status === 'error' && <button onClick={reconnect}>Reconnect</button>}
 *     </div>
 *   )}
 * </ConnectionStatus>
 * ```
 */
export function ConnectionStatus({ children }: ConnectionStatusProps) {
  const { status, error, connect } = useChatContext()

  return <>{children({ status, error, reconnect: connect })}</>
}
