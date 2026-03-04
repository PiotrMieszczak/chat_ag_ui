import React, { useState, useEffect } from 'react'
import {
  ChatProvider,
  MessageList,
  ChatInput,
  ToolCallList,
  ConnectionStatus,
  useRegisterTool,
  useReadableContext,
  useChatAgent,
} from 'chat-ag-ui'
import './styles.css'

function ChatDemo() {
  const { status, connect } = useChatAgent()
  const [events] = useState([
    { id: 1, name: 'Raid on Convoy', faction: 'iHatei' },
    { id: 2, name: 'Trade Agreement', faction: 'Imperium' },
    { id: 3, name: 'Pirate Attack', faction: 'iHatei' },
  ])

  // Connect on mount
  useEffect(() => {
    if (status === 'disconnected') {
      connect()
    }
  }, [status, connect])

  // Register a sample tool
  useRegisterTool({
    name: 'filterEvents',
    description: 'Filter events by faction name',
    parameters: {
      type: 'object',
      properties: {
        faction: { type: 'string', description: 'Faction name to filter by' },
      },
      required: ['faction'],
    },
    execute: async ({ faction }) => {
      const filtered = events.filter(e =>
        e.faction.toLowerCase().includes((faction as string).toLowerCase())
      )
      return { count: filtered.length, events: filtered }
    },
  })

  // Provide context
  useReadableContext('events', events, {
    description: 'List of campaign events',
  })

  return (
    <div className="chat-demo" data-testid="chat-container">
      <ConnectionStatus>
        {({ status, error, reconnect }) => (
          <div className={`status status--${status}`}>
            {status === 'connected' && '🟢 Connected'}
            {status === 'connecting' && '🟡 Connecting...'}
            {status === 'disconnected' && '⚪ Disconnected'}
            {status === 'error' && (
              <>
                🔴 Error: {error?.message}
                <button onClick={reconnect} style={{ marginLeft: 8 }}>
                  Retry
                </button>
              </>
            )}
          </div>
        )}
      </ConnectionStatus>

      <MessageList className="messages">
        {({ messages, isStreaming }) => (
          <>
            {messages.length === 0 && (
              <div className="typing-indicator">
                No messages yet. Start a conversation!
              </div>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className={`message message--${msg.role}`}>
                <div>{msg.content}</div>
                {msg.toolCalls?.map((tool) => (
                  <div key={tool.id} className="message__tool">
                    {tool.status === 'running' ? '⏳' : '✓'} {tool.name}
                    {tool.result && (
                      <span> - {JSON.stringify(tool.result)}</span>
                    )}
                  </div>
                ))}
              </div>
            ))}
            {isStreaming && (
              <div className="typing-indicator">Agent is typing...</div>
            )}
          </>
        )}
      </MessageList>

      <ToolCallList>
        {({ tools }) => {
          const active = tools.filter((t) => t.status === 'running')
          if (active.length === 0) return null
          return (
            <div style={{ marginBottom: 8, fontSize: 12, color: '#888' }}>
              Running: {active.map((t) => t.name).join(', ')}
            </div>
          )
        }}
      </ToolCallList>

      <ChatInput submitOnEnter placeholder="Ask the agent...">
        {({ value, onChange, onKeyDown, onSubmit, isDisabled, placeholder }) => (
          <form onSubmit={onSubmit} className="input-form">
            <input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={isDisabled}
              placeholder={placeholder}
            />
            <button type="submit" disabled={isDisabled || !value.trim()}>
              Send
            </button>
          </form>
        )}
      </ChatInput>
    </div>
  )
}

export default function App() {
  return (
    <ChatProvider endpoint="/api/agent">
      <ChatDemo />
    </ChatProvider>
  )
}
