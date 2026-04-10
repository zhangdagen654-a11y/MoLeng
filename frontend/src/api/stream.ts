export interface SSECallbacks {
  onToken: (text: string) => void
  onDone: (result: unknown) => void
  onError: (message: string) => void
}

export async function fetchSSE(
  url: string,
  options: { method?: string; body?: unknown },
  callbacks: SSECallbacks
): Promise<void> {
  const response = await fetch(`/api${url}`, {
    method: options.method || 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: '请求失败' }))
    callbacks.onError(err.detail || '请求失败')
    return
  }

  const reader = response.body?.getReader()
  if (!reader) {
    callbacks.onError('无法读取响应流')
    return
  }

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    let currentEvent = ''
    for (const line of lines) {
      if (line.startsWith('event: ')) {
        currentEvent = line.slice(7)
      } else if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6))
        if (currentEvent === 'token') {
          callbacks.onToken(data.text)
        } else if (currentEvent === 'done') {
          callbacks.onDone(data)
        } else if (currentEvent === 'error') {
          callbacks.onError(data.message)
        }
      }
    }
  }
}
