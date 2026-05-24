function formatMoney(value) {
  const n = Number(value) || 0
  const sign = n > 0 ? '+' : n < 0 ? '-' : ''
  return `${sign}$${Math.abs(n).toFixed(2)}`
}

function formatPrice(value) {
  const n = Number(value)
  if (Number.isNaN(n)) return '—'
  return `$${n.toFixed(2)}`
}

function formatTime(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return '—'
  }
}

export default function TradeControlsPanel({
  symbol = 'SPY',
  quantity = 2,
  onQuantityChange,
  currentPrice = null,
  totalUnrealizedPnl = 0,
  tradeCount = 0,
  openTrades = [],
  onBuy,
  onSell,
  disabled = false,
  isSubmitting = false,
  isConfirmationActive = false,
  isBeforeConfirmation = false,
  compact = false,
}) {
  const pnl = Number(totalUnrealizedPnl) || 0
  const pnlClass =
    pnl > 0 ? 'text-green-400' : pnl < 0 ? 'text-red-400' : 'text-zinc-400'

  const qty = Math.max(1, Number(quantity) || 2)
  const buyLabel = `BUY ${qty} ${symbol}`
  const sellLabel = `SELL ${qty} ${symbol}`

  const latestTrades = openTrades.slice(0, 5)

  return (
    <div
      className={`rounded-xl border border-zinc-800 bg-zinc-900/80 ${
        compact ? 'p-3 space-y-2.5' : 'p-4 space-y-3'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          Demo Trades
        </span>
        <span className="text-[10px] font-mono text-zinc-500">
          {tradeCount} {tradeCount === 1 ? 'trade' : 'trades'}
        </span>
      </div>

      {isConfirmationActive && (
        <p className="text-[11px] text-green-400/95 font-medium leading-snug">
          Signal active — demo long entry available
        </p>
      )}
      {isBeforeConfirmation && !isConfirmationActive && (
        <p className="text-[11px] text-zinc-500 leading-snug">
          Wait for confirmation before entering.
        </p>
      )}

      <div className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] text-zinc-500 uppercase tracking-wide">Qty</label>
          <input
            type="number"
            min={1}
            max={99}
            value={quantity}
            onChange={(e) => onQuantityChange?.(e.target.value)}
            className="w-14 px-2 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-zinc-100 text-xs font-mono focus:outline-none focus:border-green-500/50"
          />
        </div>
        <div className="flex-1 min-w-[100px]">
          <div className="text-[10px] text-zinc-500 uppercase tracking-wide">Replay price</div>
          <div className="text-sm font-mono font-bold text-white">
            {currentPrice != null ? formatPrice(currentPrice) : '—'}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-zinc-500 uppercase tracking-wide">Unrealized P&L</div>
          <div className={`text-sm font-mono font-bold ${pnlClass}`}>
            {formatMoney(pnl)}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={disabled || isSubmitting}
          onClick={onBuy}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${
            disabled || isSubmitting
              ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed border border-zinc-800'
              : isConfirmationActive
                ? 'bg-green-600 text-white hover:bg-green-500 border border-green-400/60 shadow-[0_0_12px_rgba(34,197,94,0.35)]'
                : 'bg-green-600/90 text-white hover:bg-green-500 border border-green-500/40'
          }`}
        >
          {buyLabel}
        </button>
        <button
          type="button"
          disabled={disabled || isSubmitting}
          onClick={onSell}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${
            disabled || isSubmitting
              ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed border border-zinc-800'
              : 'bg-red-600/90 text-white hover:bg-red-500 border border-red-500/40'
          }`}
        >
          {sellLabel}
        </button>
      </div>

      {latestTrades.length > 0 && (
        <div className="border-t border-zinc-800 pt-2 space-y-1.5">
          <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            Open Trades
          </div>
          <ul className="space-y-1 max-h-28 overflow-y-auto scrollbar-hide">
            {latestTrades.map((t) => {
              const tradePnl = Number(t.unrealized_pnl) || 0
              const tradePnlClass =
                tradePnl > 0
                  ? 'text-green-400'
                  : tradePnl < 0
                    ? 'text-red-400'
                    : 'text-zinc-500'
              return (
                <li
                  key={t.id ?? `${t.side}-${t.entry_price}-${t.created_at}`}
                  className="flex items-center justify-between gap-2 text-[10px] font-mono"
                >
                  <span className={t.side === 'BUY' ? 'text-green-400' : 'text-red-400'}>
                    {t.side} {Number(t.quantity)} @ {formatPrice(t.entry_price)}
                  </span>
                  <span className="text-zinc-600">{formatTime(t.created_at)}</span>
                  <span className={`font-semibold ${tradePnlClass}`}>
                    {formatMoney(tradePnl)}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
