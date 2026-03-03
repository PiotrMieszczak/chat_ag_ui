# chat-ag-ui Specification

## Overview

A headless React library for building AG-UI protocol chat interfaces. Provides hooks and render-prop components that connect to any AG-UI compatible backend, with full support for frontend-registered tools, readable context, and bidirectional state synchronization.

**Package name:** `chat-ag-ui`
**Repository:** `git@github.com:PiotrMieszczak/chat_ag_ui.git`

---

## Goals

1. **Headless first** — Zero UI opinions, consumers bring their own styling
2. **AG-UI native** — Built on `@ag-ui/client` SDK, follows protocol exactly
3. **Frontend tool execution** — Register tools that run in the browser
4. **Context injection** — Provide app state the agent can "see"
5. **Type-safe** — Full TypeScript support with strict types
6. **Minimal footprint** — Only `@ag-ui/client` and `react` as peer dependencies

---

## User Stories

### P1 (Must Have)

- **US-1:** As a developer, I can connect to an AG-UI endpoint and receive streamed messages
- **US-2:** As a developer, I can send user messages and see assistant responses
- **US-3:** As a developer, I can register frontend tools the agent can call
- **US-4:** As a developer, I can provide context data the agent can read
- **US-5:** As a developer, I can use render-prop components for full styling control

### P2 (Should Have)

- **US-6:** As a developer, I can subscribe to STATE_DELTA updates from the agent
- **US-7:** As a developer, I can see tool execution status (pending/running/complete)
- **US-8:** As a developer, I can handle connection errors and reconnection
- **US-9:** As a developer, I can cancel/abort streaming responses

### P3 (Nice to Have)

- **US-10:** As a developer, I can validate tool arguments against JSON Schema
- **US-11:** As a developer, I can persist and restore conversation history

---

## Tech Stack

| Concern | Choice |
|---------|--------|
| Language | TypeScript 5+ |
| Framework | React 18+ (peer dependency) |
| AG-UI SDK | `@ag-ui/client` (peer dependency) |
| Build | Vite (library mode) |
| Unit tests | Vitest + Testing Library |
| Component tests | Playwright CT |
| Visual tests | Playwright (against demo app) |
| Mock server | MSW |

---

## Architecture

### Project Structure

```
chat-ag-ui/
├── src/
│   ├── core/
│   │   ├── AgentClient.ts        ← Wraps @ag-ui/client, manages connection
│   │   ├── eventHandlers.ts      ← AG-UI event processing
│   │   └── types.ts              ← Public TypeScript interfaces
│   ├── hooks/
│   │   ├── useChatAgent.ts       ← Main hook: connect, send, receive
│   │   ├── useRegisterTool.ts    ← Register frontend-executable tools
│   │   ├── useReadableContext.ts ← Provide context agent can "see"
│   │   └── useAgentState.ts      ← Subscribe to STATE_DELTA updates
│   ├── components/
│   │   ├── ChatProvider.tsx      ← Context provider, wires everything
│   │   └── headless/
│   │       ├── MessageList.tsx   ← Render prop message container
│   │       ├── ChatInput.tsx     ← Render prop input handler
│   │       ├── ToolCallList.tsx  ← Render prop tool status
│   │       └── ConnectionStatus.tsx ← Render prop connection state
│   ├── utils/
│   │   ├── jsonPatch.ts          ← RFC 6902 JSON Patch application
│   │   └── validation.ts         ← JSON Schema validation for tool args
│   └── index.ts                  ← Public exports
├── demo/
│   ├── index.html
│   ├── main.tsx
│   ├── App.tsx                   ← Full example using library
│   ├── MockAgentServer.ts        ← MSW handlers for fake backend
│   ├── scenarios/
│   │   ├── BasicChat.tsx
│   │   ├── WithTools.tsx
│   │   └── StateSync.tsx
│   └── vite.config.ts
├── tests/
│   ├── unit/
│   │   ├── jsonPatch.test.ts
│   │   ├── validation.test.ts
│   │   └── eventHandlers.test.ts
│   ├── hooks/
│   │   ├── useChatAgent.test.ts
│   │   ├── useRegisterTool.test.ts
│   │   └── useAgentState.test.ts
│   └── e2e/
│       ├── components/
│       │   ├── MessageList.spec.tsx
│       │   ├── ChatInput.spec.tsx
│       │   └── ToolCallList.spec.tsx
│       └── visual/
│           └── demo.spec.ts
├── specs/
│   └── spec.md                   ← This file
├── package.json
├── vite.config.ts
├── playwright.config.ts
├── playwright-ct.config.ts
├── vitest.config.ts
└── tsconfig.json
```

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     CONSUMER'S APP                              │
│                                                                 │
│  // 1. Register tools (what agent CAN do)                       │
│  useRegisterTool({ name: 'filterEvents', execute: fn })         │
│                                                                 │
│  // 2. Provide context (what agent CAN see)                     │
│  useReadableContext('selectedEvents', events)                   │
│                                                                 │
│  // 3. Use headless components with custom rendering            │
│  <MessageList>{({ messages }) => ...}</MessageList>             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LIBRARY (chat-ag-ui)                         │
│                                                                 │
│  ChatProvider                                                   │
│  ├── Collects tool definitions from useRegisterTool             │
│  ├── Collects context from useReadableContext                   │
│  ├── Opens SSE connection via AgentClient                       │
│  ├── Sends tools + context on init                              │
│  ├── Sends context with each message                            │
│  ├── Executes tools when ToolCallEnd received                   │
│  └── Applies STATE_DELTA patches to useAgentState               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (any AG-UI server)                   │
│                                                                 │
│  Receives: tool definitions, context, user messages             │
│  Emits: AG-UI events (RunStarted, TextMessage*, ToolCall*, etc) │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Public API

