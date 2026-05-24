const DEFAULT_BASE = 'http://127.0.0.1:8000'

function getApiBase() {
  const raw = import.meta.env.VITE_API_BASE_URL
  return (raw && raw.trim() ? raw : DEFAULT_BASE).replace(/\/$/, '')
}

export async function fetchReplayCandles({ symbol = 'SPY', timeframe = '15m' } = {}) {
  const params = new URLSearchParams({ symbol, timeframe })
  const res = await fetch(`${getApiBase()}/api/replay/candles/?${params}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  return {
    symbol: data.symbol,
    timeframe: data.timeframe,
    candles: (data.candles ?? []).map((c) => ({
      index: c.index,
      timestamp: c.timestamp,
      o: c.open,
      h: c.high,
      l: c.low,
      c: c.close,
      volume: c.volume,
    })),
  }
}
