import React, { useState } from 'react'
import {
  ChatProvider,
  MessageList,
  ChatInput,
  ToolCallList,
  ConnectionStatus,
  useRegisterTool,
  useReadableContext,
} from 'chat-ag-ui'
import './styles.css'

const SESSIONS = [
  { id: '1', title: 'Campaign event query', meta: 'Just now', active: true },
  { id: '2', title: 'iHatei faction overview', meta: '2 hours ago', active: false },
  { id: '3', title: 'Doom clock status', meta: '7 days ago', active: false },
]

const INITIAL_EVENTS = [
  { id: 1, name: 'Raid on Convoy', faction: 'iHatei' },
  { id: 2, name: 'Trade Agreement', faction: 'Imperium' },
  { id: 3, name: 'Pirate Attack', faction: 'iHatei' },
]

function statusLabel(status: string, error?: Error | null) {
  if (status === 'connected') return 'Connected'
  if (status === 'connecting') return 'Connecting…'
  if (status === 'error') return error?.message ? `Error: ${error.message}` : 'Error'
  return 'Disconnected'
}

function ChatDemo() {
  const [events] = useState(INITIAL_EVENTS)

  useRegisterTool({
    name: 'filterEvents',
    description: 'Filter campaign events by faction name',
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

  useReadableContext('events', events, {
    description: 'List of all campaign events with faction info',
  })

  return (
    <div className="app">

      {/* ── Sidebar ──────────────────────────────── */}
      <aside className="sidebar">
        <div className="sidebar__header">
          <div className="sidebar__brand">
            <div className="sidebar__logo">A</div>
            <div className="sidebar__brand-text">
              <span className="sidebar__brand-name">chat-ag-ui</span>
              <span className="sidebar__brand-sub">AG-UI Protocol</span>
            </div>
          </div>
          <button className="sidebar__new-btn" title="New chat">+</button>
        </div>

        <div className="sidebar__section-label">Conversations</div>

        <div className="sidebar__sessions">
          {SESSIONS.map(s => (
            <div key={s.id} className={`sidebar__session${s.active ? ' sidebar__session--active' : ''}`}>
              <div className="sidebar__session-title">{s.title}</div>
              <div className="sidebar__session-meta">{s.meta}</div>
            </div>
          ))}
        </div>

        <div className="sidebar__footer">
          <ConnectionStatus>
            {({ status, error }) => (
              <>
                <div className="sidebar__conn">
                  <div className={`sidebar__conn-dot${status !== 'connected' ? ` sidebar__conn-dot--${status}` : ''}`} />
                  <span className="sidebar__conn-label">{statusLabel(status, error)}</span>
                </div>
                <div className="sidebar__endpoint">/api/agent</div>
              </>
            )}
          </ConnectionStatus>
        </div>
      </aside>

      {/* ── Main chat ────────────────────────────── */}
      <main className="chat">

        {/* Header */}
        <ConnectionStatus>
          {({ status }) => (
            <div className="chat__header">
              <div className="chat__header-avatar">A</div>
              <div className="chat__header-info">
                <div className="chat__header-name">Campaign Assistant</div>
                <div className="chat__header-sub">AG-UI Agent · Pirates of Drinax</div>
              </div>
              <div className={`chat__header-badge${status !== 'connected' ? ` chat__header-badge--${status}` : ''}`}>
                <div className="chat__header-badge-dot" />
                {statusLabel(status)}
              </div>
            </div>
          )}
        </ConnectionStatus>

        {/* Active tool banner */}
        <ToolCallList>
          {({ tools }) => {
            const running = tools.filter(t => t.status === 'running')
            if (running.length === 0) return null
            return (
              <div className="chat__tool-banner">
                <div className="chat__tool-spinner" />
                Running: {running.map(t => t.name).join(', ')}
              </div>
            )
          }}
        </ToolCallList>

        {/* Messages */}
        <MessageList className="chat__messages">
          {({ messages, isStreaming }) => (
            <>
              {messages.length === 0 && !isStreaming && (
                <div className="chat__empty">
                  <div className="chat__empty-icon">💬</div>
                  <div className="chat__empty-text">Start a conversation</div>
                  <div className="chat__empty-sub">Ask the agent about your campaign events</div>
                </div>
              )}

              {messages.map(msg => (
                <div key={msg.id} className={`msg-row msg-row--${msg.role}`}>
                  {msg.role === 'assistant' && (
                    <div className="msg-avatar">A</div>
                  )}
                  <div className="msg-bubble">
                    {msg.content}
                    {msg.toolCalls.length > 0 && (
                      <div className="msg-tools">
                        {msg.toolCalls.map(tool => (
                          <div key={tool.id} className="tool-card">
                            <div className="tool-card__header">
                              <span className="tool-card__icon">
                                {tool.status === 'running' ? '⚙' : '✓'}
                              </span>
                              {tool.name}
                            </div>
                            {tool.result != null && (
                              <div className="tool-card__result">
                                {JSON.stringify(tool.result, null, 2)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isStreaming && (
                <div className="chat__typing">
                  <div className="chat__typing-avatar">A</div>
                  <div className="chat__typing-dots">
                    <span /><span /><span />
                  </div>
                </div>
              )}
            </>
          )}
        </MessageList>

        {/* Input bar */}
        <div className="chat__input-bar">
          <ChatInput submitOnEnter placeholder="Message Campaign Assistant…">
            {({ value, onChange, onKeyDown, onSubmit, isDisabled, placeholder }) => (
              <form onSubmit={onSubmit} className="chat__input-form">
                <input
                  className="chat__input-field"
                  value={value}
                  onChange={e => onChange(e.target.value)}
                  onKeyDown={onKeyDown}
                  disabled={isDisabled}
                  placeholder={placeholder}
                  autoComplete="off"
                />
                <button
                  type="submit"
                  className="chat__send-btn"
                  disabled={isDisabled || !value.trim()}
                  aria-label="Send message"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </form>
            )}
          </ChatInput>
          <div className="chat__input-hint">Press Enter to send · Shift+Enter for new line</div>
        </div>

      </main>
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
