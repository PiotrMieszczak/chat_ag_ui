# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**chat-ag-ui** — A headless React library for AG-UI protocol chat interfaces. Zero UI opinions, consumers bring their own styling.

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

## Commands

```bash
yarn install              # Install dependencies
yarn dev                  # Run demo app
yarn build                # Build library
yarn typecheck            # Type check
yarn lint                 # Lint
yarn test:unit            # Unit tests
yarn test:ct              # Playwright component tests
yarn test:visual          # Visual regression tests
```

## Architecture

### Core Hooks

- `useChatAgent` — Connection, messages, send/receive
- `useRegisterTool` — Frontend-executable tools
- `useReadableContext` — Context agent can "see"
- `useAgentState` — STATE_DELTA subscription

### Headless Components (Render Props)

- `ChatProvider` — Wires everything together
- `MessageList` — Message rendering
- `ChatInput` — Input handling
- `ToolCallList` — Tool status
- `ConnectionStatus` — Connection state

### Data Flow

1. Consumer registers tools via `useRegisterTool`
2. Consumer provides context via `useReadableContext`
3. Library sends tools + context to backend on connect
4. Library sends updated context with each message
5. When agent calls a tool, library executes it locally
6. STATE_DELTA patches applied to `useAgentState` subscribers

## Testing Philosophy

- **Unit tests**: Logic only (utils, reducers) — test effects, not implementation
- **Hook tests**: Observable behavior via Testing Library
- **Component tests**: Playwright CT in real browser
- **Visual tests**: Screenshot against demo app

## Styling

**NO TAILWIND CSS** — This is a headless library. Demo app uses minimal custom CSS.

## Key Files

- `specs/spec.md` — Full specification
- `src/index.ts` — Public API exports
- `demo/App.tsx` — Usage example
- `demo/MockAgentServer.ts` — MSW handlers for testing
