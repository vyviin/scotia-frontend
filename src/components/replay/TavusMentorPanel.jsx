import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Daily from '@daily-co/daily-js'
import { Video } from 'lucide-react'
import { createTavusSession } from '../../api/tavusSession'
import {
  buildContextOverwriteInteraction,
  buildEchoInteraction,
  buildTavusChartContext,
  buildTavusEventSpeech,
  buildTavusMentorBootstrapContext,
  spokenEventKey,
} from '../../utils/tavusEventSpeech'

const TEST_CALLOUT_TEXT = 'Mentor connected. Chart callouts are ready.'

export default function TavusMentorPanel({
  activeScenarioEvent,
  currentCandleIndex = 0,
  replayResetKey = 0,
  pnlRefreshKey = 0,
  compact = false,
  symbol = 'SPY',
  timeframe = '15m',
  scenarioLevels = {},
  pnlData = null,
  visibleCount = 0,
  currentPrice = null,
}) {
  const [phase, setPhase] = useState('idle')
  const [session, setSession] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [callReady, setCallReady] = useState(false)
  const [calloutStatus, setCalloutStatus] = useState('idle')
  const [lastCalloutTitle, setLastCalloutTitle] = useState('')
  const [calloutError, setCalloutError] = useState('')
  const [contextStatus, setContextStatus] = useState('idle')

  const containerRef = useRef(null)
  const callRef = useRef(null)
  const spokenKeysRef = useRef(new Set())
  const mentorContextSentRef = useRef(false)

  const conversationId = session?.conversation_id
  const frameMinH = compact ? 'min-h-[200px] h-[200px]' : 'min-h-[240px] h-[240px] md:min-h-[320px] md:h-[320px]'

  const chartContextParams = useMemo(
    () => ({
      activeScenarioEvent,
      currentCandleIndex,
      currentPrice,
      symbol,
      timeframe,
      scenarioLevels,
      pnlData,
      visibleCount,
    }),
    [
      activeScenarioEvent?.type,
      activeScenarioEvent?.title,
      currentCandleIndex,
      currentPrice,
      symbol,
      timeframe,
      scenarioLevels,
      pnlData?.open_trades?.length,
      pnlData?.total_unrealized_pnl,
      visibleCount,
    ]
  )

  const sendContextUpdate = useCallback(
    (options = {}) => {
      const { bootstrap = false } = options
      const call = callRef.current
      if (!call || !callReady || !conversationId) {
        return false
      }

      const context = bootstrap
        ? buildTavusMentorBootstrapContext(chartContextParams)
        : buildTavusChartContext(chartContextParams)

      if (!context?.trim()) {
        return false
      }

      try {
        call.sendAppMessage(
          buildContextOverwriteInteraction(conversationId, context.trim()),
          '*'
        )
        setContextStatus('synced')
        return true
      } catch (err) {
        setContextStatus('failed')
        setCalloutError(err?.message || 'Could not sync chart context')
        return false
      }
    },
    [callReady, conversationId, chartContextParams]
  )

  const sendCallout = useCallback(
    (text, title) => {
      const call = callRef.current
      if (!call || !callReady || !conversationId || !text?.trim()) {
        return false
      }

      setCalloutStatus('sending')
      setCalloutError('')
      setLastCalloutTitle(title || 'Callout')

      try {
        call.sendAppMessage(buildEchoInteraction(conversationId, text.trim()), '*')
        setCalloutStatus('spoken')
        return true
      } catch (err) {
        setCalloutStatus('failed')
        setCalloutError(err?.message || 'Could not send callout')
        return false
      }
    },
    [callReady, conversationId]
  )

  useEffect(() => {
    if (phase !== 'ready' || !session?.conversation_url) {
      return undefined
    }

    const parent = containerRef.current
    if (!parent) {
      return undefined
    }

    setCallReady(false)
    mentorContextSentRef.current = false

    const call = Daily.createFrame(parent, {
      iframeStyle: {
        width: '100%',
        height: '100%',
        border: '0',
      },
      showLeaveButton: false,
    })
    callRef.current = call

    const onJoined = () => setCallReady(true)
    const onLeft = () => setCallReady(false)

    call.on('joined-meeting', onJoined)
    call.on('left-meeting', onLeft)
    call.join({ url: session.conversation_url })

    return () => {
      call.off('joined-meeting', onJoined)
      call.off('left-meeting', onLeft)
      call.leave()
      call.destroy()
      callRef.current = null
      setCallReady(false)
    }
  }, [phase, session?.conversation_url])

  useEffect(() => {
    spokenKeysRef.current.clear()
    mentorContextSentRef.current = false
    setContextStatus('idle')
  }, [replayResetKey])

  useEffect(() => {
    if (!callReady || !conversationId || mentorContextSentRef.current) {
      return
    }
    const ok = sendContextUpdate({ bootstrap: true })
    if (ok) {
      mentorContextSentRef.current = true
    }
  }, [callReady, conversationId, sendContextUpdate])

  useEffect(() => {
    if (!callReady || !conversationId || replayResetKey === 0) {
      return
    }
    sendContextUpdate({ bootstrap: true })
  }, [replayResetKey, callReady, conversationId, sendContextUpdate])

  useEffect(() => {
    if (!callReady || !conversationId || pnlRefreshKey === 0) {
      return
    }
    sendContextUpdate({ bootstrap: false })
  }, [pnlRefreshKey, callReady, conversationId, sendContextUpdate])

  useEffect(() => {
    if (phase !== 'ready' || !callReady || !conversationId || !activeScenarioEvent) {
      return
    }

    if (currentCandleIndex < activeScenarioEvent.candleIndex) {
      return
    }

    const key = spokenEventKey(conversationId, activeScenarioEvent)
    if (!key || spokenKeysRef.current.has(key)) {
      return
    }

    const text = buildTavusEventSpeech(activeScenarioEvent, currentCandleIndex)
    if (!text) {
      return
    }

    spokenKeysRef.current.add(key)
    sendContextUpdate({ bootstrap: false })
    sendCallout(text, activeScenarioEvent.title)
  }, [
    phase,
    callReady,
    conversationId,
    activeScenarioEvent?.type,
    activeScenarioEvent?.candleIndex,
    currentCandleIndex,
    sendCallout,
    sendContextUpdate,
  ])

  async function handleStart() {
    setPhase('loading')
    setErrorMessage('')
    setCalloutStatus('idle')
    setLastCalloutTitle('')
    setCalloutError('')
    setContextStatus('idle')
    spokenKeysRef.current.clear()
    mentorContextSentRef.current = false

    try {
      const data = await createTavusSession()
      setSession(data)
      setPhase('ready')
    } catch (err) {
      setSession(null)
      setErrorMessage(err?.message || 'Unknown error')
      setPhase('error')
    }
  }

  function handleRestart() {
    if (callRef.current) {
      callRef.current.leave()
      callRef.current.destroy()
      callRef.current = null
    }
    spokenKeysRef.current.clear()
    mentorContextSentRef.current = false
    setCallReady(false)
    setCalloutStatus('idle')
    setLastCalloutTitle('')
    setCalloutError('')
    setContextStatus('idle')
    setPhase('idle')
    setSession(null)
    setErrorMessage('')
  }

  function handleTestCallout() {
    sendCallout(TEST_CALLOUT_TEXT, 'Test callout')
  }

  function handleSyncChartContext() {
    sendContextUpdate({ bootstrap: true })
  }

  const calloutStatusLabel =
    calloutStatus === 'sending'
      ? 'Sending...'
      : calloutStatus === 'spoken'
        ? 'Spoken'
        : calloutStatus === 'failed'
          ? 'Failed'
          : null

  const contextStatusLabel =
    contextStatus === 'synced'
      ? 'Context synced'
      : contextStatus === 'failed'
        ? 'Context sync failed'
        : null

  return (
    <div
      className={`rounded-xl bg-zinc-900/80 border border-zinc-800 ${compact ? 'p-3' : 'p-4'}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Video size={compact ? 12 : 14} className="text-green-500 flex-shrink-0" />
        <div>
          <span className="text-zinc-300 text-xs font-bold uppercase tracking-wide block">
            AI Trading Mentor
          </span>
          <span className="text-zinc-500 text-[10px]">Live Tavus CVI mentor</span>
        </div>
      </div>

      {phase === 'idle' && (
        <>
          <p className={`text-zinc-400 leading-snug mb-3 ${compact ? 'text-xs' : 'text-sm'}`}>
            Start Mentor to enable spoken chart callouts.
          </p>
          <button
            type="button"
            onClick={handleStart}
            className="w-full py-2.5 rounded-lg bg-green-600/20 border border-green-500/50 text-green-400 text-xs font-bold uppercase tracking-wide hover:bg-green-600/30 transition-colors"
          >
            Start Mentor
          </button>
        </>
      )}

      {phase === 'loading' && (
        <p className={`text-zinc-400 ${compact ? 'text-xs' : 'text-sm'}`}>
          Starting mentor...
        </p>
      )}

      {phase === 'ready' && session?.conversation_url && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span
              className={`text-[10px] font-bold uppercase tracking-wide ${
                callReady ? 'text-green-500' : 'text-zinc-500'
              }`}
            >
              {callReady ? 'Auto callouts: ON' : 'Connecting call...'}
            </span>
            {callReady && (
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={handleSyncChartContext}
                  className="px-2 py-1 rounded border border-zinc-700 text-zinc-400 text-[10px] font-semibold hover:border-green-500/40 hover:text-green-400 transition-colors"
                >
                  Sync Chart Context
                </button>
                <button
                  type="button"
                  onClick={handleTestCallout}
                  className="px-2 py-1 rounded border border-zinc-700 text-zinc-400 text-[10px] font-semibold hover:border-green-500/40 hover:text-green-400 transition-colors"
                >
                  Test Callout
                </button>
              </div>
            )}
          </div>

          <div
            ref={containerRef}
            className={`w-full rounded-lg border border-zinc-800 bg-black overflow-hidden ${frameMinH}`}
          />

          {(lastCalloutTitle || calloutStatusLabel || contextStatusLabel) && (
            <div className="mt-2 text-[10px] text-zinc-500 space-y-0.5">
              {lastCalloutTitle && (
                <p className="truncate" title={lastCalloutTitle}>
                  Last: {lastCalloutTitle}
                </p>
              )}
              {calloutStatusLabel && (
                <p
                  className={
                    calloutStatus === 'failed'
                      ? 'text-red-400/90'
                      : calloutStatus === 'spoken'
                        ? 'text-green-500/90'
                        : 'text-zinc-400'
                  }
                >
                  Status: {calloutStatusLabel}
                </p>
              )}
              {contextStatusLabel && (
                <p
                  className={
                    contextStatus === 'failed'
                      ? 'text-red-400/90'
                      : 'text-green-500/90'
                  }
                >
                  {contextStatusLabel}
                </p>
              )}
              {calloutError && (
                <p className="text-red-400/80 truncate" title={calloutError}>
                  {calloutError}
                </p>
              )}
            </div>
          )}

          <div className="mt-2 pt-2 border-t border-zinc-800/80 space-y-1">
            <div className="flex flex-wrap justify-between gap-x-2 gap-y-1 text-[10px] font-mono text-zinc-500">
              <span className="truncate" title={session.conversation_id}>
                id: {session.conversation_id ?? '—'}
              </span>
              <span>status: {session.status ?? '—'}</span>
            </div>
            <div className="flex flex-wrap justify-between gap-x-2 text-[10px] font-mono text-zinc-600">
              <span>Candle {currentCandleIndex}</span>
              {activeScenarioEvent?.type && (
                <span>event: {activeScenarioEvent.type}</span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleRestart}
            className="mt-2 text-[10px] font-semibold text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            New Session
          </button>
        </>
      )}

      {phase === 'error' && (
        <>
          <p className={`text-zinc-300 leading-snug mb-2 ${compact ? 'text-xs' : 'text-sm'}`}>
            Could not start Tavus mentor. Is Django running and is Tavus configured?
          </p>
          {errorMessage && (
            <p className="text-[10px] font-mono text-red-400/90 mb-2 truncate" title={errorMessage}>
              {errorMessage}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleStart}
              className="flex-1 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-semibold hover:bg-zinc-700 transition-colors"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={handleRestart}
              className="px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 text-xs font-semibold hover:bg-zinc-700 transition-colors"
            >
              Reset
            </button>
          </div>
        </>
      )}
    </div>
  )
}
