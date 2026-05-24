const DEFAULT_BASE = 'http://127.0.0.1:8000'

function getApiBase() {
  const raw = import.meta.env.VITE_API_BASE_URL
  return (raw && raw.trim() ? raw : DEFAULT_BASE).replace(/\/$/, '')
}

export async function createDemoTrade({ side, symbol, quantity, entry_price }) {
  const res = await fetch(`${getApiBase()}/api/trades/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ side, symbol, quantity, entry_price }),
  })
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}`)
    err.status = res.status
    throw err
  }
  return res.json()
}

export async function getDemoPnl({ symbol, current_price }) {
  const params = new URLSearchParams({
    symbol,
    current_price: String(current_price),
  })
  const res = await fetch(`${getApiBase()}/api/trades/pnl/?${params}`)
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}`)
    err.status = res.status
    throw err
  }
  return res.json()
}
