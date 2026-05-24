import { useState, useEffect, useRef } from "react";
import {
  Heart, MessageCircle, Share2, Bookmark, Music2,
  ChevronRight, X, TrendingUp, TrendingDown,
  BarChart2, Info, Zap, DollarSign, ArrowRight,
  CheckCircle, Sparkles, Volume2, Play, ChevronUp,
  AlertCircle, Star, Send
} from "lucide-react";

// ─── Tiny sparkline SVG ──────────────────────────────────────────────────────
function Sparkline({ data, color = "#22c55e", width = 80, height = 32, yMin, yMax }) {
  const min = yMin ?? Math.min(...data);
  const max = yMax ?? Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Candlestick Chart ────────────────────────────────────────────────────────
function CandlestickChart({ activeTooltip, onTermClick }) {
  const candles = [
    { o: 68, h: 72, l: 65, c: 70 }, { o: 70, h: 75, l: 69, c: 73 },
    { o: 73, h: 74, l: 68, c: 69 }, { o: 69, h: 71, l: 64, c: 65 },
    { o: 65, h: 68, l: 63, c: 67 }, { o: 67, h: 72, l: 66, c: 71 },
    { o: 71, h: 76, l: 70, c: 75 }, { o: 75, h: 78, l: 72, c: 74 },
    { o: 74, h: 77, l: 71, c: 76 }, { o: 76, h: 82, l: 75, c: 80 },
    { o: 80, h: 83, l: 78, c: 79 }, { o: 79, h: 81, l: 75, c: 77 },
    { o: 77, h: 80, l: 74, c: 78 }, { o: 78, h: 84, l: 77, c: 83 },
    { o: 83, h: 87, l: 81, c: 86 }, { o: 86, h: 88, l: 82, c: 84 },
  ];
  const minP = 60, maxP = 92, range = maxP - minP;
  const W = 560, H = 200, pad = 10;
  const toY = (v) => pad + ((maxP - v) / range) * (H - pad * 2);
  const candleW = (W / candles.length) * 0.5;

  // MA line
  const maData = candles.map((c, i) => {
    const slice = candles.slice(Math.max(0, i - 4), i + 1);
    return slice.reduce((s, x) => s + x.c, 0) / slice.length;
  });
  const maPath = maData.map((v, i) => {
    const x = (i / (candles.length - 1)) * (W - pad * 2) + pad + candleW / 2;
    return `${i === 0 ? "M" : "L"} ${x} ${toY(v)}`;
  }).join(" ");

  const supportY = toY(67);
  const resistY = toY(83);

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 200 }}>
        {/* Support line */}
        <line x1={pad} y1={supportY} x2={W - pad} y2={supportY}
          stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="6,4" opacity="0.7" />
        <text x={W - pad - 4} y={supportY - 4} fill="#a78bfa" fontSize="9" textAnchor="end" opacity="0.9">Support</text>
        {/* Resistance line */}
        <line x1={pad} y1={resistY} x2={W - pad} y2={resistY}
          stroke="#f472b6" strokeWidth="1.5" strokeDasharray="6,4" opacity="0.7" />
        <text x={W - pad - 4} y={resistY - 4} fill="#f472b6" fontSize="9" textAnchor="end" opacity="0.9">Resistance</text>
        {/* MA line */}
        <path d={maPath} fill="none" stroke="#fbbf24" strokeWidth="1.5" opacity="0.8" />
        {/* Candles */}
        {candles.map((c, i) => {
          const x = (i / (candles.length - 1)) * (W - pad * 2) + pad;
          const bullish = c.c >= c.o;
          const color = bullish ? "#22c55e" : "#ef4444";
          const bodyTop = toY(Math.max(c.o, c.c));
          const bodyBot = toY(Math.min(c.o, c.c));
          const bodyH = Math.max(2, bodyBot - bodyTop);
          return (
            <g key={i}>
              <line x1={x + candleW / 2} y1={toY(c.h)} x2={x + candleW / 2} y2={toY(c.l)}
                stroke={color} strokeWidth="1.5" />
              <rect x={x} y={bodyTop} width={candleW} height={bodyH}
                fill={color} rx="1" opacity="0.9" />
            </g>
          );
        })}
      </svg>

      {/* Interactive term pills */}
      <div className="flex flex-wrap gap-2 mt-3">
        {[
          { id: "rsi", label: "RSI 58", color: "text-yellow-400 border-yellow-400/40 bg-yellow-400/10" },
          { id: "ma", label: "MA Cross ↑", color: "text-amber-300 border-amber-300/40 bg-amber-300/10" },
          { id: "volume", label: "Vol 2.4M", color: "text-blue-400 border-blue-400/40 bg-blue-400/10" },
          { id: "support", label: "Support $67", color: "text-purple-400 border-purple-400/40 bg-purple-400/10" },
          { id: "dividend", label: "Div 3.2%", color: "text-green-400 border-green-400/40 bg-green-400/10" },
        ].map((term) => (
          <button
            key={term.id}
            onClick={() => onTermClick(term.id)}
            className={`text-xs px-3 py-1 rounded-full border font-mono font-semibold transition-all duration-200 hover:scale-105 ${term.color} ${activeTooltip === term.id ? "ring-2 ring-white/30 scale-105" : ""}`}
          >
            {term.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Tooltip definitions ──────────────────────────────────────────────────────
const TOOLTIPS = {
  rsi: {
    title: "RSI (Relative Strength Index)",
    emoji: "📊",
    gen_z: "Basically a vibe check for a stock. RSI tells you if a stock is getting too hyped (overbought) or being slept on (oversold). Under 30? Everyone gave up. Over 70? Everyone's overcapping. 58 means it's still got room to run fr.",
    value: "RSI: 58 — Neutral / Slightly Bullish",
  },
  ma: {
    title: "Moving Average",
    emoji: "📈",
    gen_z: "Think of it as the stock's average mood over time. When the price crosses above its 50-day MA going up? That's when traders start paying attention and FOMO kicks in. This one just did that. No cap.",
    value: "50-Day MA: $74.20 (Price crossed above ↑)",
  },
  volume: {
    title: "Volume",
    emoji: "👀",
    gen_z: "How many people are actually paying attention to this stock rn. High volume = the group chat is blowing up about it. Low volume = it's posting to 3 followers. Always check volume before trusting a move.",
    value: "Volume: 2.4M shares (Avg: 1.8M)",
  },
  support: {
    title: "Support Level",
    emoji: "🛡️",
    gen_z: "The floor the stock refuses to fall through — like when a song keeps going viral no matter how many times people say it's mid. $67 has bounced 3 times. Traders treat it like a safety net when buying.",
    value: "Support: $67.00 — Tested 3× in 60 days",
  },
  dividend: {
    title: "Dividend",
    emoji: "💸",
    gen_z: "Free money just for holding the stock. The company literally pays you quarterly just for existing as a shareholder. 3.2% yield means for every $1,000 you hold, they send you $32/year. It's passive income and it hits different.",
    value: "Dividend Yield: 3.2% — $0.48/share quarterly",
  },
};

// ─── AI Chat Messages by vibe ─────────────────────────────────────────────────
const AI_MESSAGES = {
  confident: [
    { role: "ai", text: "You've got this. Let's run the numbers and move fast. 🚀" },
    { role: "ai", text: "This stock just crossed its 50-day moving average going up — that's usually when traders start paying attention. The momentum is real." },
    { role: "ai", text: "Volume's above average. That means conviction behind this move. Not just noise." },
  ],
  nervous: [
    { role: "ai", text: "Totally normal to feel nervous — every investor started exactly where you are 😊" },
    { role: "ai", text: "Here's the thing: that orange line is the Moving Average. When the stock price crosses above it, it's like the market saying 'okay, we're taking this seriously now.'" },
    { role: "ai", text: "You don't need to understand everything. Focus on one signal at a time. Tap any pill below the chart to decode it." },
  ],
  clueless: [
    { role: "ai", text: "Okay bestie, no judgment — we're starting from zero and that's actually the best place to start 💀" },
    { role: "ai", text: "See that chart? Each candle = one day. Green = price went UP that day. Red = price went DOWN. That's literally all you need to know first." },
    { role: "ai", text: "That purple dotted line at the bottom? That's a 'support level' — basically the price the stock keeps bouncing off of. Tap it 👇" },
  ],
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ScotiaDecoded() {
  const BASE_BALANCE = 640;
  const BASE_DAYS = 45;
  const MONTHLY_SITTING_RATE = 0.0000234375;
  const ANNUAL_TFSA_RETURN = 0.07;
  const HORIZON_OPTIONS = [
    { id: "3m", label: "3M", months: 3 },
    { id: "1y", label: "1Y", months: 12 },
    { id: "5y", label: "5Y", months: 60 },
  ];

  const [step, setStep] = useState(1);
  const [vibe, setVibe] = useState(null);
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [captionIdx, setCaptionIdx] = useState(0);
  const [aiTyping, setAiTyping] = useState(false);
  const [reelMuted, setReelMuted] = useState(true);
  const [moveAmount, setMoveAmount] = useState(100);
  const [horizon, setHorizon] = useState("1y");
  const chatRef = useRef(null);

  const CAPTIONS = [
    { tag: "💰 TFSA Cheat Code", text: "Your TFSA is literally a cheat code that nobody told us about... bestie 💀 tax-free growth on EVERYTHING" },
    { tag: "📈 Investing 101", text: "POV: You finally understand what a stock actually is and why everyone's obsessed 👀" },
    { tag: "🏦 Scotia Tips", text: "This one bank feature has been sitting in your app and you've never touched it... we need to talk 🚨" },
  ];

  // Rotate captions on reel screen
  useEffect(() => {
    if (step !== 1) return;
    const t = setInterval(() => setCaptionIdx(i => (i + 1) % CAPTIONS.length), 3500);
    return () => clearInterval(t);
  }, [step]);

  // Drip AI messages on dashboard
  useEffect(() => {
    if (step !== 4 || !vibe) return;
    const msgs = (AI_MESSAGES[vibe] || []).filter(m => m && typeof m.text === 'string');
    setChatMessages([]);
    setAiTyping(true);
    let idx = 0;
    let cancelled = false;
    const timers = [];
    const drip = () => {
      if (cancelled) return;
      if (idx >= msgs.length) { setAiTyping(false); return; }
      const msg = msgs[idx];
      if (msg) setChatMessages(prev => [...prev, msg]);
      idx++;
      const t = setTimeout(drip, 1800);
      timers.push(t);
    };
    const t = setTimeout(drip, 600);
    timers.push(t);
    return () => { cancelled = true; timers.forEach(clearTimeout); };
  }, [step, vibe]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [chatMessages]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 4000);
  };

  const goTo = (s) => {
    if (s === 4 && !vibe) setVibe("nervous");
    setChatMessages([]);
    setStep(s);
  };

  const handleVibeSelect = (v) => {
    setVibe(v);
    setStep(3);
  };

  const SCREENS = [
    { id: 1, label: "Reel Feed" },
    { id: 2, label: "Vibe Check" },
    { id: 3, label: "Your Number" },
    { id: 4, label: "Decoded" },
    { id: 5, label: "First Move" },
  ];

  const selectedHorizon = HORIZON_OPTIONS.find((h) => h.id === horizon) || HORIZON_OPTIONS[1];
  const months = selectedHorizon.months;
  const moveGrowth = Math.pow(1 + ANNUAL_TFSA_RETURN, months / 12);
  const sittingGrowth = 1 + MONTHLY_SITTING_RATE * months;
  const tfsaValue = moveAmount * moveGrowth;
  const sittingValue = moveAmount * sittingGrowth;
  const opportunityValue = Math.max(0, tfsaValue - sittingValue);
  const annualizedSitting = BASE_BALANCE * (Math.pow(1 + MONTHLY_SITTING_RATE, 12) - 1);
  const opportunityPct = sittingValue > 0 ? ((opportunityValue / sittingValue) * 100) : 0;
  const tfsaSparkline = [0, 1, 2, 3, 4, 5, 6].map((i) => moveAmount * Math.pow(moveGrowth, i / 6));
  const sittingSparkline = [0, 1, 2, 3, 4, 5, 6].map((i) => moveAmount * (1 + (sittingGrowth - 1) * (i / 6)));
  const sparklineMin = Math.min(...sittingSparkline, ...tfsaSparkline);
  const sparklineMax = Math.max(...sittingSparkline, ...tfsaSparkline);
  const formatMoney = (n) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-start font-sans">
      {/* ── Header ── */}
      <div className="w-full max-w-6xl px-4 pt-6 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">Scotia <span className="text-red-500">Decoded</span></span>
        </div>
        <div className="text-xs text-zinc-500 font-mono">PROTOTYPE v1.0 — PITCH MODE</div>
      </div>

      {/* ── Main Canvas ── */}
      <div className="w-full max-w-6xl px-4 py-4 flex gap-6 items-start justify-center">

        {/* Mobile Phone Frame */}
        <div className="relative flex-shrink-0" style={{ width: 340 }}>
          <div className="relative rounded-[44px] bg-zinc-900 shadow-2xl shadow-red-900/20 border border-zinc-800 overflow-hidden" style={{ width: 340, minHeight: 680 }}>
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-zinc-950 rounded-b-2xl z-30 flex items-center justify-center gap-1">
              <div className="w-2 h-2 rounded-full bg-zinc-700" />
              <div className="w-10 h-1.5 rounded-full bg-zinc-800" />
            </div>

            {/* ── STEP 1: Reel Feed ── */}
            {step === 1 && (
              <div className="relative w-full h-full bg-black flex flex-col" style={{ minHeight: 680 }}>
                <video
                  className="absolute inset-0 z-0 w-full h-full object-cover"
                  src="/PROMO REEL.mp4"
                  autoPlay
                  loop
                  muted={reelMuted}
                  playsInline
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/75 z-0" />

                {/* Status bar */}
                <div className="relative z-10 flex justify-between items-center px-6 pt-10 pb-2 text-white text-xs font-semibold">
                  <span>9:41</span><span className="flex gap-1 items-center">●●● 5G 🔋</span>
                </div>

                {/* Side engagement */}
                <div className="absolute right-3 bottom-44 z-20 flex flex-col items-center gap-5">
                  {[
                    { Icon: Heart, val: "48.2K", color: "text-red-400" },
                    { Icon: MessageCircle, val: "3.1K", color: "text-white" },
                    { Icon: Share2, val: "9.8K", color: "text-white" },
                    { Icon: Bookmark, val: "12K", color: "text-white" },
                  ].map(({ Icon, val, color }, i) => (
                    <div key={i} className="flex flex-col items-center gap-0.5">
                      <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center">
                        <Icon size={18} className={color} />
                      </div>
                      <span className="text-white text-xs font-bold">{val}</span>
                    </div>
                  ))}
                  <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden bg-gradient-to-br from-red-500 to-purple-600 flex items-center justify-center">
                    <Music2 size={14} className="text-white" />
                  </div>
                </div>

                {/* Creator + caption */}
                <div className="absolute bottom-32 left-4 right-16 z-20 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-orange-400 flex items-center justify-center text-white font-bold text-sm">S</div>
                    <div>
                      <div className="text-white font-bold text-sm">@scotiabank</div>
                      <div className="text-zinc-300 text-xs">Financial literacy for real life 💸</div>
                    </div>
                    <button className="ml-2 text-xs border border-white/60 text-white rounded-full px-3 py-0.5 font-semibold">Follow</button>
                  </div>
                  <div className="space-y-0.5 transition-all duration-500">
                    <span className="inline-block bg-purple-500/30 text-purple-200 text-xs font-bold px-2 py-0.5 rounded-full border border-purple-400/40">
                      {CAPTIONS[captionIdx].tag}
                    </span>
                    <p className="text-white text-sm font-medium leading-snug drop-shadow-lg">
                      {CAPTIONS[captionIdx].text}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-400 text-xs">
                    <Music2 size={12} />
                    <span className="truncate">Money Moves — Scotia Originals 🎵</span>
                    <button
                      onClick={() => setReelMuted((m) => !m)}
                      className="ml-auto rounded-md border border-white/20 px-2 py-0.5 text-[10px] font-bold text-white bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      {reelMuted ? "Tap for sound" : "Sound on"}
                    </button>
                  </div>
                </div>

                {/* CTA Button */}
                <div className="absolute bottom-12 left-4 right-4 z-30">
                  <button
                    onClick={() => setStep(2)}
                    className="w-full py-4 rounded-2xl bg-red-600 text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-red-600/40 animate-pulse hover:animate-none hover:bg-red-500 transition-all duration-300 active:scale-95"
                  >
                    Open in Scotia App <ArrowRight size={18} />
                  </button>
                </div>

                {/* Nav bar */}
                <div className="absolute bottom-0 left-0 right-0 h-10 bg-black/60 backdrop-blur flex justify-around items-center px-4 text-zinc-500 text-xs z-20">
                  <span>🏠</span><span>🔍</span><span className="text-white text-lg font-bold">＋</span><span>📬</span><span>👤</span>
                </div>
              </div>
            )}

            {/* ── STEP 2: Vibe Check ── */}
            {step === 2 && (
              <div className="flex flex-col px-6 pt-16 pb-8 h-full min-h-[680px] bg-white">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center"><Zap size={14} className="text-white" /></div>
                  <span className="text-zinc-800 font-bold text-sm tracking-tight">iTRADE <span className="text-red-600">Decoded</span></span>
                </div>
                <div className="mb-2">
                  <span className="text-xs font-bold text-red-500 uppercase tracking-widest">Step 1 of 4 · Personalization</span>
                </div>
                <h2 className="text-2xl font-black text-zinc-900 leading-tight mb-2">
                  How are you feeling about investing <span className="text-red-600 italic">rn?</span>
                </h2>
                

                <div className="space-y-3">
                  {[
                    { id: "confident", emoji: "😤", label: "Ready to go, just show me how", sub: "Let's get straight to the moves", border: "border-red-200 hover:border-red-500", accent: "bg-red-50" },
                    { id: "nervous", emoji: "🤔", label: "I get the basics but I'm nervous", sub: "I've heard terms, not sure what they mean", border: "border-yellow-200 hover:border-yellow-500", accent: "bg-yellow-50" },
                    { id: "clueless", emoji: "😅", label: "I literally have no idea what I'm doing", sub: "Start from scratch, no cap", border: "border-blue-200 hover:border-blue-500", accent: "bg-blue-50" },
                  ].map(card => (
                    <button
                      key={card.id}
                      onClick={() => handleVibeSelect(card.id)}
                      className={`w-full rounded-2xl border-2 p-4 ${card.border} ${card.accent} text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] group`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{card.emoji}</span>
                        <div>
                          <div className="text-zinc-900 font-bold text-sm">{card.label}</div>
                          <div className="text-zinc-500 text-xs mt-0.5">{card.sub}</div>
                        </div>
                        <ChevronRight size={16} className="ml-auto text-zinc-300 group-hover:text-zinc-600 mt-1 transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-auto pt-6">
                  <div className="flex justify-center gap-1.5">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === 1 ? "w-8 bg-red-500" : "w-3 bg-zinc-200"}`} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 3: Your Number ── */}
            {step === 3 && (
              <div className="flex flex-col px-5 pt-16 pb-6 h-full min-h-[680px] bg-zinc-50">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center"><Zap size={14} className="text-white" /></div>
                  <span className="text-zinc-800 font-bold text-sm">iTRADE <span className="text-red-600">Decoded</span></span>
                </div>
                <div className="mb-2">
                  <span className="text-xs font-bold text-red-500 uppercase tracking-widest">Step 2 of 4 · Your Money</span>
                </div>
          
                <p className="text-sm text-zinc-600 mb-4 leading-relaxed">
                  You've got <span className="font-black text-zinc-900">{formatMoney(BASE_BALANCE)}</span> in your chequing that's been sitting for <span className="font-black text-zinc-900">{BASE_DAYS} days</span>. Here's what happens if it keeps sitting vs if you move <span className="font-black text-zinc-900">{formatMoney(moveAmount)}</span> of it.
                </p>

                <div className="rounded-2xl bg-white border-2 border-zinc-200 p-3 mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs uppercase font-bold tracking-widest text-zinc-500">Move Amount</span>
                    <span className="text-sm font-black text-zinc-900">{formatMoney(moveAmount)}</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max={BASE_BALANCE}
                    step="10"
                    value={moveAmount}
                    onChange={(e) => setMoveAmount(Number(e.target.value))}
                    className="w-full accent-red-600"
                  />
                  <div className="flex justify-between text-[11px] text-zinc-400 font-mono mt-1">
                    <span>$50</span><span>{formatMoney(BASE_BALANCE)}</span>
                  </div>
                </div>

                <div className="flex gap-2 mb-4">
                  {HORIZON_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setHorizon(option.id)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all duration-200 ${horizon === option.id ? "bg-red-600 text-white border-red-600" : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400"}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  {/* Sitting card */}
                  <div className="rounded-2xl bg-white border-2 border-zinc-200 p-3">
                    <div className="text-xs font-bold text-zinc-400 uppercase mb-1">😴 Sitting</div>
                    <div className="text-2xl font-black text-zinc-800 transition-all duration-500">{formatMoney(sittingValue)}</div>
                    <div className="text-xs text-zinc-500 mt-0.5">if parked for {selectedHorizon.label}</div>
                    <div className="mt-3">
                      <Sparkline data={sittingSparkline} color="#a1a1aa" yMin={sparklineMin} yMax={sparklineMax} />
                    </div>
                    <div className="mt-1 text-xs text-zinc-400 font-mono">~{formatMoney(annualizedSitting)}/yr interest 💀</div>
                  </div>
                  {/* Moving card */}
                  <div className="rounded-2xl bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-300 p-3">
                    <div className="text-xs font-bold text-red-500 uppercase mb-1">🚀 TFSA Move</div>
                    <div className="text-2xl font-black text-red-600 transition-all duration-500">{formatMoney(tfsaValue)}</div>
                    <div className="text-xs text-zinc-500 mt-0.5">{formatMoney(moveAmount)} → in {selectedHorizon.label}</div>
                    <div className="mt-3">
                      <Sparkline data={tfsaSparkline} color="#ec1c24" yMin={sparklineMin} yMax={sparklineMax} />
                    </div>
                    <div className="mt-1 text-xs text-red-500 font-mono font-bold">+{formatMoney(opportunityValue)} tax-free edge ✅</div>
                  </div>
                </div>

                <div className="rounded-2xl bg-zinc-900 p-3 mb-4">
                  <div className="flex items-start gap-2">
                    <Sparkles size={16} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                    <p className="text-zinc-200 text-xs leading-relaxed">
                      In {selectedHorizon.label}, this is <span className="text-yellow-300 font-bold">{opportunityPct.toFixed(0)}% more growth</span> than doing nothing. And it compounds every year. 🔥
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => { if (!vibe) setVibe("nervous"); setStep(4); }}
                  className="w-full py-3.5 rounded-2xl bg-red-600 text-white font-bold text-base flex items-center justify-center gap-2 hover:bg-red-500 transition-all duration-300 active:scale-95 shadow-lg shadow-red-600/30"
                >
                  Show me the full picture <ChevronRight size={18} />
                </button>

                <div className="flex justify-center gap-1.5 mt-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i <= 2 ? "w-8 bg-red-500" : "w-3 bg-zinc-200"}`} />
                  ))}
                </div>
              </div>
            )}

            {/* ── STEP 4: Decoded Dashboard ── */}
            {step === 4 && (
              <div className="flex flex-col h-full min-h-[680px] bg-zinc-950">
                {/* Header */}
                <div className="px-5 pt-14 pb-2 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">iTRADE Decoded</div>
                    <div className="text-white font-black text-lg">RY.TO <span className="text-green-400 text-sm font-bold">▲ +2.3%</span></div>
                  </div>
                  <div className="text-right">
                    <div className="text-zinc-400 text-xs">Current Price</div>
                    <div className="text-white font-black text-xl">$86.42</div>
                  </div>
                </div>

                {/* Chart area */}
                <div className="px-4 pb-2">
                  <CandlestickChart activeTooltip={activeTooltip} onTermClick={(id) => setActiveTooltip(activeTooltip === id ? null : id)} />
                </div>

                {/* Tooltip popover */}
                {activeTooltip && TOOLTIPS[activeTooltip] && (
                  <div className="mx-4 mb-3 rounded-2xl bg-zinc-800 border border-zinc-700 p-4 relative">
                    <button onClick={() => setActiveTooltip(null)} className="absolute top-3 right-3 text-zinc-500 hover:text-white"><X size={14} /></button>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{TOOLTIPS[activeTooltip].emoji}</span>
                      <span className="text-white font-bold text-sm">{TOOLTIPS[activeTooltip].title}</span>
                    </div>
                    <p className="text-zinc-300 text-xs leading-relaxed mb-2">{TOOLTIPS[activeTooltip].gen_z}</p>
                    <div className="text-xs font-mono text-yellow-400 bg-yellow-400/10 rounded-lg px-3 py-1.5">{TOOLTIPS[activeTooltip].value}</div>
                  </div>
                )}

                {/* AI Chat strip */}
                <div className="mx-4 mb-3 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col" style={{ maxHeight: 170 }}>
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800">
                    <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center"><Sparkles size={10} className="text-white" /></div>
                    <span className="text-zinc-300 text-xs font-bold">Scotia AI Guide</span>
                    {aiTyping && <div className="ml-auto flex gap-1"><span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: "0ms" }} /><span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: "150ms" }} /><span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: "300ms" }} /></div>}
                  </div>
                  <div ref={chatRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-2 scrollbar-hide">
                    {chatMessages.filter(msg => msg && msg.text).map((msg, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-red-600/80 flex-shrink-0 flex items-center justify-center mt-0.5"><Sparkles size={8} className="text-white" /></div>
                        <p className="text-zinc-300 text-xs leading-relaxed">{msg.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="px-4 pb-3 mt-auto">
                  <button
                    onClick={() => setStep(5)}
                    className="w-full py-3 rounded-2xl bg-red-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-500 transition-all duration-300 active:scale-95"
                  >
                    Ready to make a move? <ArrowRight size={16} />
                  </button>
                </div>

                <div className="flex justify-center gap-1.5 pb-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i <= 3 ? "w-8 bg-red-500" : "w-3 bg-zinc-700"}`} />
                  ))}
                </div>
              </div>
            )}

            {/* ── STEP 5: First Move ── */}
            {step === 5 && (
              <div className="flex flex-col px-5 pt-16 pb-8 h-full min-h-[680px] bg-zinc-50">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center"><Zap size={14} className="text-white" /></div>
                  <span className="text-zinc-800 font-bold text-sm">iTRADE <span className="text-red-600">Decoded</span></span>
                </div>
                <div className="mb-2">
                  <span className="text-xs font-bold text-red-500 uppercase tracking-widest">Step 4 of 4 · Your First Move</span>
                </div>
                <h2 className="text-2xl font-black text-zinc-900 leading-tight mb-2">
                  Ready to actually <span className="text-red-600 italic">do this?</span> 🎯
                </h2>
                <p className="text-zinc-600 text-sm mb-6 leading-relaxed">
                  Ready to make your first trade or want to practice with fake money first? No pressure — both count as progress.
                </p>

                <div className="space-y-3 mb-6">
                  <button
                    onClick={() => { showToast("🎉 Success! $10,000 fake cash credited to your Paper Trading account!"); }}
                    className="w-full rounded-2xl bg-zinc-900 border-2 border-zinc-700 hover:border-zinc-500 p-5 text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] group"
                  >
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-2xl">🎮</span>
                      <span className="text-white font-black text-base">Practice with Paper Trading</span>
                    </div>
                    <p className="text-zinc-400 text-xs ml-10">Start with $10,000 fake money. Zero risk, real market data. Learn by doing, no cap.</p>
                    <div className="ml-10 mt-2 text-xs text-green-400 font-bold">✓ Recommended for beginners</div>
                  </button>

                  <button
                    onClick={() => { showToast("✅ Order placed! Bought 1 share of RY.TO at $86.42. Confirmation sent to your email."); }}
                    className="w-full rounded-2xl bg-red-600 border-2 border-red-600 hover:bg-red-500 p-5 text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] group"
                  >
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-2xl">⚡</span>
                      <span className="text-white font-black text-base">Execute Real Trade</span>
                    </div>
                    <p className="text-red-200 text-xs ml-10">Buy 1 share of RY.TO · $86.42 · Commission-free on iTRADE</p>
                  </button>
                </div>

                <div className="rounded-2xl bg-gradient-to-r from-zinc-900 to-zinc-800 p-4 flex items-start gap-3">
                  <Star size={18} className="text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="text-zinc-300 text-xs leading-relaxed">
                    <span className="text-white font-bold">You've unlocked Investor Level 1. 🏆</span><br />
                    Scotia Decoded adapts as you grow. Your AI guide will be here every step of the way.
                  </p>
                </div>

                <div className="flex justify-center gap-1.5 mt-auto pt-6">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-1.5 w-8 rounded-full bg-red-500" />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Phone shadow */}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-48 h-6 bg-red-600/20 blur-2xl rounded-full" />
        </div>

        {/* ── Info Panel (desktop companion) ── */}
        <div className="flex-1 max-w-sm space-y-4 hidden md:flex md:flex-col">
          {/* Current step info */}
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-red-600 flex items-center justify-center text-white font-black text-sm">{step}</div>
              <div>
                <div className="text-zinc-400 text-xs uppercase tracking-widest font-bold">Current Screen</div>
                <div className="text-white font-bold text-sm">{SCREENS.find(s => s.id === step)?.label}</div>
              </div>
            </div>
            <div className="text-zinc-500 text-xs leading-relaxed">
              {step === 1 && "Social media reel with rotating captions and pulsing CTA button. Simulates organic Gen Z discovery."}
              {step === 2 && "Vibe Check onboarding — selecting a card personalizes the AI Guide's tone across the entire journey."}
              {step === 3 && "Hyper-personalized insight using real account data. Side-by-side comparison shows concrete opportunity cost."}
              {step === 4 && "Decoded Dashboard with interactive financial term pills. Tap any pill for a Gen Z translation. AI chat updates based on selected vibe."}
              {step === 5 && "Decision point with two clear paths. Paper trading lowers the barrier to entry with zero risk."}
            </div>
          </div>

          {/* Funnel indicators */}
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
            <div className="text-zinc-400 text-xs uppercase tracking-widest font-bold mb-3">Full Funnel</div>
            <div className="space-y-2">
              {[
                { id: 1, label: "Discovery", sub: "Reel Feed", icon: "📱" },
                { id: 2, label: "Personalization", sub: "Vibe Check", icon: "🎯" },
                { id: 3, label: "Insight", sub: "Your Number", icon: "💡" },
                { id: 4, label: "Education", sub: "Decoded Mode", icon: "📊" },
                { id: 5, label: "Conversion", sub: "First Move", icon: "🚀" },
              ].map(s => (
                <div key={s.id} onClick={() => goTo(s.id)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 cursor-pointer transition-all duration-200 ${step === s.id ? "bg-red-600/20 border border-red-500/40" : "hover:bg-zinc-800"}`}>
                  <span className="text-base">{s.icon}</span>
                  <div className="flex-1">
                    <div className={`text-xs font-bold ${step === s.id ? "text-red-400" : "text-zinc-400"}`}>{s.label}</div>
                    <div className={`text-xs ${step === s.id ? "text-zinc-200" : "text-zinc-600"}`}>{s.sub}</div>
                  </div>
                  {step === s.id && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                  {step > s.id && <CheckCircle size={14} className="text-green-500" />}
                </div>
              ))}
            </div>
          </div>

          {/* Vibe indicator */}
          {vibe && (
            <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4">
              <div className="text-zinc-400 text-xs uppercase tracking-widest font-bold mb-2">User Vibe</div>
              <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${vibe === "confident" ? "bg-red-500/20 text-red-300" : vibe === "nervous" ? "bg-yellow-500/20 text-yellow-300" : "bg-blue-500/20 text-blue-300"}`}>
                {vibe === "confident" && "😤"} {vibe === "nervous" && "🤔"} {vibe === "clueless" && "😅"}
                {vibe === "confident" ? "Ready to go" : vibe === "nervous" ? "Nervous but curious" : "Starting from zero"}
              </div>
              <p className="text-zinc-500 text-xs mt-2">AI Guide tone is calibrated to this persona throughout.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Pitch Controller ── */}
      <div className="w-full max-w-6xl px-4 pb-8">
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Play size={14} className="text-red-500" />
            <span className="text-zinc-300 text-xs font-bold uppercase tracking-widest">Pitch Deck Controller</span>
            <span className="text-zinc-600 text-xs ml-auto">Jump to any screen instantly</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {SCREENS.map(s => (
              <button
                key={s.id}
                onClick={() => goTo(s.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${step === s.id ? "bg-red-600 text-white shadow-lg shadow-red-600/30" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"}`}
              >
                {s.id}. {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Toast Notification ── */}
      <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ${toastVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}>
        <div className="flex items-center gap-3 bg-zinc-900 border border-green-500/40 rounded-2xl px-5 py-3.5 shadow-2xl shadow-green-900/30 max-w-sm">
          <CheckCircle size={18} className="text-green-400 flex-shrink-0" />
          <p className="text-white text-sm font-semibold">{toastMsg}</p>
        </div>
      </div>
    </div>
  );
}
