import { useStore } from "../store/useStore"
import { useState, useEffect } from "react"

function FleetDot({ count, label, dot, pulse }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dot} ${pulse && count > 0 ? "alert-pulse" : ""}`} />
      <span className="text-white font-black text-[14px] font-mono leading-none">{count}</span>
      <span className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">{label}</span>
    </div>
  )
}

function KPITile({ label, value, unit, sub, valueColor }) {
  return (
    <div className="flex flex-col justify-center min-w-0 px-3 border-r border-white/[0.06] last:border-0">
      <div className="text-[9px] text-slate-500 font-black uppercase tracking-[0.15em] mb-1 whitespace-nowrap">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className={`text-[18px] font-black font-mono leading-none ${valueColor}`}>{value}</span>
        {unit && <span className="text-[11px] text-slate-400 font-bold">{unit}</span>}
      </div>
      {sub && <div className="text-[9px] text-slate-600 mt-0.5 whitespace-nowrap">{sub}</div>}
    </div>
  )
}

export function AIControlCenter() {
  const getSummary    = useStore(s => s.getSummary)
  const wsStatus      = useStore(s => s.wsStatus)
  const machineData   = useStore(s => s.machineData)
  const ecoMode       = useStore(s => s.ecoMode)
  const toggleEcoMode = useStore(s => s.toggleEcoMode)
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const s        = getSummary()
  const allData  = Object.values(machineData)
  const warning  = allData.filter(d => d.status === "Warning").length
  const highRisk = allData.filter(d => d.status === "High Risk").length

  const availability = (s.healthy + warning) / Math.max(s.total, 1) * 100
  const oee          = (availability * 0.88 * 0.95).toFixed(1)
  const avail        = availability.toFixed(1)
  const avgHealth    = (allData.reduce((a, d) => a + (d.health_score || 0), 0) / Math.max(allData.length, 1)).toFixed(1)
  const totalOutput  = allData.reduce((a, d) => a + (d.production_output || 0), 0)

  const ws = wsStatus === "connected"
    ? { dot: "bg-green-400 animate-pulse", label: "REAL DATA",  sublabel: "ai4i2020 + ML Model", color: "text-green-400", bg: "bg-green-500/10 border-green-500/25" }
    : wsStatus === "simulated"
    ? { dot: "bg-amber-400",               label: "SIMULATED",  sublabel: "Physics model",        color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/25" }
    : { dot: "bg-slate-500",               label: "OFFLINE",    sublabel: "No data",              color: "text-slate-500", bg: "bg-white/5 border-white/10" }

  const oeeColor    = parseFloat(oee) > 75      ? "text-green-400" : parseFloat(oee) > 55      ? "text-amber-400" : "text-red-400"
  const availColor  = availability    > 80       ? "text-cyan-400"  : "text-amber-400"
  const healthColor = parseFloat(avgHealth) > 80 ? "text-green-400" : parseFloat(avgHealth) > 60 ? "text-amber-400" : "text-red-400"
  const riskColor   = s.predictedLoss > 50000    ? "text-red-400"   : s.predictedLoss > 10000   ? "text-amber-400" : "text-green-400"

  return (
    <div className="flex-shrink-0 z-30 bg-[#060a12] border-b border-white/[0.07] shadow-[0_4px_32px_rgba(0,0,0,0.6)]" style={{ height: 64 }}>
      <div className="flex items-stretch h-full">

        {/* BRAND */}
        <div className="flex items-center gap-3 px-5 border-r border-white/[0.07] flex-shrink-0" style={{ minWidth: 186 }}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center shadow-lg flex-shrink-0">
            <svg style={{ width: 18, height: 18 }} className="text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
          </div>
          <div>
            <div className="text-white font-black text-[14px] tracking-wide leading-tight">Tata TwinOS</div>
            <div className="text-slate-500 text-[9px] font-semibold tracking-[0.18em] uppercase mt-0.5">Digital Twin v2.4</div>
          </div>
        </div>

        {/* FLEET STATUS */}
        <div className="flex items-center gap-3 px-5 border-r border-white/[0.07] flex-shrink-0">
          <div className="text-[9px] text-slate-600 font-black uppercase tracking-[0.18em]">Fleet</div>
          <FleetDot count={s.healthy}  label="OK"       dot="bg-green-400"  pulse={false} />
          <FleetDot count={warning}    label="Warn"     dot="bg-amber-400"  pulse={true}  />
          <FleetDot count={highRisk}   label="Risk"     dot="bg-orange-500" pulse={true}  />
          <FleetDot count={s.critical} label="Critical" dot="bg-red-500"    pulse={true}  />
        </div>

        {/* KPI TILES */}
        <div className="flex items-stretch flex-1 min-w-0 overflow-x-auto">
          <KPITile label="OEE"            value={`${oee}%`}                                                      sub="Overall Equipment Eff."           valueColor={oeeColor}         />
          <KPITile label="Availability"   value={`${avail}%`}                                                    sub={`${s.healthy + warning} / ${s.total} machines`} valueColor={availColor}  />
          <KPITile label="Fleet Health"   value={`${avgHealth}%`}                                                sub="Avg. health score"                valueColor={healthColor}      />
          <KPITile label="Output"         value={totalOutput.toLocaleString()}         unit="units"              sub="per shift"                        valueColor="text-indigo-300"  />
          <KPITile label="Energy Draw"    value={s.totalEnergy.toFixed(1)}             unit="kW"                 sub="total consumption"                valueColor="text-blue-300"    />
          <KPITile label="CO2 Emissions"  value={s.carbonEmissions.toFixed(1)}         unit="kg/hr"              sub="factory total"                    valueColor="text-orange-300"  />
          <KPITile label="Financial Risk" value={s.predictedLoss > 0 ? `Rs ${(s.predictedLoss / 1000).toFixed(0)}k` : "Rs 0"} sub="estimated exposure" valueColor={riskColor}        />
        </div>

        {/* ECO-MODE TOGGLE */}
        <div className={`flex items-center gap-2 px-5 border-l border-white/[0.07] flex-shrink-0 transition-all duration-500 ${ecoMode ? "bg-emerald-500/5" : ""}`}>
          <button
            onClick={toggleEcoMode}
            className={`flex items-center gap-2.5 px-4 py-2 rounded-xl border font-black text-[11px] uppercase tracking-wider transition-all duration-300
              ${ecoMode
                ? "bg-emerald-500/20 border-emerald-400/50 text-emerald-300 shadow-[0_0_16px_rgba(52,211,153,0.15)]"
                : "bg-white/[0.04] border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.07]"}`}
          >
            <svg className={`w-4 h-4 flex-shrink-0 ${ecoMode ? "text-emerald-300" : "text-slate-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
            </svg>
            <div className="text-left">
              <div>{ecoMode ? "Eco Active" : "Eco-Mode"}</div>
              {ecoMode && (
                <div className="text-[8px] font-medium text-emerald-400 tracking-widest">
                  -22% Energy / -7% CO₂
                </div>
              )}
            </div>
          </button>
        </div>

        {/* CLOCK + DATA SOURCE */}
        <div className="flex items-center gap-3 px-5 border-l border-white/[0.07] flex-shrink-0">
          <div className="text-right">
            <div className="text-[20px] font-black font-mono text-white leading-tight tabular-nums">
              {time.toLocaleTimeString("en-IN", { hour12: false })}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {time.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} IST
            </div>
          </div>
          <div className={`flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-xl border ${ws.bg} flex-shrink-0 min-w-[84px]`}>
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${ws.dot}`} />
              <span className={`text-[10px] font-black tracking-wider ${ws.color}`}>{ws.label}</span>
            </div>
            <span className="text-[9px] text-slate-600 font-medium text-center leading-tight">{ws.sublabel}</span>
          </div>
        </div>

      </div>
    </div>
  )
}
