# chat-ag-ui Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a headless React library for AG-UI protocol chat interfaces with hooks and render-prop components.

**Architecture:** Layered approach — utilities first, then core client, then hooks, then components. Each layer depends only on layers below it. TDD throughout.

**Tech Stack:** TypeScript 5+, React 18+, Vite, Vitest, Playwright CT, MSW

---

## Phase 0: Project Setup

### Task 001: Initialize package.json and dependencies

**Files:**
- Create: `package.json`
- Create: `.npmrc`
- Create: `.gitignore`

**Step 1: Create package.json**

```json
{
  "name": "chat-ag-ui",
  "version": "0.1.0",
  "description": "Headless React library for AG-UI protocol chat interfaces",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  },
  "files": [
    "dist"
  ],
  "scripts": {
    "dev": "pnpm --filter demo dev",
    "build": "vite build && tsc --emitDeclarationOnly --outDir dist",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src --ext .ts,.tsx",
    "test:unit": "vitest run",
    "test:watch": "vitest",
    "test:ct": "playwright test -c playwright-ct.config.ts",
    "test:visual": "playwright test -c playwright.config.ts",
    "test:visual:update": "playwright test -c playwright.config.ts --update-snapshots",
    "prepublishOnly": "pnpm build"
  },
  "peerDependencies": {
    "@ag-ui/client": ">=0.0.1",
    "react": "^18.0.0"
  },
  "devDependencies": {
    "@ag-ui/client": "^0.0.19",
    "@playwright/experimental-ct-react": "^1.49.0",
    "@playwright/test": "^1.49.0",
    "@testing-library/react": "^16.0.0",
    "@types/react": "^18.3.0",
    "@typescript-eslint/eslint-plugin": "^8.0.0",
    "@typescript-eslint/parser": "^8.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "eslint": "^8.57.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "msw": "^2.6.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "typescript": "^5.6.0",
    "vite": "^5.4.0",
    "vite-plugin-dts": "^4.0.0",
    "vitest": "^2.1.0"
  },
  "keywords": [
    "ag-ui",
    "chat",
    "react",
    "headless",
    "hooks"
  ],
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "git@github.com:PiotrMieszczak/chat_ag_ui.git"
  }
}
```

**Step 2: Create .npmrc**

```
auto-install-peers=true
```

**Step 3: Create .gitignore**

```
node_modules/
dist/
coverage/
.DS_Store
*.log
playwright-report/
test-results/
playwright/.cache/
```

**Step 4: Install dependencies**

Run: `pnpm install`
Expected: Dependencies installed successfully

**Step 5: Commit**

```bash
git add package.json .npmrc .gitignore pnpm-lock.yaml
git commit -m "chore: initialize package with dependencies"
```

---

### Task 002: Configure TypeScript

**Files:**
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`

**Step 1: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "declaration": true,
    "declarationMap": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

**Step 2: Create tsconfig.node.json**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts", "playwright-ct.config.ts", "playwright.config.ts", "vitest.config.ts"]
}
```

**Step 3: Run typecheck**

Run: `pnpm typecheck`
Expected: No errors (empty src folder)

**Step 4: Commit**

```bash
git add tsconfig.json tsconfig.node.json
git commit -m "chore: configure TypeScript"
```

---

### Task 003: Configure Vite for library build

**Files:**
- Create: `vite.config.ts`

**Step 1: Create vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      exclude: ['**/*.test.ts', '**/*.test.tsx', 'demo/**', 'tests/**'],
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ChatAgUI',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime', '@ag-ui/client'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          '@ag-ui/client': 'AGUIClient',
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
})
```

**Step 2: Create placeholder src/index.ts**

```typescript
// chat-ag-ui - Headless React library for AG-UI protocol
export const VERSION = '0.1.0'
```

**Step 3: Run build**

Run: `pnpm build`
Expected: dist/index.js and dist/index.cjs created

**Step 4: Commit**

```bash
git add vite.config.ts src/index.ts
git commit -m "chore: configure Vite library build"
```

---

### Task 004: Configure Vitest

**Files:**
- Create: `vitest.config.ts`
- Create: `tests/setup.ts`

**Step 1: Create vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['src/index.ts'],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
})
```

**Step 2: Create tests/setup.ts**

```typescript
import '@testing-library/react'
```

**Step 3: Create placeholder test**

Create `tests/unit/placeholder.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { VERSION } from '../../src/index'

describe('placeholder', () => {
  it('exports VERSION', () => {
    expect(VERSION).toBe('0.1.0')
  })
})
```

**Step 4: Run tests**

Run: `pnpm test:unit`
Expected: 1 test passed

**Step 5: Commit**

```bash
git add vitest.config.ts tests/
git commit -m "chore: configure Vitest"
```

---

### Task 005: Configure ESLint

**Files:**
- Create: `.eslintrc.cjs`

**Step 1: Create .eslintrc.cjs**

```javascript
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'coverage', 'playwright-report'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-hooks', '@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
  },
}
```

**Step 2: Run lint**

Run: `pnpm lint`
Expected: No errors

**Step 3: Commit**

```bash
git add .eslintrc.cjs
git commit -m "chore: configure ESLint"
```

---

### Task 006: Configure Playwright

**Files:**
- Create: `playwright.config.ts`
- Create: `playwright-ct.config.ts`
- Create: `playwright/index.tsx`

**Step 1: Create playwright.config.ts (for visual tests)**

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e/visual',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5174',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm --filter demo dev',
    url: 'http://localhost:5174',
    reuseExistingServer: !process.env.CI,
  },
})
```

**Step 2: Create playwright-ct.config.ts (for component tests)**

```typescript
import { defineConfig, devices } from '@playwright/experimental-ct-react'
import { resolve } from 'path'

