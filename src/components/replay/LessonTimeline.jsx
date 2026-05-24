import { Check } from "lucide-react";
import { getTimelineItemState } from "../../scenarios/scalpScenario";

export default function LessonTimeline({ events, visibleCount, activeEvent, compact = false }) {
  return (
    <div className={`rounded-xl bg-zinc-900/60 border border-zinc-800 ${compact ? "p-2.5" : "p-3"}`}>
      <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">
        Lesson Timeline
      </div>
      <ul className={`space-y-0.5 ${compact ? "text-xs" : "text-sm"}`}>
        {events.map((event) => {
          const state = getTimelineItemState(event, visibleCount, activeEvent);
          const label = event.timelineLabel ?? event.title;

          return (
            <li
              key={event.type}
              className={`flex items-center gap-2 rounded-lg px-2 py-1 transition-colors ${
                state === "current"
                  ? "bg-red-600/10 border border-red-500/30 text-white"
                  : state === "completed"
                    ? "text-zinc-400"
                    : "text-zinc-600"
              }`}
            >
              <span className="w-4 flex-shrink-0 text-center font-mono text-[10px]">
                {state === "completed" && (
                  <Check size={12} className="inline text-green-500" />
                )}
                {state === "current" && <span className="text-red-400">→</span>}
                {state === "upcoming" && <span className="text-zinc-600">○</span>}
              </span>
              <span
                className={
                  state === "current"
                    ? "font-semibold text-white"
                    : state === "completed"
                      ? "line-through decoration-zinc-600"
                      : ""
                }
              >
                {label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
