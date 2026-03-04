import React, { useState, useCallback } from 'react'
import { useChatContext } from '../ChatContext'

export interface ChatInputRenderProps {
  value: string
  onChange: (value: string) => void
  onKeyDown: (e: React.KeyboardEvent) => void
  onSubmit: (e: React.FormEvent) => void
  isDisabled: boolean
  placeholder: string
}

export interface ChatInputProps {
  children: (props: ChatInputRenderProps) => React.ReactNode
  placeholder?: string
  disabled?: boolean
  submitOnEnter?: boolean
}

/**
 * ChatInput is a headless component for message input.
 *
 * Features:
 * - Render prop pattern for custom input UI
 * - Automatic disabled state during streaming
 * - Value management with form submission
 *
 * Example usage:
 * ```tsx
 * <ChatInput placeholder="Ask something...">
 *   {({ value, onChange, onSubmit, isDisabled, placeholder }) => (
 *     <form onSubmit={onSubmit}>
 *       <input
 *         value={value}
 *         onChange={e => onChange(e.target.value)}
 *         disabled={isDisabled}
 *         placeholder={placeholder}
 *       />
 *     </form>
 *   )}
 * </ChatInput>
 * ```
 */
export function ChatInput({
  children,
  placeholder = 'Type a message...',
  disabled = false,
  submitOnEnter = true,
}: ChatInputProps) {
  const { send, isStreaming } = useChatContext()
  const [value, setValue] = useState('')

  const isDisabled = disabled || isStreaming

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (value.trim() && !isDisabled) {
      send(value.trim())
      setValue('')
    }
  }, [value, isDisabled, send])

  const handleChange = useCallback((newValue: string) => {
    setValue(newValue)
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (submitOnEnter && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (value.trim() && !isDisabled) {
        send(value.trim())
        setValue('')
      }
    }
  }, [submitOnEnter, value, isDisabled, send])

  return children({
    value,
    onChange: handleChange,
    onKeyDown: handleKeyDown,
    onSubmit: handleSubmit,
    isDisabled,
    placeholder,
  })
}
