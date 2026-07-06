import { useState, useEffect, useRef } from "react"
import { useStore } from "../store/useStore"

/* ── Constants ── */
const TECHNICIANS = [
  "Ravi Kumar", "Priya Sharma", "Arun Patel",
  "Deepak Nair", "Anita Singh", "Vikram Rao",
]

const PRIORITY_GRADIENT = {
  critical: { bar: "linear-gradient(180deg, #ef4444 0%, #b91c1c 100%)", badge: "bg-red-500/20 border-red-500/40 text-red-200", glow: "rgba(239,68,68,0.2)", text: "text-red-300", ring: "ring-red-500/20" },
  high:     { bar: "linear-gradient(180deg, #f97316 0%, #c2410c 100%)", badge: "bg-orange-500/20 border-orange-500/40 text-orange-200", glow: "rgba(249,115,22,0.15)", text: "text-orange-300", ring: "ring-orange-500/20" },
}

const STATUS_PILL = {
  open:       "bg-amber-400/15 border-amber-400/30 text-amber-300",
  dispatched: "bg-blue-400/15 border-blue-400/30 text-blue-300",
  resolved:   "bg-green-400/15 border-green-400/30 text-green-300",
}

/* ── Utilities ── */
function timeAgo(ts) {
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60000)
  if (m < 1)  return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function initials(name) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase()
}

/* ── Animated counter hook ── */
function useAnimatedCount(target) {
  const [display, setDisplay] = useState(target)
  const prev = useRef(target)
  useEffect(() => {
    if (prev.current === target) return
    const diff = target - prev.current
    const steps = 20
    let i = 0
    const id = setInterval(() => {
      i++
      setDisplay(Math.round(prev.current + diff * (i / steps)))
      if (i >= steps) { setDisplay(target); clearInterval(id) }
    }, 18)
    prev.current = target
    return () => clearInterval(id)
  }, [target])
  return display
}

