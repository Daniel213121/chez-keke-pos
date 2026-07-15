// Lightweight Server-Sent Events (SSE) broadcaster for POS orders
// Adds connections to a global set so other API handlers can push events.
const clientsKey = '__sse_pos_order_clients'
const sendKey = '__sse_pos_order_send'

function ensureGlobals() {
  if (!(globalThis as any)[clientsKey]) (globalThis as any)[clientsKey] = new Set()
  if (!(globalThis as any)[sendKey]) {
    ;(globalThis as any)[sendKey] = (eventName: string, payload: any) => {
      try {
        const enc = new TextEncoder()
        const data = typeof payload === 'string' ? payload : JSON.stringify(payload)
        for (const c of (globalThis as any)[clientsKey]) {
          try {
            c.controller.enqueue(enc.encode(`event: ${eventName}\n` + `data: ${data}\n\n`))
          } catch (err) {
            try { c.controller.close() } catch {};
            (globalThis as any)[clientsKey].delete(c)
          }
        }
      } catch (err) {
        console.error('SSE send error', err)
      }
    }
  }
}

export async function GET() {
  ensureGlobals()

  const stream = new ReadableStream({
    start(controller) {
      const enc = new TextEncoder()
      const client = { controller }
      ;(globalThis as any)[clientsKey].add(client)

      // initial comment to establish connection
      controller.enqueue(enc.encode(': connected\n\n'))

      // heartbeat to keep connection alive
      const id = setInterval(() => {
        try { controller.enqueue(enc.encode(': heartbeat\n\n')) } catch (e) {}
      }, 20000)

      return () => {
        clearInterval(id)
        ;(globalThis as any)[clientsKey].delete(client)
      }
    },
    cancel() {
      // no-op: cleanup is handled by the returned closer from start
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    }
  })
}

// export a helper for other modules to use (optional)
export const sendSSE = (eventName: string, payload: any) => {
  ensureGlobals()
  ;(globalThis as any)[sendKey]?.(eventName, payload)
}
