import { Volume2 } from "lucide-react";
import { getEventBadge } from "../../scenarios/scalpScenario";

const BADGE_STYLES = {
  Watching: "bg-zinc-700/80 text-zinc-300 border-zinc-600",
  "Level Formed": "bg-amber-500/15 text-amber-300 border-amber-500/40",
  Breakout: "bg-pink-500/15 text-pink-300 border-pink-500/40",
  Retest: "bg-purple-500/15 text-purple-300 border-purple-500/40",
  Signal: "bg-green-500/20 text-green-400 border-green-500/50",
  Target: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
};

export default function AgentCommentaryPanel({
  activeEvent,
  visibleCount,
  totalCandles,
  isPlaying,
  pulseKey,
  compact = false,
}) {
  const badge = getEventBadge(activeEvent);
  const badgeClass = BADGE_STYLES[badge] ?? BADGE_STYLES.Watching;

  return (
    <div
      className={`rounded-xl bg-zinc-900/80 border transition-shadow duration-300 ${compact ? "p-3" : "p-4"} ${
        pulseKey ? "border-green-500/40 shadow-[0_0_12px_rgba(34,197,94,0.15)]" : "border-zinc-800"
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Volume2 size={compact ? 12 : 14} className="text-green-500 flex-shrink-0" />
          <span className="text-zinc-300 text-xs font-bold uppercase tracking-wide">
            Agent Commentary
          </span>
          {isPlaying && (
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          )}
        </div>
        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeClass}`}
        >
          {badge}
        </span>
      </div>

      {activeEvent ? (
        <>
          <h4 className={`text-white font-bold ${compact ? "text-sm" : "text-base"} leading-tight mb-1`}>
            {activeEvent.title}
          </h4>
          <p className={`text-zinc-400 leading-snug ${compact ? "text-xs" : "text-sm"}`}>
            {activeEvent.message}
          </p>
        </>
      ) : (
        <p className="text-zinc-500 text-xs">Waiting for replay data…</p>
      )}

      <div className="mt-2 pt-2 border-t border-zinc-800/80 flex justify-between text-[10px] font-mono text-zinc-500">
        <span>Candle index {Math.max(0, visibleCount - 1)}</span>
        <span>
          {visibleCount} / {totalCandles}
        </span>
      </div>
    </div>
  );
}