### Hooks

#### `useChatAgent`

```typescript
const {
  status,           // 'disconnected' | 'connecting' | 'connected' | 'error'
  error,            // Error | null
  messages,         // Message[]
  isStreaming,      // boolean
  send,             // (text: string) => void
  stop,             // () => void
  reset,            // () => void
} = useChatAgent(options?: UseChatAgentOptions)
```

#### `useRegisterTool`

```typescript
useRegisterTool<TArgs, TResult>({
  name: string,
  description: string,
  parameters: ToolParameterSchema,
  execute: (args: TArgs, context: ToolExecutionContext) => Promise<TResult>,
  deps?: unknown[],
})
```

#### `useReadableContext`

```typescript
useReadableContext<T>(
  key: string,
  value: T,
  options: { description: string, lazy?: boolean }
)
```

#### `useAgentState`

```typescript
const state = useAgentState<T>({
  initialState: T,
  validate?: (patch, currentState) => boolean,
  onDelta?: (patch, newState) => void,
})
```

### Components

#### `ChatProvider`

```typescript
<ChatProvider
  endpoint="/api/agent"
  headers?: Record<string, string>
  reconnect?: { enabled: boolean, maxAttempts: number, delayMs: number }
  onError?: (error: ChatError) => void
>
  {children}
</ChatProvider>
```

#### `MessageList`

```typescript
<MessageList className? style? autoScroll?>
  {({ messages, isStreaming }) => ReactNode}
</MessageList>
```

#### `ChatInput`

```typescript
<ChatInput placeholder? disabled? submitOnEnter?>
  {({ value, onChange, onSubmit, isDisabled, placeholder }) => ReactNode}
</ChatInput>
```

#### `ToolCallList`

```typescript
<ToolCallList>
  {({ tools }) => ReactNode}
</ToolCallList>
```

#### `ConnectionStatus`

```typescript
<ConnectionStatus>
  {({ status, error, reconnect }) => ReactNode}
</ConnectionStatus>
```

---

## Types

### Core Types

```typescript
export type MessageRole = 'user' | 'assistant'
export type MessageStatus = 'pending' | 'streaming' | 'complete' | 'error'

export interface Message {
  readonly id: string
  readonly role: MessageRole
  readonly content: string
  readonly status: MessageStatus
  readonly toolCalls: readonly ToolCall[]
  readonly timestamp: Date
  readonly metadata?: Readonly<Record<string, unknown>>
}

export type ToolStatus = 'pending' | 'running' | 'complete' | 'error'

export interface ToolCall {
  readonly id: string
  readonly name: string
  readonly args: Readonly<Record<string, unknown>>
  readonly status: ToolStatus
  readonly result?: unknown
  readonly error?: Error
}

export interface ToolParameterSchema {
  readonly type: 'object'
  readonly properties: Readonly<Record<string, {
    readonly type: 'string' | 'number' | 'boolean' | 'object' | 'array'
    readonly description?: string
    readonly enum?: readonly unknown[]
    readonly items?: ToolParameterSchema
    readonly properties?: ToolParameterSchema['properties']
  }>>
  readonly required?: readonly string[]
}

export interface ToolDefinition<TArgs = Record<string, unknown>, TResult = unknown> {
  readonly name: string
  readonly description: string
  readonly parameters: ToolParameterSchema
  readonly execute: ToolExecutor<TArgs, TResult>
}

export type ToolExecutor<TArgs, TResult> = (
  args: TArgs,
  context: ToolExecutionContext
) => Promise<TResult>

export interface ToolExecutionContext {
  readonly toolCallId: string
  readonly abortSignal: AbortSignal
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

export interface JsonPatchOperation {
  readonly op: 'add' | 'remove' | 'replace' | 'move' | 'copy' | 'test'
  readonly path: string
  readonly value?: unknown
  readonly from?: string
}

export type JsonPatch = readonly JsonPatchOperation[]
```

