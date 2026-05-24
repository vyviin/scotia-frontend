export const SCENARIO_TITLE = "Scenario A — 15-min scalp";

export const EVENT_BADGES = {
  market_open: "Watching",
  first_15m_close: "Level Formed",
  breakout: "Breakout",
  retest: "Retest",
  confirmation: "Signal",
  take_profit: "Target",
};

export const LEVEL_LABELS = {
  overnightHigh: "Overnight High",
  overnightLow: "Overnight Low",
  first15mHigh: "First 15m High",
  first15mLow: "First 15m Low",
  breakoutLevel: "Breakout Level",
  retestZone: "Retest Zone",
  tp1: "TP1",
  tp2: "TP2",
};

export const scalpScenarioEvents = [
  {
    candleIndex: 0,
    type: "market_open",
    timelineLabel: "Market Open",
    title: "Market Open",
    message: "Price is opening near a key liquidity zone. We are not chasing yet.",
    levelActions: [
      { action: "show", level: "overnightHigh" },
      { action: "show", level: "overnightLow" },
    ],
  },
  {
    candleIndex: 1,
    type: "first_15m_close",
    timelineLabel: "First 15m Level",
    title: "First 15m Candle Closed",
    message: "First candle is done. Now we mark the high and low as decision levels.",
    levelActions: [
      { action: "show", level: "first15mHigh" },
      { action: "show", level: "first15mLow" },
    ],
  },
  {
    candleIndex: 9,
    type: "breakout",
    timelineLabel: "Breakout",
    title: "Breakout",
    message: "Price broke above resistance. Do not FOMO. Wait for the retest.",
    levelActions: [{ action: "show", level: "breakoutLevel" }],
  },
  {
    candleIndex: 11,
    type: "retest",
    timelineLabel: "Retest",
    title: "Retest",
    message: "Retest is happening. This is where we look for confirmation.",
    levelActions: [{ action: "show", level: "retestZone" }],
  },
  {
    candleIndex: 12,
    type: "confirmation",
    timelineLabel: "Confirmation",
    title: "1-Min Confirmation",
    message: "Confirmation candle printed. Demo long signal is active.",
    levelActions: [],
  },
  {
    candleIndex: 14,
    type: "take_profit",
    timelineLabel: "Target",
    title: "Take Profit Zone",
    message: "Price is approaching the next round-number target. This is where traders trim risk.",
    levelActions: [
      { action: "show", level: "tp1" },
      { action: "show", level: "tp2" },
    ],
  },
];

export const SWING_LABEL_DEFS = [
  { anchorIndex: 2, text: "HH", above: true },
  { anchorIndex: 5, text: "HL", above: false },
  { anchorIndex: 9, text: "Break", above: true },
  { anchorIndex: 11, text: "Retest", above: false },
  { anchorIndex: 12, text: "Buy Signal", above: true },
  { anchorIndex: 14, text: "TP1", above: true },
];

function roundToHalf(n) {
  return Math.round(n * 2) / 2;
}

export function deriveScenarioLevels(candles) {
  if (!candles.length) {
    return {
      levels: {},
      chartBounds: { minP: 0, maxP: 1 },
    };
  }

  const overnightSlice = candles.slice(0, 3);
  const overnightHigh = Math.max(...overnightSlice.map((c) => c.h));
  const overnightLow = Math.min(...overnightSlice.map((c) => c.l));

  const first15mHigh = candles[0].h;
  const first15mLow = candles[0].l;
  const breakoutLevel = first15mHigh;
  const retestZone = roundToHalf(breakoutLevel - 0.25);

  const lastClose = candles[candles.length - 1].c;
  const tp1 = roundToHalf(Math.ceil(lastClose) + 0.5);
  const tp2 = roundToHalf(tp1 + 1);

  const levels = {
    overnightHigh,
    overnightLow,
    first15mHigh,
    first15mLow,
    breakoutLevel,
    retestZone,
    tp1,
    tp2,
  };

  const allPrices = [
    ...candles.flatMap((c) => [c.h, c.l]),
    ...Object.values(levels),
  ];
  const rawMin = Math.min(...allPrices);
  const rawMax = Math.max(...allPrices);
  const padPct = (rawMax - rawMin) * 0.04 || 0.5;

  return {
    levels,
    chartBounds: { minP: rawMin - padPct, maxP: rawMax + padPct },
  };
}

export function getActiveEvent(events, visibleCount) {
  if (visibleCount < 1) return null;
  const lastVisibleIndex = visibleCount - 1;
  return events.filter((e) => e.candleIndex <= lastVisibleIndex).at(-1) ?? null;
}

export function getVisibleLevelKeys(events, visibleCount) {
  const active = getActiveEvent(events, visibleCount);
  if (!active) return new Set();

  const keys = new Set();
  for (const event of events) {
    if (event.candleIndex > (visibleCount - 1)) break;
    for (const action of event.levelActions ?? []) {
      if (action.action === "show" && action.level) keys.add(action.level);
    }
  }
  return keys;
}

export function getEventBadge(event) {
  if (!event) return "Watching";
  return EVENT_BADGES[event.type] ?? "Watching";
}

export function getSwingLabels(visibleCount, allCandles) {
  if (visibleCount < 1 || !allCandles.length) return [];
  const lastVisibleIndex = visibleCount - 1;
  return SWING_LABEL_DEFS.filter((def) => def.anchorIndex <= lastVisibleIndex).map(
    (def) => ({
      ...def,
      candle: allCandles[def.anchorIndex],
    })
  );
}

export function getTimelineItemState(event, visibleCount, activeEvent) {
  const lastVisibleIndex = visibleCount - 1;
  if (event.candleIndex < lastVisibleIndex) return "completed";
  if (activeEvent && event.candleIndex === activeEvent.candleIndex) return "current";
  if (event.candleIndex === lastVisibleIndex && !activeEvent) return "current";
  return "upcoming";
}
