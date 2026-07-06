import { useState, useCallback, useMemo } from "react"

const API = "http://localhost:8000/simulate"

/* ── helpers ── */
function getRiskLevel(fp) {
  if (fp >= 80) return { label: "CRITICAL",  color: "#ef4444", glow: "rgba(239,68,68,0.35)",  track: "#7f1d1d", text: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/30"    }
  if (fp >= 60) return { label: "HIGH RISK", color: "#f97316", glow: "rgba(249,115,22,0.35)", track: "#7c2d12", text: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30" }
  if (fp >= 35) return { label: "WARNING",   color: "#f59e0b", glow: "rgba(245,158,11,0.35)", track: "#78350f", text: "text-amber-400",  bg: "bg-amber-400/10",  border: "border-amber-400/30"  }
  return          { label: "NOMINAL",    color: "#22d3ee", glow: "rgba(34,211,238,0.30)",  track: "#164e63", text: "text-cyan-400",   bg: "bg-cyan-500/10",   border: "border-cyan-500/30"   }
}

/* ── Circular SVG gauge ── */
function CircularGauge({ value, size = 110 }) {
  const risk = getRiskLevel(value)
  const r = 40, cx = 55, cy = 55
  const circ = 2 * Math.PI * r
  const dash = (value / 100) * circ
  return (
    <svg width={size} height={size} viewBox="0 0 110 110" className="drop-shadow-lg">
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      {/* track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={risk.track} strokeWidth="8"/>
      {/* value arc */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={risk.color}
        strokeWidth="8"
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeDashoffset={circ / 4}
        strokeLinecap="round"
        filter="url(#glow)"
        style={{ transition: "stroke-dasharray 0.6s ease, stroke 0.6s ease" }}
      />
      <text x={cx} y={cy - 4} textAnchor="middle" fill={risk.color} fontSize="17" fontWeight="900" fontFamily="monospace">
        {value.toFixed(1)}%
      </text>
      <text x={cx} y={cy + 13} textAnchor="middle" fill="#64748b" fontSize="7.5" fontWeight="700" letterSpacing="1.5">
        FAILURE RISK
      </text>
    </svg>
  )
}

/* ── HUD Slider ── */
function HudSlider({ label, unit, value, min, max, step = 1, onChange, warn, crit }) {
  const pct = ((value - min) / (max - min)) * 100
  const isCrit = crit && value >= crit
  const isWarn = warn && value >= warn
  const color  = isCrit ? "#ef4444" : isWarn ? "#f59e0b" : "#22d3ee"
  const glow   = isCrit ? "rgba(239,68,68,0.6)" : isWarn ? "rgba(245,158,11,0.5)" : "rgba(34,211,238,0.5)"

  return (
    <div className="group space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.12em] group-hover:text-slate-300 transition-colors">{label}</span>
        <span className="text-[13px] font-mono font-black tabular-nums" style={{ color }}>
          {typeof value === "number" ? value.toLocaleString() : value}
          <span className="text-[10px] text-slate-500 ml-1 font-medium">{unit}</span>
        </span>
      </div>

      {/* HUD track */}
      <div className="relative h-[6px] rounded-full overflow-visible" style={{ background: "rgba(255,255,255,0.05)" }}>
        {/* fill bar */}
        <div
          className="absolute top-0 left-0 h-full rounded-full transition-all duration-150"
          style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${glow}` }}
        />
        {/* warn marker */}
        {warn && (
          <div
            className="absolute top-[-3px] w-[2px] h-[12px] rounded-full opacity-50"
            style={{ left: `${((warn - min) / (max - min)) * 100}%`, background: "#f59e0b" }}
          />
        )}
        {/* crit marker */}
        {crit && (
          <div
            className="absolute top-[-3px] w-[2px] h-[12px] rounded-full opacity-50"
            style={{ left: `${((crit - min) / (max - min)) * 100}%`, background: "#ef4444" }}
          />
        )}
      </div>

      {/* invisible native range on top */}
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ marginTop: "-14px", height: "18px", opacity: 0, position: "relative", zIndex: 10, width: "100%", display: "block", cursor: "pointer" }}
      />
    </div>
  )
}

/* ── Live preview badge ── */
function LivePreview({ airT, procT, rpm, torq, wear }) {
  const tdiff  = procT - airT
  const power  = rpm * torq
  // quick analytical estimate for preview
  let score = 0
  score += Math.min(wear / 250, 1) * 40
  score += Math.max(0, (torq - 40) / 30) * 25
  if (rpm > 2200 || rpm < 1300) score += Math.min(Math.abs(rpm - 1800) / 600, 1) * 20
  score += Math.min(Math.max(tdiff - 8, 0) / 12, 1) * 15
  const fp = Math.min(score, 99.9)
  const risk = getRiskLevel(fp)

  return (
    <div className={`rounded-xl border px-3 py-2.5 flex items-center gap-3 transition-all duration-300 ${risk.bg} ${risk.border}`}>
      <div className="flex-shrink-0">
        <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: risk.color, boxShadow: `0 0 6px ${risk.glow}` }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Live Risk Preview</div>
        <div className="flex items-center gap-2">
          <span className={`text-[12px] font-black font-mono ${risk.text}`}>{fp.toFixed(1)}%</span>
          <span className={`text-[9px] font-black uppercase tracking-wider ${risk.text}`}>{risk.label}</span>
        </div>
      </div>
      <div className="text-[9px] text-slate-600 text-right leading-tight">
        <div>ΔT {tdiff.toFixed(1)} K</div>
        <div>{(power / 1000).toFixed(1)} kNm</div>
      </div>
    </div>
  )
}

/* ── Failure mode chip ── */
function FailureChip({ code, label, active }) {
  const colors = active
    ? "bg-red-500/15 border-red-500/40 text-red-300"
    : "bg-white/[0.03] border-white/[0.06] text-slate-600"
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold transition-all ${colors}`}>
      {active && <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse flex-shrink-0" />}
      <span className="font-mono">{code}</span>
      <span className="opacity-70 hidden sm:inline">{label}</span>
    </div>
  )
}

/* ── Result card ── */
function ResultCard({ result }) {
  const risk = getRiskLevel(result.failure_probability)
  const failureModes = [
    { code: "TWF", label: "Tool Wear",   active: !!result.twf },
    { code: "HDF", label: "Heat Diss.",  active: !!result.hdf },
    { code: "PWF", label: "Power",       active: !!result.pwf },
    { code: "OSF", label: "Overstrain",  active: !!result.osf },
  ]
  const anyActive = failureModes.some(f => f.active)

  return (
    <div className="space-y-3 animate-[fadeSlideUp_0.4s_ease_both]">
      {/* Status banner */}
      <div className={`rounded-xl border px-4 py-2.5 flex items-center gap-3 ${risk.bg} ${risk.border}`}
           style={{ boxShadow: `0 0 24px ${risk.glow}` }}>
        <div className="w-2 h-2 rounded-full flex-shrink-0"
             style={{ background: risk.color, boxShadow: `0 0 8px ${risk.glow}`, animation: result.status === "Critical" ? "pulse 1s infinite" : undefined }} />
        <span className="text-[13px] font-black uppercase tracking-widest flex-1" style={{ color: risk.color }}>{risk.label}</span>
        {result.model_used && (
          <span className="text-[8px] bg-violet-500/20 border border-violet-500/30 text-violet-300 px-2 py-0.5 rounded font-bold tracking-widest">ML MODEL</span>
        )}
      </div>

      {/* Gauge + metrics */}
      <div className="grid grid-cols-[auto_1fr] gap-4 items-center">
        <CircularGauge value={result.failure_probability} />
        <div className="space-y-2.5">
          {[
            { label: "Health Score",  val: `${result.health_score?.toFixed(1)}%`,        color: result.health_score < 50 ? "text-red-400" : result.health_score < 75 ? "text-amber-400" : "text-green-400" },
            { label: "Energy Est.",   val: `${result.energy_estimate_kw?.toFixed(2)} kW`, color: "text-blue-300" },
          ].map(({ label, val, color }) => (
            <div key={label} className="bg-black/30 rounded-xl px-3 py-2">
              <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">{label}</div>
              <div className={`text-[16px] font-black font-mono leading-none ${color}`}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Failure mode chips */}
      <div>
        <div className="text-[9px] text-slate-500 font-black uppercase tracking-[0.15em] mb-2">
          Failure Modes {anyActive ? <span className="text-red-400 ml-1">● DETECTED</span> : <span className="text-slate-600 ml-1">● None Active</span>}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {failureModes.map(f => <FailureChip key={f.code} {...f} />)}
        </div>
      </div>

      {/* AI recommendation */}
      <div className="rounded-xl border border-violet-500/25 bg-violet-500/5 p-3"
           style={{ boxShadow: "0 0 16px rgba(139,92,246,0.08)" }}>
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
          </svg>
          <span className="text-[9px] text-violet-400 font-black uppercase tracking-widest">AI Recommendation</span>
        </div>
        <p className="text-[11.5px] text-slate-300 leading-relaxed">{result.recommendation}</p>
      </div>

      <div className="text-[9px] text-slate-600 text-center tracking-wider">
        ◈ simulation only — live machine data is unaffected ◈
      </div>
    </div>
  )
}

/* ── Main Panel ── */
export function SimulationPanel({ machineData }) {
  const [rpm,   setRpm]   = useState(machineData?.rotational_speed    || 1500)
  const [torq,  setTorq]  = useState(machineData?.torque              || 40)
  const [wear,  setWear]  = useState(machineData?.tool_wear           || 50)
  const [airT,  setAirT]  = useState(machineData?.air_temperature     || 298)
  const [procT, setProcT] = useState(machineData?.process_temperature || 308)

  const [result,  setResult]  = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const runSimulation = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          air_temperature:     airT,
          process_temperature: procT,
          rotational_speed:    rpm,
          torque:              torq,
          tool_wear:           wear,
        }),
      })
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      setResult(await res.json())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [airT, procT, rpm, torq, wear])

  const resetToLive = () => {
    setRpm(machineData?.rotational_speed    || 1500)
    setTorq(machineData?.torque             || 40)
    setWear(machineData?.tool_wear          || 50)
    setAirT(machineData?.air_temperature    || 298)
    setProcT(machineData?.process_temperature || 308)
    setResult(null)
    setError(null)
  }

  return (
    <div className="p-4 space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center gap-2.5 pb-3 border-b border-white/[0.06]">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
             style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(99,102,241,0.15))", border: "1px solid rgba(139,92,246,0.3)", boxShadow: "0 0 16px rgba(139,92,246,0.15)" }}>
          {/* circuit icon */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgb(167,139,250)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="5" height="10" rx="1"/><rect x="17" y="7" width="5" height="10" rx="1"/>
            <path d="M7 12h10M12 7V4M12 20v-3"/><circle cx="12" cy="12" r="2"/>
          </svg>
        </div>
        <div>
          <div className="text-[11px] font-black uppercase tracking-widest" style={{ color: "rgb(167,139,250)" }}>What-If Simulator</div>
          <div className="text-[9.5px] text-slate-500 mt-0.5 tracking-wide">Adjust parameters — AI model predicts outcome</div>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-widest">LIVE</span>
        </div>
      </div>

      {/* ── Live preview ── */}
      <LivePreview airT={airT} procT={procT} rpm={rpm} torq={torq} wear={wear} />

      {/* ── Sliders ── */}
      <div className="space-y-4">
        <div className="text-[8.5px] text-slate-600 font-black uppercase tracking-[0.2em]">— Override Sensor Parameters —</div>

        <HudSlider label="Rotational Speed" unit="rpm" value={rpm}   min={800}  max={2800} onChange={setRpm}   warn={2000} crit={2400} />
        <HudSlider label="Torque"           unit="Nm"  value={torq}  min={5}    max={80}   step={0.5} onChange={setTorq}  warn={48}   crit={62}   />
        <HudSlider label="Tool Wear"        unit="min" value={wear}  min={0}    max={250}  onChange={setWear}  warn={150}  crit={200}  />
        <HudSlider label="Air Temperature"  unit="K"   value={airT}  min={295}  max={308}  step={0.1} onChange={setAirT}  />
        <HudSlider label="Process Temp"     unit="K"   value={procT} min={300}  max={325}  step={0.1} onChange={setProcT} warn={315}  crit={320}  />

        <div className="flex items-center gap-4 pt-0.5">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-[2px] rounded" style={{ background: "#f59e0b", boxShadow: "0 0 4px rgba(245,158,11,0.6)" }} />
            <span className="text-[9px] text-slate-600">warn</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-[2px] rounded" style={{ background: "#ef4444", boxShadow: "0 0 4px rgba(239,68,68,0.6)" }} />
            <span className="text-[9px] text-slate-600">critical</span>
          </div>
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="flex gap-2">
        <button
          onClick={runSimulation}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[12px] font-black uppercase tracking-wider transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: loading ? "rgba(139,92,246,0.1)" : "linear-gradient(135deg, rgba(139,92,246,0.25), rgba(99,102,241,0.2))",
            border: "1px solid rgba(139,92,246,0.4)",
            color: "rgb(196,181,253)",
            boxShadow: loading ? "none" : "0 0 20px rgba(139,92,246,0.15)",
          }}
        >
          {loading ? (
            <>
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={3} strokeDasharray="60" strokeDashoffset="20" />
              </svg>
              Running Model…
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
              Run Simulation
            </>
          )}
        </button>
        <button
          onClick={resetToLive}
          className="px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider text-slate-500 hover:text-white border border-white/[0.07] hover:border-white/20 transition-all hover:bg-white/[0.04]"
        >
          Reset
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2.5 text-[11.5px] text-red-300 flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          {error}
        </div>
      )}

      {/* ── Results ── */}
      {result && !loading && <ResultCard result={result} />}

    </div>
  )
}