### Error Types

```typescript
export type ChatErrorCode =
  | 'CONNECTION_FAILED'
  | 'CONNECTION_LOST'
  | 'MESSAGE_SEND_FAILED'
  | 'TOOL_EXECUTION_FAILED'
  | 'TOOL_NOT_FOUND'
  | 'INVALID_EVENT'
  | 'STATE_PATCH_FAILED'
  | 'TIMEOUT'

export class ChatError extends Error {
  readonly code: ChatErrorCode
  readonly cause?: Error
  readonly metadata?: Readonly<Record<string, unknown>>
}
```

---

## Backend Contract

### Endpoints

| Route | Method | Purpose |
|-------|--------|---------|
| `/` or `/sse` | GET (SSE) | Event stream connection |
| `/` or `/message` | POST | Send user message |
| `/tool-result` | POST | Return tool execution result |

### Init Payload (sent on connect)

```typescript
{
  type: 'init',
  tools: ToolDefinition[],
  context: Record<string, unknown>
}
```

### Message Payload (sent on user message)

```typescript
{
  type: 'message',
  content: string,
  context: Record<string, unknown>,
  threadId?: string
}
```

### Tool Result Payload

```typescript
{
  toolCallId: string,
  result: unknown
}
```

### AG-UI Events (backend emits)

| Event | Purpose |
|-------|---------|
| `RunStarted` | Agent execution started |
| `TextMessageStart` | Begin assistant message |
| `TextMessageContent` | Streamed text chunk |
| `TextMessageEnd` | End assistant message |
| `ToolCallStart` | Tool invocation started |
| `ToolCallArgs` | Streamed tool arguments |
| `ToolCallEnd` | Tool call ready for execution |
| `StateDelta` | JSON Patch for state update |
| `RunFinished` | Agent execution complete |
| `RunError` | Agent execution failed |

---

## Testing Strategy

### Unit Tests (Vitest)

Test pure logic only:
- JSON Patch application (`applyJsonPatch`)
- Tool argument validation (`validateToolArgs`)
- Event handlers (message accumulation, tool parsing)
- Reconnection backoff calculation

### Hook Tests (Vitest + Testing Library)

Test observable behavior via effects:
- Connection status changes
- Message accumulation from streamed events
- Tool execution when ToolCallEnd received
- Context sent with messages

### Component Tests (Playwright CT)

Test render-prop behavior in real browser:
- MessageList renders children with correct props
- ChatInput handles submit and clears value
- ToolCallList shows active/completed tools
- ConnectionStatus reflects connection state

### Visual Regression (Playwright)

Screenshot tests against demo app:
- Empty state
- With messages
- Streaming state
- Tool execution states
- Error state

### Coverage Goals

| Area | Target |
|------|--------|
| Utils | 90%+ |
| Hooks | 80%+ |
| Components | 70%+ |

---

## CI/CD

### Pipeline Jobs

1. **test** — Type check, lint, unit tests, coverage upload
2. **playwright** — Build library, component tests, visual regression
3. **release** — Publish to npm (on main, if version changed)

### Triggers

- Push to `main`
- Pull requests to `main`

---

## Success Criteria

1. Consumer can connect to any AG-UI backend with `<ChatProvider endpoint="...">`
2. Consumer can register tools that execute in the browser
3. Consumer can provide context data sent with each message
4. Consumer has full control over UI rendering via render props
5. Library has zero runtime dependencies beyond peer deps
6. All tests pass in CI
7. Published to npm as `chat-ag-ui`

---

## Out of Scope (v1)

- Thread/conversation persistence
- Generative UI / A2UI widget rendering
- Multi-agent coordination
- Angular/Vue/Svelte support
- Mobile-specific components