export default defineConfig({
  testDir: './tests/e2e/components',
  snapshotDir: './tests/e2e/components/__snapshots__',
  timeout: 10 * 1000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
    ctViteConfig: {
      resolve: {
        alias: {
          '@': resolve(__dirname, 'src'),
        },
      },
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
```

**Step 3: Create playwright/index.tsx**

```typescript
import { beforeMount } from '@playwright/experimental-ct-react/hooks'

beforeMount(async ({ App }) => {
  return <App />
})
```

**Step 4: Commit**

```bash
git add playwright.config.ts playwright-ct.config.ts playwright/
git commit -m "chore: configure Playwright for component and visual tests"
```

---

## Phase 1: Core Types and Utilities

### Task 007: Create core types

**Files:**
- Create: `src/core/types.ts`

**Step 1: Write the failing test**

Create `tests/unit/types.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import type {
  Message,
  MessageRole,
  MessageStatus,
  ToolCall,
  ToolStatus,
  ToolDefinition,
  ToolParameterSchema,
  ConnectionStatus,
  ChatErrorCode,
  JsonPatchOperation,
} from '../../src/core/types'
import { ChatError } from '../../src/core/types'

describe('types', () => {
  it('Message type has correct shape', () => {
    const message: Message = {
      id: '1',
      role: 'user',
      content: 'Hello',
      status: 'complete',
      toolCalls: [],
      timestamp: new Date(),
    }
    expect(message.id).toBe('1')
    expect(message.role).toBe('user')
  })

  it('ToolCall type has correct shape', () => {
    const toolCall: ToolCall = {
      id: 't1',
      name: 'filterEvents',
      args: { faction: 'iHatei' },
      status: 'complete',
      result: { count: 3 },
    }
    expect(toolCall.name).toBe('filterEvents')
  })

  it('ChatError has code and message', () => {
    const error = new ChatError('CONNECTION_FAILED', 'Failed to connect')
    expect(error.code).toBe('CONNECTION_FAILED')
    expect(error.message).toBe('Failed to connect')
    expect(error.name).toBe('ChatError')
  })

  it('ChatError preserves cause', () => {
    const cause = new Error('Network error')
    const error = new ChatError('CONNECTION_FAILED', 'Failed', { cause })
    expect(error.cause).toBe(cause)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm test:unit tests/unit/types.test.ts`
Expected: FAIL - Cannot find module

**Step 3: Write the implementation**

Create `src/core/types.ts`:

```typescript
// ============================================
// MESSAGE TYPES
// ============================================

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

// ============================================
// TOOL TYPES
// ============================================

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

// ============================================
// CONNECTION TYPES
// ============================================

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

export interface ConnectionState {
  readonly status: ConnectionStatus
  readonly error: Error | null
  readonly reconnectAttempts: number
}

// ============================================
// CONTEXT TYPES
// ============================================

export interface ReadableContextEntry<T = unknown> {
  readonly key: string
  readonly value: T
  readonly description: string
}

// ============================================
// JSON PATCH TYPES
// ============================================

export interface JsonPatchOperation {
  readonly op: 'add' | 'remove' | 'replace' | 'move' | 'copy' | 'test'
  readonly path: string
  readonly value?: unknown
  readonly from?: string
}

export type JsonPatch = readonly JsonPatchOperation[]

// ============================================
// ERROR TYPES
// ============================================

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

  constructor(
    code: ChatErrorCode,
    message: string,
    options?: { cause?: Error; metadata?: Record<string, unknown> }
  ) {
    super(message)
    this.name = 'ChatError'
    this.code = code
    this.cause = options?.cause
    this.metadata = options?.metadata
  }
}

// ============================================
// CONFIG TYPES
// ============================================

export interface ReconnectConfig {
  readonly enabled: boolean
  readonly maxAttempts: number
  readonly delayMs: number
  readonly backoffMultiplier: number
}

export interface ChatProviderConfig {
  readonly endpoint: string
  readonly headers?: Readonly<Record<string, string>>
  readonly reconnect?: ReconnectConfig
  readonly onConnect?: () => void
  readonly onDisconnect?: () => void
  readonly onError?: (error: ChatError) => void
  readonly onRunStart?: (runId: string) => void
  readonly onRunFinish?: (runId: string) => void
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test:unit tests/unit/types.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/core/types.ts tests/unit/types.test.ts
git commit -m "feat: add core TypeScript types"
```

---

### Task 008: Implement JSON Patch utility

**Files:**
- Create: `src/utils/jsonPatch.ts`
- Create: `tests/unit/jsonPatch.test.ts`

**Step 1: Write the failing test**

Create `tests/unit/jsonPatch.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { applyJsonPatch } from '../../src/utils/jsonPatch'
import { ChatError } from '../../src/core/types'

describe('applyJsonPatch', () => {
  describe('add operation', () => {
    it('adds value to object', () => {
      const state = { a: 1 }
      const patch = [{ op: 'add' as const, path: '/b', value: 2 }]
      const result = applyJsonPatch(state, patch)
      expect(result).toEqual({ a: 1, b: 2 })
    })

    it('adds item to array end with /-', () => {
      const state = { items: [1, 2] }
      const patch = [{ op: 'add' as const, path: '/items/-', value: 3 }]
      const result = applyJsonPatch(state, patch)
      expect(result.items).toEqual([1, 2, 3])
    })

    it('adds item at array index', () => {
      const state = { items: ['a', 'c'] }
      const patch = [{ op: 'add' as const, path: '/items/1', value: 'b' }]
      const result = applyJsonPatch(state, patch)
      expect(result.items).toEqual(['a', 'b', 'c'])
    })

    it('adds nested value', () => {
      const state = { nested: { a: 1 } }
      const patch = [{ op: 'add' as const, path: '/nested/b', value: 2 }]
      const result = applyJsonPatch(state, patch)
      expect(result.nested).toEqual({ a: 1, b: 2 })
    })
  })

  describe('remove operation', () => {
    it('removes value from object', () => {
      const state = { a: 1, b: 2 }
      const patch = [{ op: 'remove' as const, path: '/b' }]
      const result = applyJsonPatch(state, patch)
      expect(result).toEqual({ a: 1 })
    })

    it('removes item from array', () => {
      const state = { items: [1, 2, 3] }
      const patch = [{ op: 'remove' as const, path: '/items/1' }]
      const result = applyJsonPatch(state, patch)
      expect(result.items).toEqual([1, 3])
    })

    it('throws on invalid path', () => {
      const state = { a: 1 }
      const patch = [{ op: 'remove' as const, path: '/nonexistent' }]
      expect(() => applyJsonPatch(state, patch)).toThrow(ChatError)
    })
  })

  describe('replace operation', () => {
    it('replaces value', () => {
      const state = { a: 1 }
      const patch = [{ op: 'replace' as const, path: '/a', value: 2 }]
      const result = applyJsonPatch(state, patch)
      expect(result).toEqual({ a: 2 })
    })

    it('throws on invalid path', () => {
      const state = { a: 1 }
      const patch = [{ op: 'replace' as const, path: '/nonexistent', value: 2 }]
      expect(() => applyJsonPatch(state, patch)).toThrow(ChatError)
    })
  })

  describe('immutability', () => {
    it('does not mutate original state', () => {
      const state = { a: 1, nested: { b: 2 } }
      const original = JSON.parse(JSON.stringify(state))
      applyJsonPatch(state, [{ op: 'add', path: '/c', value: 3 }])
      expect(state).toEqual(original)
    })
  })

  describe('multiple operations', () => {
    it('applies operations in order', () => {
      const state = { count: 0 }
      const patch = [
        { op: 'replace' as const, path: '/count', value: 1 },
        { op: 'add' as const, path: '/name', value: 'test' },
      ]
      const result = applyJsonPatch(state, patch)
      expect(result).toEqual({ count: 1, name: 'test' })
    })
  })
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm test:unit tests/unit/jsonPatch.test.ts`
Expected: FAIL - Cannot find module

**Step 3: Write the implementation**

Create `src/utils/jsonPatch.ts`:

```typescript
import { ChatError, JsonPatch, JsonPatchOperation } from '../core/types'

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

function parsePath(path: string): string[] {
  if (path === '') return []
  if (!path.startsWith('/')) {
    throw new ChatError('STATE_PATCH_FAILED', `Invalid path: ${path}`)
  }
  return path.slice(1).split('/').map(segment =>
    segment.replace(/~1/g, '/').replace(/~0/g, '~')
  )
}

function getParentAndKey(
  obj: Record<string, unknown>,
  segments: string[]
): { parent: Record<string, unknown> | unknown[]; key: string | number } {
  let current: unknown = obj

  for (let i = 0; i < segments.length - 1; i++) {
    const segment = segments[i]
    if (Array.isArray(current)) {
      const index = parseInt(segment, 10)
      current = current[index]
    } else if (typeof current === 'object' && current !== null) {
      current = (current as Record<string, unknown>)[segment]
    } else {
      throw new ChatError('STATE_PATCH_FAILED', `Invalid path segment: ${segment}`)
    }
  }

  const lastSegment = segments[segments.length - 1]
  const key = Array.isArray(current) ?
    (lastSegment === '-' ? current.length : parseInt(lastSegment, 10)) :
    lastSegment

  return { parent: current as Record<string, unknown> | unknown[], key }
}

function applyOperation<T>(state: T, operation: JsonPatchOperation): T {
  const result = deepClone(state)
  const segments = parsePath(operation.path)

  if (segments.length === 0) {
    if (operation.op === 'replace') {
      return operation.value as T
    }
    throw new ChatError('STATE_PATCH_FAILED', 'Cannot add/remove root')
  }

  const { parent, key } = getParentAndKey(result as Record<string, unknown>, segments)

  switch (operation.op) {
    case 'add':
      if (Array.isArray(parent)) {
        parent.splice(key as number, 0, operation.value)
      } else {
        parent[key as string] = operation.value
      }
      break

    case 'remove':
      if (Array.isArray(parent)) {
        if (key >= parent.length) {
          throw new ChatError('STATE_PATCH_FAILED', `Index out of bounds: ${key}`)
        }
        parent.splice(key as number, 1)
      } else {
        if (!(key in parent)) {
          throw new ChatError('STATE_PATCH_FAILED', `Path not found: ${operation.path}`)
        }
        delete parent[key as string]
      }
      break

    case 'replace':
      if (Array.isArray(parent)) {
        if (key >= parent.length) {
          throw new ChatError('STATE_PATCH_FAILED', `Index out of bounds: ${key}`)
        }
        parent[key as number] = operation.value
      } else {
        if (!(key in parent)) {
          throw new ChatError('STATE_PATCH_FAILED', `Path not found: ${operation.path}`)
        }
        parent[key as string] = operation.value
      }
      break

    case 'move':
    case 'copy':
    case 'test':
      // Not implemented for MVP
      throw new ChatError('STATE_PATCH_FAILED', `Operation not supported: ${operation.op}`)
  }

  return result
}

export function applyJsonPatch<T>(state: T, patch: JsonPatch): T {
  let result = state
  for (const operation of patch) {
    result = applyOperation(result, operation)
  }
  return result
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test:unit tests/unit/jsonPatch.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/utils/jsonPatch.ts tests/unit/jsonPatch.test.ts
git commit -m "feat: implement JSON Patch utility (RFC 6902)"
```

---

### Task 009: Implement validation utility

**Files:**
- Create: `src/utils/validation.ts`
- Create: `tests/unit/validation.test.ts`

**Step 1: Write the failing test**

Create `tests/unit/validation.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { validateToolArgs } from '../../src/utils/validation'
import type { ToolParameterSchema } from '../../src/core/types'

describe('validateToolArgs', () => {
  const schema: ToolParameterSchema = {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Name' },
      count: { type: 'number', description: 'Count' },
      active: { type: 'boolean', description: 'Active' },
    },
    required: ['name'],
  }

  it('returns true for valid args', () => {
    expect(validateToolArgs({ name: 'test', count: 5 }, schema)).toBe(true)
  })

  it('returns true when optional fields missing', () => {
    expect(validateToolArgs({ name: 'test' }, schema)).toBe(true)
  })

  it('returns false for missing required field', () => {
    expect(validateToolArgs({ count: 5 }, schema)).toBe(false)
  })

  it('returns false for wrong type - string', () => {
    expect(validateToolArgs({ name: 123 }, schema)).toBe(false)
  })

  it('returns false for wrong type - number', () => {
    expect(validateToolArgs({ name: 'test', count: 'five' }, schema)).toBe(false)
  })

  it('returns false for wrong type - boolean', () => {
    expect(validateToolArgs({ name: 'test', active: 'yes' }, schema)).toBe(false)
  })

  it('returns true for empty schema', () => {
    const emptySchema: ToolParameterSchema = {
      type: 'object',
      properties: {},
    }
    expect(validateToolArgs({}, emptySchema)).toBe(true)
  })

  it('validates enum values', () => {
    const enumSchema: ToolParameterSchema = {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['active', 'inactive'] },
      },
      required: ['status'],
    }
    expect(validateToolArgs({ status: 'active' }, enumSchema)).toBe(true)
    expect(validateToolArgs({ status: 'unknown' }, enumSchema)).toBe(false)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm test:unit tests/unit/validation.test.ts`
Expected: FAIL - Cannot find module

**Step 3: Write the implementation**

Create `src/utils/validation.ts`:

```typescript
import type { ToolParameterSchema } from '../core/types'

type PropertyType = 'string' | 'number' | 'boolean' | 'object' | 'array'

function checkType(value: unknown, expectedType: PropertyType): boolean {
  switch (expectedType) {
    case 'string':
      return typeof value === 'string'
    case 'number':
      return typeof value === 'number' && !isNaN(value)
    case 'boolean':
      return typeof value === 'boolean'
    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value)
    case 'array':
      return Array.isArray(value)
    default:
      return false
  }
}

export function validateToolArgs(
  args: Record<string, unknown>,
  schema: ToolParameterSchema
): boolean {
  // Check required fields
  if (schema.required) {
    for (const field of schema.required) {
      if (!(field in args)) {
        return false
      }
    }
  }

  // Validate each provided field
  for (const [key, value] of Object.entries(args)) {
    const propSchema = schema.properties[key]

    // Unknown property - allow for flexibility
    if (!propSchema) {
      continue
    }

    // Type check
    if (!checkType(value, propSchema.type)) {
      return false
    }

    // Enum check
    if (propSchema.enum && !propSchema.enum.includes(value)) {
      return false
    }
  }

  return true
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test:unit tests/unit/validation.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/utils/validation.ts tests/unit/validation.test.ts
git commit -m "feat: implement tool args validation utility"
```

---

### Task 010: Implement reconnection backoff utility

**Files:**
- Create: `src/utils/backoff.ts`
- Create: `tests/unit/backoff.test.ts`

**Step 1: Write the failing test**

Create `tests/unit/backoff.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { calculateBackoff } from '../../src/utils/backoff'

describe('calculateBackoff', () => {
  it('returns base delay for first attempt', () => {
    expect(calculateBackoff({
      attempt: 1,
      baseDelay: 1000,
      multiplier: 2,
    })).toBe(1000)
  })

  it('doubles delay on each attempt', () => {
    const config = { baseDelay: 1000, multiplier: 2 }
    expect(calculateBackoff({ ...config, attempt: 2 })).toBe(2000)
    expect(calculateBackoff({ ...config, attempt: 3 })).toBe(4000)
    expect(calculateBackoff({ ...config, attempt: 4 })).toBe(8000)
  })

  it('caps at maxDelay', () => {
    expect(calculateBackoff({
      attempt: 10,
      baseDelay: 1000,
      multiplier: 2,
      maxDelay: 5000,
    })).toBe(5000)
  })

  it('uses default maxDelay of 30000', () => {
    expect(calculateBackoff({
      attempt: 100,
      baseDelay: 1000,
      multiplier: 2,
    })).toBe(30000)
  })

  it('handles zero attempt', () => {
    expect(calculateBackoff({
      attempt: 0,
      baseDelay: 1000,
      multiplier: 2,
    })).toBe(1000)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm test:unit tests/unit/backoff.test.ts`
Expected: FAIL - Cannot find module

**Step 3: Write the implementation**

Create `src/utils/backoff.ts`:

```typescript
export interface BackoffConfig {
  attempt: number
  baseDelay: number
  multiplier: number
  maxDelay?: number
}

const DEFAULT_MAX_DELAY = 30000

export function calculateBackoff(config: BackoffConfig): number {
  const { attempt, baseDelay, multiplier, maxDelay = DEFAULT_MAX_DELAY } = config

  // For attempt 0 or 1, return base delay
  const effectiveAttempt = Math.max(0, attempt - 1)
  const delay = baseDelay * Math.pow(multiplier, effectiveAttempt)

  return Math.min(delay, maxDelay)
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test:unit tests/unit/backoff.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/utils/backoff.ts tests/unit/backoff.test.ts
git commit -m "feat: implement reconnection backoff utility"
```

---

## Phase 2: Core Agent Client

### Task 011: Create event handlers

**Files:**
- Create: `src/core/eventHandlers.ts`
- Create: `tests/unit/eventHandlers.test.ts`

**Step 1: Write the failing test**

Create `tests/unit/eventHandlers.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import {
  createMessageFromEvent,
  appendContentToMessage,
  createToolCallFromEvent,
  appendArgsToToolCall,
} from '../../src/core/eventHandlers'
import type { Message, ToolCall } from '../../src/core/types'

describe('eventHandlers', () => {
  describe('createMessageFromEvent', () => {
    it('creates message with streaming status', () => {
      const message = createMessageFromEvent('m1', 'assistant')
      expect(message.id).toBe('m1')
      expect(message.role).toBe('assistant')
      expect(message.status).toBe('streaming')
      expect(message.content).toBe('')
      expect(message.toolCalls).toEqual([])
    })
  })

  describe('appendContentToMessage', () => {
    it('appends delta to content', () => {
      const message: Message = {
        id: 'm1',
        role: 'assistant',
        content: 'Hello ',
        status: 'streaming',
        toolCalls: [],
        timestamp: new Date(),
      }
      const updated = appendContentToMessage(message, 'world')
      expect(updated.content).toBe('Hello world')
      expect(updated.status).toBe('streaming')
    })

    it('does not mutate original', () => {
      const message: Message = {
        id: 'm1',
        role: 'assistant',
        content: 'Hello',
        status: 'streaming',
        toolCalls: [],
        timestamp: new Date(),
      }
      appendContentToMessage(message, ' world')
      expect(message.content).toBe('Hello')
    })
  })

  describe('createToolCallFromEvent', () => {
    it('creates tool call with pending status', () => {
      const toolCall = createToolCallFromEvent('t1', 'filterEvents')
      expect(toolCall.id).toBe('t1')
      expect(toolCall.name).toBe('filterEvents')
      expect(toolCall.status).toBe('pending')
      expect(toolCall.args).toEqual({})
    })
  })

  describe('appendArgsToToolCall', () => {
    it('accumulates JSON argument chunks', () => {
      let toolCall = createToolCallFromEvent('t1', 'test')
      toolCall = appendArgsToToolCall(toolCall, '{"name":')
      toolCall = appendArgsToToolCall(toolCall, '"test"}')
      expect(toolCall.args).toEqual({})  // Not parsed yet
    })
  })
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm test:unit tests/unit/eventHandlers.test.ts`
Expected: FAIL - Cannot find module

**Step 3: Write the implementation**

Create `src/core/eventHandlers.ts`:

```typescript
import type { Message, MessageRole, ToolCall } from './types'

export function createMessageFromEvent(
  messageId: string,
  role: MessageRole
): Message {
  return {
    id: messageId,
    role,
    content: '',
    status: 'streaming',
    toolCalls: [],
    timestamp: new Date(),
  }
}

export function appendContentToMessage(
  message: Message,
  delta: string
): Message {
  return {
    ...message,
    content: message.content + delta,
  }
}

export function completeMessage(message: Message): Message {
  return {
    ...message,
    status: 'complete',
  }
}

export function errorMessage(message: Message, error: Error): Message {
  return {
    ...message,
    status: 'error',
    metadata: { ...message.metadata, error: error.message },
  }
}

export function createToolCallFromEvent(
  toolCallId: string,
  toolCallName: string
): ToolCall {
  return {
    id: toolCallId,
    name: toolCallName,
    args: {},
    status: 'pending',
  }
}

// Internal: tracks accumulated JSON string
const toolCallArgsBuffer = new Map<string, string>()

export function appendArgsToToolCall(
  toolCall: ToolCall,
  delta: string
): ToolCall {
  const buffer = (toolCallArgsBuffer.get(toolCall.id) || '') + delta
  toolCallArgsBuffer.set(toolCall.id, buffer)
  return { ...toolCall }
}

export function finalizeToolCallArgs(toolCall: ToolCall): ToolCall {
  const buffer = toolCallArgsBuffer.get(toolCall.id) || '{}'
  toolCallArgsBuffer.delete(toolCall.id)

  try {
    const args = JSON.parse(buffer)
    return {
      ...toolCall,
      args,
      status: 'running',
    }
  } catch {
    return {
      ...toolCall,
      args: {},
      status: 'error',
      error: new Error('Failed to parse tool arguments'),
    }
  }
}

export function completeToolCall(
  toolCall: ToolCall,
  result: unknown
): ToolCall {
  return {
    ...toolCall,
    status: 'complete',
    result,
  }
}

export function errorToolCall(
  toolCall: ToolCall,
  error: Error
): ToolCall {
  return {
    ...toolCall,
    status: 'error',
    error,
  }
}

export function addToolCallToMessage(
  message: Message,
  toolCall: ToolCall
): Message {
  return {
    ...message,
    toolCalls: [...message.toolCalls, toolCall],
  }
}

export function updateToolCallInMessage(
  message: Message,
  updatedToolCall: ToolCall
): Message {
  return {
    ...message,
    toolCalls: message.toolCalls.map(tc =>
      tc.id === updatedToolCall.id ? updatedToolCall : tc
    ),
  }
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test:unit tests/unit/eventHandlers.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/core/eventHandlers.ts tests/unit/eventHandlers.test.ts
git commit -m "feat: implement AG-UI event handlers"
```

---

### Task 012: Create AgentClient wrapper

**Files:**
- Create: `src/core/AgentClient.ts`

**Step 1: Write the implementation**

Create `src/core/AgentClient.ts`:

```typescript
import type {
  Message,
  ToolCall,
  ToolDefinition,
  ChatProviderConfig,
  ConnectionStatus,
  ChatError,
  JsonPatch,
} from './types'
import {
  createMessageFromEvent,
  appendContentToMessage,
  completeMessage,
  createToolCallFromEvent,
  appendArgsToToolCall,
  finalizeToolCallArgs,
  completeToolCall,
  errorToolCall,
  addToolCallToMessage,
  updateToolCallInMessage,
} from './eventHandlers'
import { calculateBackoff } from '../utils/backoff'
import { ChatError as ChatErrorClass } from './types'

export interface AgentClientCallbacks {
  onStatusChange: (status: ConnectionStatus) => void
  onError: (error: ChatError) => void
  onMessage: (message: Message) => void
  onMessageUpdate: (message: Message) => void
  onToolCall: (toolCall: ToolCall, messageId: string) => void
  onToolCallUpdate: (toolCall: ToolCall, messageId: string) => void
  onStateDelta: (patch: JsonPatch) => void
  onRunStart: (runId: string) => void
  onRunFinish: (runId: string) => void
}

export class AgentClient {
  private config: ChatProviderConfig
  private callbacks: AgentClientCallbacks
  private eventSource: EventSource | null = null
  private abortController: AbortController | null = null
  private reconnectAttempts = 0
  private currentMessage: Message | null = null
  private currentToolCalls: Map<string, ToolCall> = new Map()
  private tools: ToolDefinition[] = []
  private context: Record<string, unknown> = {}

  constructor(config: ChatProviderConfig, callbacks: AgentClientCallbacks) {
    this.config = config
    this.callbacks = callbacks
  }

  setTools(tools: ToolDefinition[]): void {
    this.tools = tools
  }

  setContext(context: Record<string, unknown>): void {
    this.context = context
  }

  async connect(): Promise<void> {
    this.callbacks.onStatusChange('connecting')

    try {
      // Send init payload
      await this.sendInit()

      // Open SSE connection
      this.openEventSource()

      this.reconnectAttempts = 0
      this.callbacks.onStatusChange('connected')
    } catch (error) {
      this.handleConnectionError(error as Error)
    }
  }

  disconnect(): void {
    this.eventSource?.close()
    this.eventSource = null
    this.abortController?.abort()
    this.abortController = null
    this.callbacks.onStatusChange('disconnected')
  }

  async send(content: string): Promise<void> {
    this.abortController = new AbortController()

    const payload = {
      type: 'message',
      content,
      context: this.context,
    }

    try {
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.config.headers,
        },
        body: JSON.stringify(payload),
        signal: this.abortController.signal,
      })

      if (!response.ok) {
        throw new ChatErrorClass(
          'MESSAGE_SEND_FAILED',
          `Failed to send message: ${response.statusText}`
        )
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return
      }
      this.callbacks.onError(error as ChatError)
    }
  }

  stop(): void {
    this.abortController?.abort()
    this.abortController = null
  }

  async executeToolCall(
    toolCall: ToolCall,
    messageId: string
  ): Promise<void> {
    const tool = this.tools.find(t => t.name === toolCall.name)

    if (!tool) {
      const error = new ChatErrorClass('TOOL_NOT_FOUND', `Tool not found: ${toolCall.name}`)
      const erroredToolCall = errorToolCall(toolCall, error)
      this.callbacks.onToolCallUpdate(erroredToolCall, messageId)
      return
    }

    const abortController = new AbortController()
    const context = {
      toolCallId: toolCall.id,
      abortSignal: abortController.signal,
    }

    try {
      const result = await tool.execute(toolCall.args, context)
      const completedToolCall = completeToolCall(toolCall, result)
      this.callbacks.onToolCallUpdate(completedToolCall, messageId)

      // Send result back to backend
      await this.sendToolResult(toolCall.id, result)
    } catch (error) {
      const erroredToolCall = errorToolCall(toolCall, error as Error)
      this.callbacks.onToolCallUpdate(erroredToolCall, messageId)
    }
  }

  private async sendInit(): Promise<void> {
    const payload = {
      type: 'init',
      tools: this.tools.map(t => ({
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      })),
      context: this.context,
    }

    const response = await fetch(this.config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.config.headers,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new ChatErrorClass(
        'CONNECTION_FAILED',
        `Failed to initialize: ${response.statusText}`
      )
    }
  }

  private async sendToolResult(toolCallId: string, result: unknown): Promise<void> {
    const endpoint = this.config.endpoint.replace(/\/?$/, '/tool-result')

    await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.config.headers,
      },
      body: JSON.stringify({ toolCallId, result }),
    })
  }

  private openEventSource(): void {
    const sseEndpoint = this.config.endpoint.replace(/\/?$/, '/sse')
    this.eventSource = new EventSource(sseEndpoint)

    this.eventSource.onopen = () => {
      this.callbacks.onStatusChange('connected')
    }

    this.eventSource.onerror = () => {
      this.handleConnectionError(new Error('SSE connection error'))
    }

    // Register event handlers
    this.registerEventHandlers()
  }

  private registerEventHandlers(): void {
    if (!this.eventSource) return

    this.eventSource.addEventListener('RunStarted', (e) => {
      const data = JSON.parse(e.data)
      this.callbacks.onRunStart(data.runId)
    })

    this.eventSource.addEventListener('RunFinished', (e) => {
      const data = JSON.parse(e.data)
      if (this.currentMessage) {
        const completed = completeMessage(this.currentMessage)
        this.callbacks.onMessageUpdate(completed)
        this.currentMessage = null
      }
      this.callbacks.onRunFinish(data.runId)
    })

    this.eventSource.addEventListener('RunError', (e) => {
      const data = JSON.parse(e.data)
      const error = new ChatErrorClass('CONNECTION_LOST', data.message)
      this.callbacks.onError(error)
    })

    this.eventSource.addEventListener('TextMessageStart', (e) => {
      const data = JSON.parse(e.data)
      this.currentMessage = createMessageFromEvent(data.messageId, data.role)
      this.callbacks.onMessage(this.currentMessage)
    })

    this.eventSource.addEventListener('TextMessageContent', (e) => {
      const data = JSON.parse(e.data)
      if (this.currentMessage && this.currentMessage.id === data.messageId) {
        this.currentMessage = appendContentToMessage(this.currentMessage, data.delta)
        this.callbacks.onMessageUpdate(this.currentMessage)
      }
    })

    this.eventSource.addEventListener('TextMessageEnd', (e) => {
      const data = JSON.parse(e.data)
      if (this.currentMessage && this.currentMessage.id === data.messageId) {
        this.currentMessage = completeMessage(this.currentMessage)
        this.callbacks.onMessageUpdate(this.currentMessage)
      }
    })

    this.eventSource.addEventListener('ToolCallStart', (e) => {
      const data = JSON.parse(e.data)
      const toolCall = createToolCallFromEvent(data.toolCallId, data.toolCallName)
      this.currentToolCalls.set(toolCall.id, toolCall)

      if (this.currentMessage) {
        this.currentMessage = addToolCallToMessage(this.currentMessage, toolCall)
        this.callbacks.onToolCall(toolCall, this.currentMessage.id)
      }
    })

    this.eventSource.addEventListener('ToolCallArgs', (e) => {
      const data = JSON.parse(e.data)
      const toolCall = this.currentToolCalls.get(data.toolCallId)
      if (toolCall) {
        const updated = appendArgsToToolCall(toolCall, data.delta)
        this.currentToolCalls.set(updated.id, updated)
      }
    })

    this.eventSource.addEventListener('ToolCallEnd', (e) => {
      const data = JSON.parse(e.data)
      const toolCall = this.currentToolCalls.get(data.toolCallId)
      if (toolCall && this.currentMessage) {
        const finalized = finalizeToolCallArgs(toolCall)
        this.currentToolCalls.set(finalized.id, finalized)
        this.currentMessage = updateToolCallInMessage(this.currentMessage, finalized)
        this.callbacks.onToolCallUpdate(finalized, this.currentMessage.id)

        // Execute the tool
        this.executeToolCall(finalized, this.currentMessage.id)
      }
    })

    this.eventSource.addEventListener('StateDelta', (e) => {
      const data = JSON.parse(e.data)
      this.callbacks.onStateDelta(data.delta)
    })
  }

  private handleConnectionError(error: Error): void {
    this.callbacks.onStatusChange('error')
    this.callbacks.onError(error as ChatError)

    // Attempt reconnection
    if (this.config.reconnect?.enabled) {
      this.attemptReconnect()
    }
  }

  private attemptReconnect(): void {
    const maxAttempts = this.config.reconnect?.maxAttempts ?? 3

    if (this.reconnectAttempts >= maxAttempts) {
      return
    }

    this.reconnectAttempts++

    const delay = calculateBackoff({
      attempt: this.reconnectAttempts,
      baseDelay: this.config.reconnect?.delayMs ?? 1000,
      multiplier: this.config.reconnect?.backoffMultiplier ?? 2,
    })

    setTimeout(() => {
      this.connect()
    }, delay)
  }
}
```

**Step 2: Commit**

```bash
git add src/core/AgentClient.ts
git commit -m "feat: implement AgentClient wrapper for @ag-ui/client"
```

---

## Phase 3: React Hooks

### Task 013: Create ChatContext and ChatProvider

**Files:**
- Create: `src/components/ChatContext.tsx`
- Create: `src/components/ChatProvider.tsx`

**Step 1: Create ChatContext**

Create `src/components/ChatContext.tsx`:

```typescript
import { createContext, useContext } from 'react'
import type {
  Message,
  ToolCall,
  ToolDefinition,
  ConnectionStatus,
  ChatError,
  JsonPatch,
} from '../core/types'

export interface ChatContextValue {
  // Connection
  status: ConnectionStatus
  error: ChatError | null
  connect: () => void
  disconnect: () => void

  // Messages
  messages: Message[]
  isStreaming: boolean
  send: (content: string) => void
  stop: () => void
  reset: () => void

  // Tools
  registerTool: (tool: ToolDefinition) => void
  unregisterTool: (name: string) => void
  tools: ToolCall[]

  // Context
  setContext: (key: string, value: unknown, description: string) => void
  removeContext: (key: string) => void

  // State
  agentState: Record<string, unknown>
  stateDeltaSubscribers: Set<(patch: JsonPatch) => void>
}

export const ChatContext = createContext<ChatContextValue | null>(null)

export function useChatContext(): ChatContextValue {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider')
  }
  return context
}
```

**Step 2: Create ChatProvider**

Create `src/components/ChatProvider.tsx`:

```typescript
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChatContext, ChatContextValue } from './ChatContext'
import { AgentClient } from '../core/AgentClient'
import { applyJsonPatch } from '../utils/jsonPatch'
import type {
  Message,
  ToolCall,
  ToolDefinition,
  ConnectionStatus,
  ChatError,
  ChatProviderConfig,
  JsonPatch,
  ReadableContextEntry,
} from '../core/types'

interface ChatProviderProps extends ChatProviderConfig {
  children: React.ReactNode
}

export function ChatProvider({ children, ...config }: ChatProviderProps) {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const [error, setError] = useState<ChatError | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [tools, setTools] = useState<ToolCall[]>([])
  const [agentState, setAgentState] = useState<Record<string, unknown>>({})

  const toolRegistry = useRef<Map<string, ToolDefinition>>(new Map())
  const contextRegistry = useRef<Map<string, ReadableContextEntry>>(new Map())
  const stateDeltaSubscribers = useRef<Set<(patch: JsonPatch) => void>>(new Set())
  const clientRef = useRef<AgentClient | null>(null)

  // Initialize client
  useEffect(() => {
    const client = new AgentClient(config, {
      onStatusChange: setStatus,
      onError: (err) => {
        setError(err)
        config.onError?.(err)
      },
      onMessage: (message) => {
        setMessages(prev => [...prev, message])
        setIsStreaming(true)
      },
      onMessageUpdate: (message) => {
        setMessages(prev =>
          prev.map(m => m.id === message.id ? message : m)
        )
        if (message.status === 'complete' || message.status === 'error') {
          setIsStreaming(false)
        }
      },
      onToolCall: (toolCall) => {
        setTools(prev => [...prev, toolCall])
      },
      onToolCallUpdate: (toolCall) => {
        setTools(prev =>
          prev.map(t => t.id === toolCall.id ? toolCall : t)
        )
      },
      onStateDelta: (patch) => {
        setAgentState(prev => applyJsonPatch(prev, patch))
        stateDeltaSubscribers.current.forEach(sub => sub(patch))
      },
      onRunStart: (runId) => {
        setIsStreaming(true)
        config.onRunStart?.(runId)
      },
      onRunFinish: (runId) => {
        setIsStreaming(false)
        config.onRunFinish?.(runId)
      },
    })

    clientRef.current = client

    return () => {
      client.disconnect()
    }
  }, [config.endpoint])

  // Sync tools with client
  useEffect(() => {
    if (clientRef.current) {
      clientRef.current.setTools(Array.from(toolRegistry.current.values()))
    }
  }, [toolRegistry.current.size])

  // Sync context with client
  useEffect(() => {
    if (clientRef.current) {
      const context: Record<string, unknown> = {}
      contextRegistry.current.forEach((entry) => {
        context[entry.key] = entry.value
      })
      clientRef.current.setContext(context)
    }
  }, [contextRegistry.current.size])

  const connect = useCallback(() => {
    clientRef.current?.connect()
  }, [])

  const disconnect = useCallback(() => {
    clientRef.current?.disconnect()
  }, [])

  const send = useCallback((content: string) => {
    // Add user message immediately
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      status: 'complete',
      toolCalls: [],
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMessage])

    // Send to backend
    clientRef.current?.send(content)
  }, [])

  const stop = useCallback(() => {
    clientRef.current?.stop()
    setIsStreaming(false)
  }, [])

  const reset = useCallback(() => {
    setMessages([])
    setTools([])
    setError(null)
    setIsStreaming(false)
  }, [])

  const registerTool = useCallback((tool: ToolDefinition) => {
    toolRegistry.current.set(tool.name, tool)
    if (clientRef.current) {
      clientRef.current.setTools(Array.from(toolRegistry.current.values()))
    }
  }, [])

  const unregisterTool = useCallback((name: string) => {
    toolRegistry.current.delete(name)
    if (clientRef.current) {
      clientRef.current.setTools(Array.from(toolRegistry.current.values()))
    }
  }, [])

  const setContext = useCallback((key: string, value: unknown, description: string) => {
    contextRegistry.current.set(key, { key, value, description })
    if (clientRef.current) {
      const context: Record<string, unknown> = {}
      contextRegistry.current.forEach((entry) => {
        context[entry.key] = entry.value
      })
      clientRef.current.setContext(context)
    }
  }, [])

  const removeContext = useCallback((key: string) => {
    contextRegistry.current.delete(key)
    if (clientRef.current) {
      const context: Record<string, unknown> = {}
      contextRegistry.current.forEach((entry) => {
        context[entry.key] = entry.value
      })
      clientRef.current.setContext(context)
    }
  }, [])

  const value: ChatContextValue = useMemo(() => ({
    status,
    error,
    connect,
    disconnect,
    messages,
    isStreaming,
    send,
    stop,
    reset,
    registerTool,
    unregisterTool,
    tools,
    setContext,
    removeContext,
    agentState,
    stateDeltaSubscribers: stateDeltaSubscribers.current,
  }), [
    status,
    error,
    connect,
    disconnect,
    messages,
    isStreaming,
    send,
    stop,
    reset,
    registerTool,
    unregisterTool,
    tools,
    setContext,
    removeContext,
    agentState,
  ])

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  )
}
```

**Step 3: Commit**

```bash
git add src/components/ChatContext.tsx src/components/ChatProvider.tsx
git commit -m "feat: implement ChatProvider and ChatContext"
```

---

### Task 014: Implement useChatAgent hook

**Files:**
- Create: `src/hooks/useChatAgent.ts`
- Create: `tests/hooks/useChatAgent.test.tsx`

**Step 1: Create hook**

Create `src/hooks/useChatAgent.ts`:

```typescript
import { useChatContext } from '../components/ChatContext'

export interface UseChatAgentOptions {
  manual?: boolean
}

export function useChatAgent(options: UseChatAgentOptions = {}) {
  const context = useChatContext()

  return {
    status: context.status,
    error: context.error,
    messages: context.messages,
    isStreaming: context.isStreaming,
    send: context.send,
    stop: context.stop,
    reset: context.reset,
  }
}
```

**Step 2: Commit**

```bash
git add src/hooks/useChatAgent.ts
git commit -m "feat: implement useChatAgent hook"
```

---

### Task 015: Implement useRegisterTool hook

**Files:**
- Create: `src/hooks/useRegisterTool.ts`

**Step 1: Create hook**

Create `src/hooks/useRegisterTool.ts`:

```typescript
import { useEffect, useRef } from 'react'
import { useChatContext } from '../components/ChatContext'
import type { ToolDefinition, ToolParameterSchema, ToolExecutor, ToolExecutionContext } from '../core/types'

export interface UseRegisterToolOptions<TArgs, TResult> {
  name: string
  description: string
  parameters: ToolParameterSchema
  execute: ToolExecutor<TArgs, TResult>
  deps?: unknown[]
}

export function useRegisterTool<
  TArgs = Record<string, unknown>,
  TResult = unknown
>(options: UseRegisterToolOptions<TArgs, TResult>): void {
  const { registerTool, unregisterTool } = useChatContext()
  const optionsRef = useRef(options)
  optionsRef.current = options

  useEffect(() => {
    const tool: ToolDefinition<TArgs, TResult> = {
      name: optionsRef.current.name,
      description: optionsRef.current.description,
      parameters: optionsRef.current.parameters,
      execute: (args: TArgs, context: ToolExecutionContext) =>
        optionsRef.current.execute(args, context),
    }

    registerTool(tool as ToolDefinition)

    return () => {
      unregisterTool(optionsRef.current.name)
    }
  }, [options.name, registerTool, unregisterTool, ...(options.deps || [])])
}
```

**Step 2: Commit**

```bash
git add src/hooks/useRegisterTool.ts
git commit -m "feat: implement useRegisterTool hook"
```

---

### Task 016: Implement useReadableContext hook

**Files:**
- Create: `src/hooks/useReadableContext.ts`

**Step 1: Create hook**

Create `src/hooks/useReadableContext.ts`:

```typescript
import { useEffect, useRef } from 'react'
import { useChatContext } from '../components/ChatContext'

export interface UseReadableContextOptions {
  description: string
  lazy?: boolean
}

export function useReadableContext<T>(
  key: string,
  value: T,
  options: UseReadableContextOptions
): void {
  const { setContext, removeContext } = useChatContext()
  const valueRef = useRef(value)
  valueRef.current = value

  useEffect(() => {
    if (!options.lazy) {
      setContext(key, valueRef.current, options.description)
    }

    return () => {
      removeContext(key)
    }
  }, [key, options.description, options.lazy, setContext, removeContext])

  // Update context when value changes (unless lazy)
  useEffect(() => {
    if (!options.lazy) {
      setContext(key, value, options.description)
    }
  }, [key, value, options.description, options.lazy, setContext])
}
```

**Step 2: Commit**

```bash
git add src/hooks/useReadableContext.ts
git commit -m "feat: implement useReadableContext hook"
```

---

### Task 017: Implement useAgentState hook

**Files:**
- Create: `src/hooks/useAgentState.ts`

**Step 1: Create hook**

Create `src/hooks/useAgentState.ts`:

```typescript
import { useEffect, useState } from 'react'
import { useChatContext } from '../components/ChatContext'
import { applyJsonPatch } from '../utils/jsonPatch'
import type { JsonPatch } from '../core/types'

export interface UseAgentStateOptions<T> {
  initialState: T
  validate?: (patch: JsonPatch, currentState: T) => boolean
  onDelta?: (patch: JsonPatch, newState: T) => void
}

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
```

**Step 2: Commit**

```bash
git add src/hooks/useAgentState.ts
git commit -m "feat: implement useAgentState hook"
```

---

## Phase 4: Headless Components

### Task 018: Implement MessageList component

**Files:**
- Create: `src/components/headless/MessageList.tsx`

**Step 1: Create component**

Create `src/components/headless/MessageList.tsx`:

```typescript
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
```

**Step 2: Commit**

```bash
git add src/components/headless/MessageList.tsx
git commit -m "feat: implement MessageList headless component"
```

---

### Task 019: Implement ChatInput component

**Files:**
- Create: `src/components/headless/ChatInput.tsx`

**Step 1: Create component**

Create `src/components/headless/ChatInput.tsx`:

```typescript
import React, { useState, useCallback } from 'react'
import { useChatContext } from '../ChatContext'

export interface ChatInputRenderProps {
  value: string
  onChange: (value: string) => void
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

  return children({
    value,
    onChange: handleChange,
    onSubmit: handleSubmit,
    isDisabled,
    placeholder,
  })
}
```

**Step 2: Commit**

```bash
git add src/components/headless/ChatInput.tsx
git commit -m "feat: implement ChatInput headless component"
```

---

### Task 020: Implement ToolCallList component

**Files:**
- Create: `src/components/headless/ToolCallList.tsx`

**Step 1: Create component**

Create `src/components/headless/ToolCallList.tsx`:

```typescript
import React from 'react'
import { useChatContext } from '../ChatContext'
import type { ToolCall } from '../../core/types'

export interface ToolCallListRenderProps {
  tools: ToolCall[]
}

export interface ToolCallListProps {
  children: (props: ToolCallListRenderProps) => React.ReactNode
}

export function ToolCallList({ children }: ToolCallListProps) {
  const { tools } = useChatContext()

  return <>{children({ tools })}</>
}
```

**Step 2: Commit**

```bash
git add src/components/headless/ToolCallList.tsx
git commit -m "feat: implement ToolCallList headless component"
```

---

### Task 021: Implement ConnectionStatus component

**Files:**
- Create: `src/components/headless/ConnectionStatus.tsx`

**Step 1: Create component**

Create `src/components/headless/ConnectionStatus.tsx`:

```typescript
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

export function ConnectionStatus({ children }: ConnectionStatusProps) {
  const { status, error, connect } = useChatContext()

  return <>{children({ status, error, reconnect: connect })}</>
}
```

**Step 2: Commit**

```bash
git add src/components/headless/ConnectionStatus.tsx
git commit -m "feat: implement ConnectionStatus headless component"
```

---

## Phase 5: Public API and Exports

### Task 022: Create public exports

**Files:**
- Modify: `src/index.ts`

**Step 1: Update exports**

Update `src/index.ts`:

```typescript
// chat-ag-ui - Headless React library for AG-UI protocol
export const VERSION = '0.1.0'

// Provider
export { ChatProvider } from './components/ChatProvider'

// Hooks
export { useChatAgent } from './hooks/useChatAgent'
export { useRegisterTool } from './hooks/useRegisterTool'
export { useReadableContext } from './hooks/useReadableContext'
export { useAgentState } from './hooks/useAgentState'

// Headless Components
export { MessageList } from './components/headless/MessageList'
export { ChatInput } from './components/headless/ChatInput'
export { ToolCallList } from './components/headless/ToolCallList'
export { ConnectionStatus } from './components/headless/ConnectionStatus'

// Types
export type {
  Message,
  MessageRole,
  MessageStatus,
  ToolCall,
  ToolStatus,
  ToolDefinition,
  ToolParameterSchema,
  ToolExecutor,
  ToolExecutionContext,
  ConnectionStatus as ConnectionStatusType,
  ConnectionState,
  ReadableContextEntry,
  JsonPatch,
  JsonPatchOperation,
  ChatErrorCode,
  ChatProviderConfig,
  ReconnectConfig,
} from './core/types'

export { ChatError } from './core/types'

// Utilities (for advanced use)
export { applyJsonPatch } from './utils/jsonPatch'
export { validateToolArgs } from './utils/validation'
export { calculateBackoff } from './utils/backoff'

// Hook option types
export type { UseChatAgentOptions } from './hooks/useChatAgent'
export type { UseRegisterToolOptions } from './hooks/useRegisterTool'
export type { UseReadableContextOptions } from './hooks/useReadableContext'
export type { UseAgentStateOptions } from './hooks/useAgentState'

// Component prop types
export type { MessageListProps, MessageListRenderProps } from './components/headless/MessageList'
export type { ChatInputProps, ChatInputRenderProps } from './components/headless/ChatInput'
export type { ToolCallListProps, ToolCallListRenderProps } from './components/headless/ToolCallList'
export type { ConnectionStatusProps, ConnectionStatusRenderProps } from './components/headless/ConnectionStatus'
```

**Step 2: Run build**

Run: `pnpm build`
Expected: Build succeeds with dist/ output

**Step 3: Commit**

```bash
git add src/index.ts
git commit -m "feat: create public API exports"
```

---

## Phase 6: Demo App

### Task 023: Create demo app structure

**Files:**
- Create: `demo/index.html`
- Create: `demo/main.tsx`
- Create: `demo/vite.config.ts`
- Create: `demo/package.json`

**Step 1: Create demo/package.json**

```json
{
  "name": "demo",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --port 5174",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "msw": "^2.6.0",
    "typescript": "^5.6.0",
    "vite": "^5.4.0"
  }
}
```

**Step 2: Create demo/vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'chat-ag-ui': resolve(__dirname, '../src/index.ts'),
    },
  },
  server: {
    port: 5174,
  },
})
```

**Step 3: Create demo/index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>chat-ag-ui Demo</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/main.tsx"></script>
  </body>
</html>
```

**Step 4: Create demo/main.tsx**

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { worker } from './MockAgentServer'

// Start MSW in development
worker.start({ onUnhandledRequest: 'bypass' }).then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
})
```

**Step 5: Commit**

```bash
git add demo/
git commit -m "feat: create demo app structure"
```

---

### Task 024: Create MockAgentServer

**Files:**
- Create: `demo/MockAgentServer.ts`

**Step 1: Create mock server**

Create `demo/MockAgentServer.ts`:

```typescript
import { http, HttpResponse } from 'msw'
import { setupWorker } from 'msw/browser'

let messageCount = 0

const handlers = [
  // Init endpoint
  http.post('/api/agent', async ({ request }) => {
    const body = await request.json() as { type: string }

    if (body.type === 'init') {
      return HttpResponse.json({ ok: true })
    }

    // Message endpoint
    messageCount++
    return HttpResponse.json({ ok: true, messageId: `m${messageCount}` })
  }),

  // SSE endpoint
  http.get('/api/agent/sse', () => {
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        const events = [
          'event: RunStarted\ndata: {"runId":"run-1"}\n\n',
          'event: TextMessageStart\ndata: {"messageId":"m1","role":"assistant"}\n\n',
          'event: TextMessageContent\ndata: {"messageId":"m1","delta":"Hello! "}\n\n',
          'event: TextMessageContent\ndata: {"messageId":"m1","delta":"I am an AG-UI "}\n\n',
          'event: TextMessageContent\ndata: {"messageId":"m1","delta":"assistant. "}\n\n',
          'event: TextMessageContent\ndata: {"messageId":"m1","delta":"How can I help you today?"}\n\n',
          'event: TextMessageEnd\ndata: {"messageId":"m1"}\n\n',
          'event: RunFinished\ndata: {"runId":"run-1"}\n\n',
        ]

        let i = 0
        const interval = setInterval(() => {
          if (i < events.length) {
            controller.enqueue(encoder.encode(events[i]))
            i++
          } else {
            clearInterval(interval)
          }
        }, 100)
      },
    })

    return new HttpResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  }),

  // Tool result endpoint
  http.post('/api/agent/tool-result', () => {
    return HttpResponse.json({ ok: true })
  }),
]

export const worker = setupWorker(...handlers)
```

**Step 2: Commit**

```bash
git add demo/MockAgentServer.ts
git commit -m "feat: create MSW mock agent server"
```

---

### Task 025: Create demo App component

**Files:**
- Create: `demo/App.tsx`
- Create: `demo/styles.css`

**Step 1: Create demo/styles.css**

```css
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #1a1a2e;
  color: #eee;
}

.chat-demo {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.status {
  padding: 8px 12px;
  border-radius: 4px;
  margin-bottom: 12px;
  font-size: 14px;
}

.status--connected {
  background: #1e4620;
}

.status--connecting {
  background: #5c4813;
}

.status--error {
  background: #5c1313;
}

.status--disconnected {
  background: #333;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  background: #16213e;
  border-radius: 8px;
  margin-bottom: 12px;
}

.message {
  padding: 10px 14px;
  margin-bottom: 8px;
  border-radius: 8px;
  max-width: 80%;
}

.message--user {
  background: #0f3460;
  margin-left: auto;
}

.message--assistant {
  background: #1a1a2e;
  border: 1px solid #333;
}

.message__tool {
  font-size: 12px;
  color: #888;
  margin-top: 6px;
  padding: 4px 8px;
  background: rgba(0,0,0,0.2);
  border-radius: 4px;
}

.typing-indicator {
  color: #666;
  font-style: italic;
  padding: 8px;
}

.input-form {
  display: flex;
  gap: 8px;
}

.input-form input {
  flex: 1;
  padding: 12px;
  border: 1px solid #333;
  border-radius: 8px;
  background: #16213e;
  color: #eee;
  font-size: 14px;
}

.input-form input:focus {
  outline: none;
  border-color: #0f3460;
}

.input-form button {
  padding: 12px 24px;
  background: #0f3460;
  border: none;
  border-radius: 8px;
  color: #eee;
  cursor: pointer;
  font-size: 14px;
}

.input-form button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input-form button:hover:not(:disabled) {
  background: #1a4980;
}
```

**Step 2: Create demo/App.tsx**

```typescript
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
        {({ value, onChange, onSubmit, isDisabled, placeholder }) => (
          <form onSubmit={onSubmit} className="input-form">
            <input
              value={value}
              onChange={(e) => onChange(e.target.value)}
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
```

**Step 3: Install demo dependencies and run**

Run: `cd demo && pnpm install && cd .. && pnpm dev`
Expected: Demo app runs at http://localhost:5174

**Step 4: Commit**

```bash
git add demo/App.tsx demo/styles.css
git commit -m "feat: create demo app with full example"
```

---

## Phase 7: CI/CD

### Task 026: Create GitHub Actions workflow

**Files:**
- Create: `.github/workflows/ci.yml`

**Step 1: Create workflow**

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v3
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Type check
        run: pnpm typecheck

      - name: Lint
        run: pnpm lint

      - name: Unit tests
        run: pnpm test:unit --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info
        continue-on-error: true

  playwright:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v3
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Install Playwright
        run: pnpm exec playwright install --with-deps chromium

      - name: Build library
        run: pnpm build

      - name: Component tests
        run: pnpm test:ct

      - name: Upload test artifacts
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/

  release:
    needs: [test, playwright]
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/master'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v3
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
          registry-url: 'https://registry.npmjs.org'

      - name: Install & Build
        run: pnpm install --frozen-lockfile && pnpm build

      - name: Publish
        run: |
          CURRENT=$(npm view chat-ag-ui version 2>/dev/null || echo "0.0.0")
          PACKAGE=$(node -p "require('./package.json').version")
          if [ "$CURRENT" != "$PACKAGE" ]; then
            pnpm publish --access public --no-git-checks
          else
            echo "Version $PACKAGE already published"
          fi
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

**Step 2: Commit**

```bash
git add .github/
git commit -m "ci: add GitHub Actions workflow"
```

---

## Execution Strategy

**Recommended approach**: `/speckit-superpowers.tasks` for TDD structure

**Parallel opportunities**:
- Tasks 001-006 (setup) can be done sequentially but quickly
- Tasks 007-011 (utils + event handlers) are independent after types
- Tasks 018-021 (headless components) are independent

**Skills to invoke during implementation**:
- `superpowers:test-driven-development` for RED-GREEN-REFACTOR
- `superpowers:verification-before-completion` before commits
- `superpowers:systematic-debugging` on failures

---

## Checklist

- [ ] Phase 0: Project setup complete
- [ ] Phase 1: Core types and utilities tested
- [ ] Phase 2: AgentClient implemented
- [ ] Phase 3: All hooks implemented
- [ ] Phase 4: All headless components implemented
- [ ] Phase 5: Public API exports complete
- [ ] Phase 6: Demo app working
- [ ] Phase 7: CI/CD configured
- [ ] All tests passing
- [ ] Library builds successfully
