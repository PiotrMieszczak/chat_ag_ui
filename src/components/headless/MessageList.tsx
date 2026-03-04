import React, { useEffect, useRef } from 'react'
import { useChatContext } from '../ChatContext'
import type { Message } from '../../core/types'

export interface MessageListRenderProps {
  messages: Message[]
  isStreaming: boolean
}

export interface MessageListProps {
  children: (props: MessageListRenderProps) => React.ReactNode
  className?: string
  style?: React.CSSProperties
  autoScroll?: boolean
}

/**
 * MessageList is a headless component for rendering chat messages.
 *
 * Features:
 * - Render prop pattern for full styling control
 * - Auto-scroll to bottom on new messages
 * - Access to streaming status for loading indicators
 *
 * Example usage:
 * ```tsx
 * <MessageList>
 *   {({ messages, isStreaming }) => (
 *     <div>
 *       {messages.map(msg => (
 *         <div key={msg.id}>{msg.content}</div>
 *       ))}
 *       {isStreaming && <div>Typing...</div>}
 *     </div>
 *   )}
 * </MessageList>
 * ```
 */
export function MessageList({
  children,
  className,
  style,
  autoScroll = true,
}: MessageListProps) {
  const { messages, isStreaming } = useChatContext()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [messages, autoScroll])

  const defaultStyle: React.CSSProperties = {
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    ...style,
  }

  return (
    <div ref={containerRef} className={className} style={defaultStyle}>
      {children({ messages, isStreaming })}
    </div>
  )
}
