import { http, HttpResponse, delay } from 'msw'
import { setupWorker } from 'msw/browser'

/**
 * Encode a single SSE event in the wire format:
 *   event: EventName\ndata: {...}\n\n
 */
function sseEvent(name: string, data: unknown): string {
  return `event: ${name}\ndata: ${JSON.stringify(data)}\n\n`
}

/**
 * MockAgentServer provides MSW handlers to simulate an AG-UI backend.
 *
 * Endpoints mocked:
 * - POST /api/agent        — init and message sending
 * - GET  /api/agent/sse    — Server-Sent Events stream
 * - POST /api/agent/tool-result — tool execution results
 */
export const worker = setupWorker(
  // Handle init and message sending
  http.post('/api/agent', async ({ request }) => {
    const body = await request.json() as { type: string; content?: string }

    if (body.type === 'init') {
      return HttpResponse.json({ status: 'ready' })
    }

    if (body.type === 'message') {
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

  // SSE stream — simulate a streaming assistant response
  http.get('/api/agent/sse', () => {
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        const enqueue = (name: string, data: unknown) =>
          controller.enqueue(encoder.encode(sseEvent(name, data)))

        enqueue('RunStarted', { runId: 'run-123' })

        enqueue('TextMessageStart', { messageId: 'msg-1', role: 'assistant' })

        const words = 'Hello! I am your AG-UI assistant. How can I help you today?'.split(' ')
        for (const word of words) {
          await delay(60)
          enqueue('TextMessageContent', { messageId: 'msg-1', delta: word + ' ' })
        }

        enqueue('TextMessageEnd', { messageId: 'msg-1' })
        enqueue('RunFinished', { runId: 'run-123' })

        controller.close()
      },
    })

    return new HttpResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  })
)
