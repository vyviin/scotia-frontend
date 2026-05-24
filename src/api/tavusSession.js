const DEFAULT_BASE = 'http://127.0.0.1:8000'

function getApiBase() {
  const raw = import.meta.env.VITE_API_BASE_URL
  return (raw && raw.trim() ? raw : DEFAULT_BASE).replace(/\/$/, '')
}

async function parseErrorMessage(res) {
  try {
    const data = await res.json()
    if (data?.error) {
      return data.details ? `${data.error} ${data.details}` : data.error
    }
  } catch {
    // ignore JSON parse failures
  }
  return `Could not create Tavus session (HTTP ${res.status})`
}

export async function createTavusSession() {
  const res = await fetch(`${getApiBase()}/api/tavus/session/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })

  if (!res.ok) {
    throw new Error(await parseErrorMessage(res))
  }

  const data = await res.json()
  return {
    conversation_id: data.conversation_id,
    conversation_url: data.conversation_url,
    status: data.status,
    raw: data.raw,
  }
}
