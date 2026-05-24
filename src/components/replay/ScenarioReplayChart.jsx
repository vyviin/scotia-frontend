import { LEVEL_LABELS } from "../../scenarios/scalpScenario";

const W = 560;
const H = 200;
const PAD = 10;

const LEVEL_STYLES = {
  overnightHigh: { stroke: "#a78bfa", label: "#c4b5fd" },
  overnightLow: { stroke: "#a78bfa", label: "#c4b5fd" },
  first15mHigh: { stroke: "#fbbf24", label: "#fcd34d" },
  first15mLow: { stroke: "#fbbf24", label: "#fcd34d" },
  breakoutLevel: { stroke: "#f472b6", label: "#f9a8d4" },
  retestZone: { stroke: "#e879f9", label: "#f0abfc" },
  tp1: { stroke: "#22c55e", label: "#86efac" },
  tp2: { stroke: "#4ade80", label: "#bbf7d0" },
};

export default function ScenarioReplayChart({
  visibleCandles = [],
  chartBounds,
  levels = {},
  visibleLevelKeys = new Set(),
  swingLabels = [],
  tradeMarkers = [],
  isPlaying = false,
  totalCandleCount = 0,
}) {
  if (visibleCandles.length === 0) {
    return (
      <div className="relative w-full flex items-center justify-center" style={{ height: 200 }}>
        <span className="text-zinc-500 text-sm">No candles to display</span>
      </div>
    );
  }

  const { minP, maxP } = chartBounds;
  const range = maxP - minP || 1;
  const toY = (v) => PAD + ((maxP - v) / range) * (H - PAD * 2);
  const xDenom = Math.max(totalCandleCount - 1, 1);
  const candleW = (W / Math.max(totalCandleCount, visibleCandles.length)) * 0.5;

  const candleX = (i) => (i / xDenom) * (W - PAD * 2) + PAD;

  const maData = visibleCandles.map((c, i) => {
    const slice = visibleCandles.slice(Math.max(0, i - 4), i + 1);
    return slice.reduce((s, x) => s + x.c, 0) / slice.length;
  });
  const maPath = maData
    .map((v, i) => {
      const x = candleX(i) + candleW / 2;
      return `${i === 0 ? "M" : "L"} ${x} ${toY(v)}`;
    })
    .join(" ");

  const levelEntries = [...visibleLevelKeys]
    .filter((key) => levels[key] != null)
    .map((key) => ({
      key,
      price: levels[key],
      label: LEVEL_LABELS[key] ?? key,
      style: LEVEL_STYLES[key] ?? { stroke: "#71717a", label: "#a1a1aa" },
    }));

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 200 }}>
        {levelEntries.map(({ key, price, label, style }) => {
          const y = toY(price);
          return (
            <g key={key}>
              <line
                x1={PAD}
                y1={y}
                x2={W - PAD}
                y2={y}
                stroke={style.stroke}
                strokeWidth="1.5"
                strokeDasharray="6,4"
                opacity="0.75"
              />
              <text
                x={W - PAD - 4}
                y={y - 4}
                fill={style.label}
                fontSize="8"
                textAnchor="end"
                opacity="0.95"
              >
                {label} ${price.toFixed(2)}
              </text>
            </g>
          );
        })}

        <path d={maPath} fill="none" stroke="#fbbf24" strokeWidth="1.5" opacity="0.6" />

        {visibleCandles.map((c, i) => {
          const x = candleX(i);
          const bullish = c.c >= c.o;
          const color = bullish ? "#22c55e" : "#ef4444";
          const bodyTop = toY(Math.max(c.o, c.c));
          const bodyBot = toY(Math.min(c.o, c.c));
          const bodyH = Math.max(2, bodyBot - bodyTop);
          const isLatest = i === visibleCandles.length - 1;

          return (
            <g key={i}>
              {isLatest && isPlaying && (
                <rect
                  x={x - 2}
                  y={toY(c.h) - 2}
                  width={candleW + 4}
                  height={toY(c.l) - toY(c.h) + 4}
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="1"
                  rx="2"
                  opacity="0.5"
                >
                  <animate attributeName="opacity" values="0.3;0.7;0.3" dur="1.2s" repeatCount="indefinite" />
                </rect>
              )}
              <line
                x1={x + candleW / 2}
                y1={toY(c.h)}
                x2={x + candleW / 2}
                y2={toY(c.l)}
                stroke={color}
                strokeWidth={isLatest ? 2 : 1.5}
              />
              <rect
                x={x}
                y={bodyTop}
                width={candleW}
                height={bodyH}
                fill={color}
                rx="1"
                opacity={isLatest ? 1 : 0.9}
              />
            </g>
          );
        })}

        {swingLabels.map(({ anchorIndex, text, above, candle }) => {
          if (!candle) return null;
          const x = candleX(anchorIndex) + candleW / 2;
          const y = above ? toY(candle.h) - 6 : toY(candle.l) + 12;
          return (
            <text
              key={`${anchorIndex}-${text}`}
              x={x}
              y={y}
              fill={text === "Buy Signal" ? "#22c55e" : "#e4e4e7"}
              fontSize="8"
              fontWeight="bold"
              textAnchor="middle"
            >
              {text}
            </text>
          );
        })}

        {tradeMarkers.map(({ id, anchorIndex, side, candle }) => {
          if (!candle || anchorIndex < 0 || anchorIndex >= visibleCandles.length) return null;
          const x = candleX(anchorIndex) + candleW / 2;
          const y = toY(candle.h) - 14;
          const isBuy = side === "BUY";
          return (
            <g key={id ?? `trade-${anchorIndex}-${side}`}>
              <rect
                x={x - 14}
                y={y - 8}
                width={28}
                height={10}
                rx={2}
                fill={isBuy ? "#14532d" : "#450a0a"}
                stroke={isBuy ? "#22c55e" : "#ef4444"}
                strokeWidth="0.75"
                opacity="0.95"
              />
              <text
                x={x}
                y={y}
                fill={isBuy ? "#86efac" : "#fca5a5"}
                fontSize="7"
                fontWeight="bold"
                textAnchor="middle"
              >
                {side}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