/* ── Summary card ── */
function SummaryCard({ label, count, color, bg, active, onClick }) {
  const animated = useAnimatedCount(count)
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center py-3 rounded-xl border transition-all duration-200 ${bg} ${active ? "ring-2 ring-white/20 scale-[1.03]" : "opacity-80 hover:opacity-100 hover:scale-[1.01]"}`}
    >
      <span className={`text-[22px] font-black font-mono leading-none ${color} tabular-nums`}>{animated}</span>
      <span className={`text-[8.5px] font-bold uppercase tracking-widest mt-1 ${color} opacity-80`}>{label}</span>
    </button>
  )
}

/* ── Work order card ── */
function WorkOrderCard({ wo }) {
  const dispatch = useStore(s => s.dispatchWorkOrder)
  const resolve  = useStore(s => s.resolveWorkOrder)
  const [expanded, setExpanded] = useState(false)
  const [pickTech, setPickTech] = useState(false)

  const pr = PRIORITY_GRADIENT[wo.priority] || PRIORITY_GRADIENT.high
  const isOpen       = wo.status === "open"
  const isDispatched = wo.status === "dispatched"
  const isResolved   = wo.status === "resolved"

  return (
    <div
      className={`rounded-2xl overflow-hidden transition-all duration-300 ${isResolved ? "opacity-75" : ""}`}
      style={{
        background: "rgba(10,14,26,0.8)",
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: expanded ? `0 0 32px ${pr.glow}, 0 4px 24px rgba(0,0,0,0.5)` : "0 2px 12px rgba(0,0,0,0.3)",
      }}
    >
      {/* Gradient left border */}
      <div className="flex">
        <div className="w-1 flex-shrink-0 rounded-l-2xl" style={{ background: pr.bar }} />

        <div className="flex-1 min-w-0">
          {/* Card header — clickable */}
          <button onClick={() => setExpanded(v => !v)} className="w-full text-left px-4 pt-3.5 pb-3">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0 flex-1">
                {/* Priority + status badges */}
                <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                  <span className={`text-[8.5px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border ${pr.badge}`}>
                    {wo.priority}
                  </span>
                  <span className={`text-[8.5px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border ${STATUS_PILL[wo.status]}`}>
                    {wo.status}
                  </span>
                  {isResolved && (
                    <svg className="w-4 h-4 text-green-400 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  )}
                </div>
                {/* Machine name */}
                <div className="text-white font-black text-[13.5px] leading-snug">{wo.machine_name}</div>
                <div className="text-slate-600 text-[10px] font-mono mt-0.5">{wo.id}</div>
              </div>

              {/* Risk % */}
              <div className="text-right flex-shrink-0">
                <div className={`text-[20px] font-black font-mono leading-none ${wo.failure_probability > 60 ? "text-red-400" : "text-amber-400"}`}>
                  {wo.failure_probability?.toFixed(0)}%
                </div>
                <div className="text-[8.5px] text-slate-500 mt-0.5">risk</div>
              </div>
            </div>

            {/* Failure mode chips */}
            <div className="flex flex-wrap gap-1 mb-2.5">
              {wo.failure_modes.map(fm => (
                <span key={fm} className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-slate-400">
                  {fm}
                </span>
              ))}
            </div>

            {/* Bottom row: metrics + chevron */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0 text-[10px]">
                <span className="text-slate-500">
                  <span className="text-slate-400 font-semibold">{wo.estimated_downtime?.toFixed(1)}h</span> downtime
                </span>
                <span className="text-slate-700">•</span>
                <span className="text-slate-500">
                  <span className="text-red-400 font-semibold">₹{((wo.financial_loss || 0) / 1000).toFixed(0)}k</span> exposure
                </span>
              </div>
              <div className="flex items-center gap-1 text-slate-600 text-[10px]">
                <span>{timeAgo(wo.created_at)}</span>
                <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                </svg>
              </div>
            </div>
          </button>

          {/* Expanded details */}
          {expanded && (
            <div className="px-4 pb-4 space-y-3 border-t border-white/[0.05] pt-3">

              {/* Impact grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-black/40 rounded-xl p-2.5 border border-white/[0.04]">
                  <div className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Downtime Est.</div>
                  <div className="text-[15px] font-black font-mono text-white">{wo.estimated_downtime?.toFixed(1)} hrs</div>
                </div>
                <div className="bg-black/40 rounded-xl p-2.5 border border-white/[0.04]">
                  <div className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Financial Risk</div>
                  <div className="text-[15px] font-black font-mono text-red-300">₹{(wo.financial_loss || 0).toLocaleString()}</div>
                </div>
              </div>

              {/* Spare parts */}
              <div>
                <div className="text-[9px] text-slate-500 font-black uppercase tracking-[0.18em] mb-2">Required Spare Parts</div>
                <div className="flex flex-wrap gap-1.5">
                  {wo.spare_parts.map(sp => (
                    <span key={sp} className="text-[10px] px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 font-semibold">
                      {sp}
                    </span>
                  ))}
                </div>
              </div>

              {/* AI Recommendation */}
              {wo.recommendation && (
                <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3"
                     style={{ boxShadow: "0 0 12px rgba(139,92,246,0.07)" }}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <svg className="w-3 h-3 text-violet-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                    <span className="text-[8.5px] text-violet-400 font-black uppercase tracking-widest">AI Recommendation</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{wo.recommendation}</p>
                </div>
              )}

              {/* Dispatched technician */}
              {isDispatched && wo.technician && (
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0 text-blue-300 font-black text-[11px]">
                    {initials(wo.technician)}
                  </div>
                  <div>
                    <div className="text-[11px] text-white font-bold">{wo.technician}</div>
                    <div className="text-[9.5px] text-slate-500">Dispatched {timeAgo(wo.dispatched_at)}</div>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2">
                {isOpen && !pickTech && (
                  <button
                    onClick={() => setPickTech(true)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider bg-blue-500/15 border border-blue-500/35 text-blue-200 hover:bg-blue-500/25 transition-all"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                    Dispatch Technician
                  </button>
                )}

                {isOpen && pickTech && (
                  <div className="flex-1 space-y-2.5">
                    <div className="text-[9px] text-slate-500 font-black uppercase tracking-[0.18em]">— Select Technician —</div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {TECHNICIANS.map(t => (
                        <button
                          key={t}
                          onClick={() => { dispatch(wo.id, t); setPickTech(false) }}
                          className="flex items-center gap-2 py-2 px-3 rounded-xl text-left bg-white/[0.03] border border-white/[0.08] text-slate-300 hover:bg-blue-500/10 hover:border-blue-500/30 hover:text-blue-200 transition-all group"
                        >
                          <div className="w-6 h-6 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center flex-shrink-0 text-[9px] font-black text-slate-400 group-hover:bg-blue-500/20 group-hover:border-blue-500/40 group-hover:text-blue-300 transition-all">
                            {initials(t)}
                          </div>
                          <span className="text-[10px] font-semibold truncate">{t}</span>
                        </button>
                      ))}
                    </div>
                    <button onClick={() => setPickTech(false)} className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors">
                      ✕ Cancel
                    </button>
                  </div>
                )}

                {isDispatched && (
                  <button
                    onClick={() => resolve(wo.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider bg-green-500/15 border border-green-500/35 text-green-200 hover:bg-green-500/25 transition-all"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                    </svg>
                    Mark as Resolved
                  </button>
                )}

                {isResolved && (
                  <div className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider bg-green-500/5 border border-green-500/20 text-green-400">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    Resolved {timeAgo(wo.resolved_at)}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Empty state ── */
function EmptyState({ filter }) {
  return (
    <div className="flex flex-col items-center py-12 text-center">
      <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4"
           style={{ boxShadow: "0 0 24px rgba(0,0,0,0.4)" }}>
        <svg className="w-7 h-7 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
        </svg>
      </div>
      <div className="text-[13px] font-bold text-slate-500 mb-1">
        {filter === "all" ? "No Work Orders" : `No ${filter} orders`}
      </div>
      <p className="text-[11px] text-slate-600 leading-relaxed max-w-[200px]">
        {filter === "all"
          ? "Work orders are auto-generated when a machine enters High Risk or Critical status."
          : `All caught up — no ${filter} work orders right now.`}
      </p>
    </div>
  )
}

/* ── Main Panel ── */
export function WorkOrderPanel({ machineId }) {
  const workOrders = useStore(s => s.workOrders)
  const [filter, setFilter] = useState("all")

  const relevant = machineId
    ? workOrders.filter(wo => wo.machine_id === machineId)
    : workOrders

  const filtered = filter === "all"
    ? relevant
    : relevant.filter(wo => wo.status === filter)

  const openCount       = relevant.filter(wo => wo.status === "open").length
  const dispatchedCount = relevant.filter(wo => wo.status === "dispatched").length
  const resolvedCount   = relevant.filter(wo => wo.status === "resolved").length

  const hasOpen = openCount > 0

  return (
    <div className="p-4 space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center gap-2.5 pb-3 border-b border-white/[0.06]">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 relative"
             style={{
               background: "linear-gradient(135deg, rgba(245,158,11,0.2), rgba(234,88,12,0.15))",
               border: "1px solid rgba(245,158,11,0.3)",
               boxShadow: hasOpen ? "0 0 20px rgba(245,158,11,0.2)" : "none",
             }}>
          <svg className={`w-4 h-4 ${hasOpen ? "text-amber-400" : "text-amber-600"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
          </svg>
          {hasOpen && (
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border border-[#060a12] animate-pulse" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-black uppercase tracking-widest text-amber-300">CMMS Work Orders</div>
          <div className="text-[9.5px] text-slate-500 mt-0.5">Auto-generated on fault detection</div>
        </div>
        {hasOpen && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/15 border border-red-500/30">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            <span className="text-[10px] font-black text-red-300">{openCount} OPEN</span>
          </div>
        )}
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-3 gap-2">
        <SummaryCard
          label="Open" count={openCount}
          color="text-amber-300" bg="bg-amber-400/10 border-amber-400/20 border"
          active={filter === "open"} onClick={() => setFilter(filter === "open" ? "all" : "open")}
        />
        <SummaryCard
          label="Dispatched" count={dispatchedCount}
          color="text-blue-300" bg="bg-blue-400/10 border-blue-400/20 border"
          active={filter === "dispatched"} onClick={() => setFilter(filter === "dispatched" ? "all" : "dispatched")}
        />
        <SummaryCard
          label="Resolved" count={resolvedCount}
          color="text-green-300" bg="bg-green-500/10 border-green-500/20 border"
          active={filter === "resolved"} onClick={() => setFilter(filter === "resolved" ? "all" : "resolved")}
        />
      </div>

      {/* ── Filter hint ── */}
      {filter !== "all" && (
        <div className="flex items-center justify-between px-2">
          <span className="text-[9px] text-slate-600 uppercase tracking-widest">Showing: {filter}</span>
          <button onClick={() => setFilter("all")} className="text-[9px] text-slate-500 hover:text-white transition-colors">
            ✕ Clear filter
          </button>
        </div>
      )}

      {/* ── Empty state or cards ── */}
      {filtered.length === 0
        ? <EmptyState filter={filter} />
        : (
          <div className="space-y-3">
            {filtered.map(wo => <WorkOrderCard key={wo.id} wo={wo} />)}
          </div>
        )
      }
    </div>
  )
}
