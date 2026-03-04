import { http, HttpResponse, delay } from 'msw'
import { setupWorker } from 'msw/browser'

/**
 * MockAgentServer provides MSW handlers to simulate AG-UI backend.
 *
 * This allows the demo app to run without a real backend,
 * making it useful for development and component testing.
 *
 * Endpoints mocked:
 * - POST /api/agent - Init and message sending
 * - GET /api/agent/sse - Server-Sent Events stream
 * - POST /api/agent/tool-result - Tool execution results
 */

export const worker = setupWorker(
  // Handle init and message sending
  http.post('/api/agent', async ({ request }) => {
    const body = await request.json() as { type: string; content?: string }

    if (body.type === 'init') {
      return HttpResponse.json({ status: 'ready' })
    }

    if (body.type === 'message') {
      // Simulate processing delay
      await delay(100)
      return HttpResponse.json({ status: 'queued' })
    }

    return HttpResponse.json({ error: 'Unknown request type' }, { status: 400 })
  }),

  // Handle tool results
  http.post('/api/agent/tool-result', async () => {
    await delay(50)
    return HttpResponse.json({ status: 'received' })
  }),

  // SSE stream - this is the most important mock
  // In a real scenario, this would stream events from an LLM agent
  http.get('/api/agent/sse', async function* streamEvents() {
    // Send RunStarted event
    yield new MessageEvent('RunStarted', {
      data: JSON.stringify({ runId: 'run-123' }),
    })

    // Send TextMessageStart
    yield new MessageEvent('TextMessageStart', {
      data: JSON.stringify({
        messageId: 'msg-1',
        role: 'assistant',
      }),
    })

    // Stream text content
    const text = 'Hello! I am your AG-UI assistant. How can I help you today?'
    const chunks = text.split(' ')

    for (const chunk of chunks) {
      await delay(50)
      yield new MessageEvent('TextMessageContent', {
        data: JSON.stringify({
          messageId: 'msg-1',
          delta: chunk + ' ',
        }),
      })
    }

    yield new MessageEvent('TextMessageEnd', {
      data: JSON.stringify({
        messageId: 'msg-1',
      }),
    })

    yield new MessageEvent('RunFinished', {
      data: JSON.stringify({
        runId: 'run-123',
      }),
    })
  })
)

/**
 * Helper to generate a tool call scenario
 */
export async function* streamToolCallScenario(toolName: string, args: Record<string, unknown>) {
  yield new MessageEvent('RunStarted', {
    data: JSON.stringify({ runId: 'run-tool-' + Date.now() }),
  })

  yield new MessageEvent('TextMessageStart', {
    data: JSON.stringify({
      messageId: 'msg-tool-' + Date.now(),
      role: 'assistant',
    }),
  })

  yield new MessageEvent('TextMessageContent', {
    data: JSON.stringify({
      messageId: 'msg-tool-' + Date.now(),
      delta: `Let me call the ${toolName} tool for you.`,
    }),
  })

  yield new MessageEvent('TextMessageEnd', {
    data: JSON.stringify({
      messageId: 'msg-tool-' + Date.now(),
    }),
  })

  yield new MessageEvent('ToolCallStart', {
    data: JSON.stringify({
      toolCallId: 'tool-' + Date.now(),
      toolCallName: toolName,
    }),
  })

  // Stream tool arguments
  const argsJson = JSON.stringify(args)
  for (let i = 0; i < argsJson.length; i += 10) {
    const chunk = argsJson.slice(i, i + 10)
    yield new MessageEvent('ToolCallArgs', {
      data: JSON.stringify({
        toolCallId: 'tool-' + Date.now(),
        delta: chunk,
      }),
    })
    await delay(30)
  }

  yield new MessageEvent('ToolCallEnd', {
    data: JSON.stringify({
      toolCallId: 'tool-' + Date.now(),
    }),
  })

  yield new MessageEvent('RunFinished', {
    data: JSON.stringify({
      runId: 'run-tool-' + Date.now(),
    }),
  })
}

/**
 * Helper to generate a state delta scenario
 */
export async function* streamStateDeltaScenario(patches: unknown[]) {
  yield new MessageEvent('StateDelta', {
    data: JSON.stringify({
      delta: patches,
    }),
  })
}
