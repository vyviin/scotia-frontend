const EVENT_SPEECH = {
  market_open:
    'Market open. We are near a liquidity zone, so the play is patience. First we let the opening candle define the battlefield.',
  first_15m_close:
    'First 15-minute candle is locked. I marked the high and low. Break above the high means buyers are trying to take control.',
  breakout:
    'Breakout detected above the first 15-minute high. No cap, this is not where we chase. We wait for the retest.',
  retest:
    'Retest is happening now. Price is checking if old resistance can become support. This is where confirmation matters.',
  confirmation:
    'Confirmation printed. In this demo, that means a long idea is active. The lesson is entry after confirmation, not during the FOMO candle.',
  take_profit:
    'Price is pushing into the target zone. This is where traders often trim risk instead of getting greedy.',
}

function formatPrice(value) {
  if (value == null || !Number.isFinite(Number(value))) return null
  return Number(value).toFixed(2)
}

function formatPnl(value) {
  if (value == null || !Number.isFinite(Number(value))) return '0.00'
  const n = Number(value)
  const sign = n >= 0 ? '+' : ''
  return `${sign}${n.toFixed(2)}`
}

export function buildTavusChartContext({
  activeScenarioEvent,
  currentCandleIndex,
  currentPrice,
  symbol,
  timeframe,
  scenarioLevels,
  pnlData,
  visibleCount,
}) {
  const sym = symbol || 'SPY'
  const tf = timeframe || '15m'
  const levels = scenarioLevels ?? {}
  const priceStr = formatPrice(currentPrice)
  const activeLabel =
    activeScenarioEvent?.title || activeScenarioEvent?.type || 'Watching'

  const parts = [
    `You are currently coaching a demo ${sym} ${tf} scalp replay.`,
    `Current candle index is ${currentCandleIndex ?? 0}.`,
  ]

  if (priceStr) {
    parts.push(`Current price is ${priceStr}.`)
  }

  parts.push(`Active event is ${activeLabel}.`)

  const levelBits = []
  const breakout = formatPrice(levels.breakoutLevel)
  const retest = formatPrice(levels.retestZone)
  const tp1 = formatPrice(levels.tp1)
  if (breakout) levelBits.push(`breakout level is ${breakout}`)
  if (retest) levelBits.push(`retest zone is ${retest}`)
  if (tp1) levelBits.push(`TP1 is ${tp1}`)
  if (levelBits.length) {
    parts.push(`${levelBits.join(', ')}.`)
  }

  const tradeCount = pnlData?.open_trades?.length ?? 0
  if (tradeCount > 0) {
    parts.push(
      `The user has ${tradeCount} demo open trade${tradeCount === 1 ? '' : 's'} with unrealized P&L of ${formatPnl(pnlData?.total_unrealized_pnl)}.`
    )
  } else {
    parts.push('The user has no demo open trades.')
  }

  if (visibleCount != null) {
    parts.push(`Visible candles in replay: ${visibleCount}.`)
  }

  parts.push(
    'When the user asks about the chart, answer using this replay context.',
    'Never give real financial advice.',
    'This is educational only.'
  )

  return parts.join(' ')
}

export function buildTavusMentorBootstrapContext(params) {
  const chartContext = buildTavusChartContext(params)
  const sym = params?.symbol || 'SPY'
  const tf = params?.timeframe || '15m'
  const levels = params?.scenarioLevels ?? {}

  const knownLevels = [
    levels.overnightHigh != null && `overnight high ${formatPrice(levels.overnightHigh)}`,
    levels.overnightLow != null && `overnight low ${formatPrice(levels.overnightLow)}`,
    levels.first15mHigh != null && `first 15m high ${formatPrice(levels.first15mHigh)}`,
    levels.first15mLow != null && `first 15m low ${formatPrice(levels.first15mLow)}`,
    levels.breakoutLevel != null && `breakout ${formatPrice(levels.breakoutLevel)}`,
    levels.retestZone != null && `retest zone ${formatPrice(levels.retestZone)}`,
    levels.tp1 != null && `TP1 ${formatPrice(levels.tp1)}`,
    levels.tp2 != null && `TP2 ${formatPrice(levels.tp2)}`,
  ]
    .filter(Boolean)
    .join(', ')

  return [
    'App name: iTrade Replay Mentor Demo.',
    `Symbol: ${sym}. Timeframe: ${tf}. Scenario type: 15-minute scalp.`,
    knownLevels ? `Known levels: ${knownLevels}.` : '',
    chartContext,
    'Rule: when the user asks about the chart, answer using the current replay context above.',
    'Rule: never give real financial advice or guaranteed profit claims.',
    'Rule: explain everything as an educational demo only.',
  ]
    .filter(Boolean)
    .join(' ')
}

export function buildTavusEventSpeech(activeScenarioEvent, _currentCandleIndex) {
  if (!activeScenarioEvent) return ''

  const scripted = EVENT_SPEECH[activeScenarioEvent.type]
  if (scripted) return scripted

  const message = activeScenarioEvent.message?.trim()
  if (message) {
    return `Demo only: ${message}`
  }

  return 'Demo chart update — educational replay only, not financial advice.'
}

export function buildEchoInteraction(conversationId, text) {
  return {
    message_type: 'conversation',
    event_type: 'conversation.echo',
    conversation_id: conversationId,
    properties: {
      modality: 'text',
      text,
    },
  }
}

/** Daily.js app message for Tavus LLM context (adjust event_type here if API changes). */
export function buildContextOverwriteInteraction(conversationId, context) {
  return {
    message_type: 'conversation',
    event_type: 'conversation.overwrite_llm_context',
    conversation_id: conversationId,
    properties: {
      context,
    },
  }
}

export function spokenEventKey(conversationId, event) {
  if (!conversationId || !event?.type) return ''
  return `${conversationId}:${event.type}:${event.candleIndex}`
}
