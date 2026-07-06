import { useStore } from "../store/useStore"
import { MACHINES } from "../data/machines"
import { SimulationPanel } from "./SimulationPanel"
import { WorkOrderPanel } from "./WorkOrderPanel"
import {
  ResponsiveContainer, AreaChart, Area, YAxis, Tooltip,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  BarChart, Bar, CartesianGrid
} from "recharts"

// ─── STATUS COLOURS ───────────────────────────────────────────────────────────
const STATUS_STYLE = {
  Healthy:    { bg: "bg-green-400",  text: "text-green-400",  color: "#4ade80", border: "border-green-500/30"  },
  Warning:    { bg: "bg-amber-400",  text: "text-amber-400",  color: "#fbbf24", border: "border-amber-400/30"  },
  "High Risk":{ bg: "bg-orange-500", text: "text-orange-400", color: "#f97316", border: "border-orange-500/30" },
  Critical:   { bg: "bg-red-500",    text: "text-red-400",    color: "#ef4444", border: "border-red-500/30"    },
}

// ─── SHARED CHART TOOLTIP ─────────────────────────────────────────────────────
const ChartTip = ({ active, payload }) =>
  active && payload?.length ? (
    <div className="bg-[#090e1e]/95 border border-white/10 rounded-lg px-2.5 py-1.5">
      <span className="text-white font-mono font-bold text-[11px]">
        {typeof payload[0]?.value === "number" ? payload[0].value.toFixed(1) : payload[0]?.value}
      </span>
    </div>
  ) : null

// ─── MINI AREA CHART ──────────────────────────────────────────────────────────
function MiniChart({ data, dataKey, color, label, val, unit }) {
  return (
    <div className="bg-white/[0.025] rounded-xl p-3 border border-white/[0.05]">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[12px] font-semibold text-slate-300">{label}</span>
        <div className="flex items-baseline gap-1">
          <span className="text-[16px] font-black font-mono text-white">{val}</span>
          <span className="text-[10px] text-slate-400 font-bold">{unit}</span>
        </div>
      </div>
      <div className="h-10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 2, left: 0, right: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`g-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={color} stopOpacity={0.35} />
                <stop offset="95%" stopColor={color} stopOpacity={0}    />
              </linearGradient>
            </defs>
            <YAxis domain={["auto","auto"]} hide />
            <Tooltip content={<ChartTip />} />
            <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={1.8}
              fillOpacity={1} fill={`url(#g-${dataKey})`} isAnimationActive={false} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ─── METRIC ROW (used in all tabs) ───────────────────────────────────────────
function MetricRow({ label, value, unit, status }) {
  const col = status === "crit" ? "text-red-400" : status === "warn" ? "text-amber-400" : "text-slate-200"
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/[0.05] last:border-0">
      <span className="text-[12px] text-slate-400 font-medium">{label}</span>
      <div className="flex items-center gap-1.5">
        {status && (
          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
            status === "crit" ? "bg-red-500 alert-pulse" : status === "warn" ? "bg-amber-400" : "bg-green-400"
          }`} />
        )}
        <span className={`text-[13px] font-mono font-bold ${col}`}>{value}</span>
        {unit && <span className="text-[11px] text-slate-500 ml-0.5">{unit}</span>}
      </div>
    </div>
  )
}

// ─── TAB ICONS (SVG — no emoji) ───────────────────────────────────────────────
const IconData = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
  </svg>
)
const IconWrench = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
  </svg>
)
const IconChart = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
  </svg>
)
const IconInfo = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
  </svg>
)
const IconSim = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
  </svg>
)
const IconOrders = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
  </svg>
)

// ─── AI HUB INFO TAB ──────────────────────────────────────────────────────────
function AIHubTab({ data }) {
  const machineData = useStore(s => s.machineData)
  const allData     = Object.values(machineData)
  const critical    = allData.filter(d => d.status === "Critical").length
  const highRisk    = allData.filter(d => d.status === "High Risk").length
  const avgHealth   = (allData.reduce((s, d) => s + (d.health_score || 0), 0) / Math.max(allData.length, 1)).toFixed(1)

  const responsibilities = [
    {
      title: "Real-time Machine Monitoring",
      desc:  "Collects sensor data — speed, torque, temperature, and tool wear — from all 11 machines every few seconds.",
      path:  "M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z",
    },
    {
      title: "Predictive AI Failure Detection",
      desc:  "Runs machine-learning models on live data to calculate failure probability and predict breakdowns before they happen.",
      path:  "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
    },
    {
      title: "Command and Control",
      desc:  "Sends production targets, speed adjustments, and maintenance alerts to all CNC machines, robots, and conveyor belts.",
      path:  "M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    },
    {
      title: "Energy Optimization",
      desc:  "Balances power distribution across the entire factory floor to reduce electricity consumption and CO2 emissions.",
      path:  "M13 10V3L4 14h7v7l9-11h-7z",
    },
  ]

  return (
    <div className="p-4 space-y-5">
      {/* What is it */}
      <div className="rounded-xl border border-blue-500/25 bg-blue-500/5 p-4">
        <div className="flex items-center gap-2 mb-2.5">
          <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span className="text-[11px] text-blue-300 font-black uppercase tracking-widest">What is the AI Control Hub?</span>
        </div>
        <p className="text-[13px] text-slate-300 leading-relaxed">
          The <span className="text-white font-bold">AI Control Hub</span> is the central brain of the factory.
          It is a server rack system that continuously collects sensor data from every machine,
          runs AI models to detect early failure signs, and sends real-time commands to all equipment.
          Think of it as the factory's nervous system.
        </p>
      </div>

      {/* Responsibilities */}
      <div>
        <div className="text-[11px] text-slate-400 font-black uppercase tracking-widest mb-3">Core Responsibilities</div>
        <div className="space-y-2">
          {responsibilities.map(({ title, desc, path }) => (
            <div key={title} className="flex gap-3 p-3 rounded-xl bg-white/[0.025] border border-white/[0.05]">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={path}/>
                </svg>
              </div>
              <div>
                <div className="text-[12px] font-bold text-white mb-0.5">{title}</div>
                <div className="text-[11px] text-slate-400 leading-relaxed">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live fleet overview */}
      <div>
        <div className="text-[11px] text-slate-400 font-black uppercase tracking-widest mb-2">Current Fleet Status</div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Machines Monitored",  value: allData.length - 1, color: "text-white"   },
            { label: "Avg. Fleet Health",   value: `${avgHealth}%`,    color: parseFloat(avgHealth) > 75 ? "text-green-400" : "text-amber-400" },
            { label: "Critical Alerts",     value: critical,           color: critical > 0   ? "text-red-400"    : "text-green-400" },
            { label: "High-Risk Machines",  value: highRisk,           color: highRisk > 0   ? "text-orange-400" : "text-green-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-black/30 rounded-xl p-3 border border-white/[0.05]">
              <div className="text-[11px] text-slate-500 mb-1">{label}</div>
              <div className={`text-[20px] font-black font-mono ${color}`}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Hub own health */}
      <div>
        <div className="text-[11px] text-slate-400 font-black uppercase tracking-widest mb-2">Hub System Health</div>
        <div className="bg-black/20 rounded-xl px-3 border border-white/[0.05]">
          <MetricRow label="System Health"      value={`${data.health_score?.toFixed(0)}%`}
            status={data.health_score < 70 ? "crit" : data.health_score < 85 ? "warn" : null}/>
          <MetricRow label="Failure Probability" value={`${data.failure_probability?.toFixed(1)}%`}
            status={data.failure_probability > 60 ? "crit" : data.failure_probability > 30 ? "warn" : null}/>
          <MetricRow label="Processing Load"    value={`${data.machine_load?.toFixed(1)}%`}/>
          <MetricRow label="Power Consumption"  value={`${data.energy_consumption?.toFixed(1)}`} unit="kW"/>
        </div>
      </div>
    </div>
  )
}

// ─── TELEMETRY TAB ────────────────────────────────────────────────────────────
function TelemetryTab({ machine, data, history }) {
  const st = STATUS_STYLE[data.status] || STATUS_STYLE.Healthy
  const circ    = 2 * Math.PI * 36
  const dashOff = circ * (1 - (data.health_score / 100))

  const tempDelta  = ((data.process_temperature||308.5) - (data.air_temperature||298.5)).toFixed(1)
  const rpmStatus  = data.rotational_speed > 2300 || data.rotational_speed < 1250 ? "crit" : data.rotational_speed > 2000 ? "warn" : null
  const torqStatus = data.torque > 58 ? "crit" : data.torque > 48 ? "warn" : null
  const wearStatus = data.tool_wear > 200 ? "crit" : data.tool_wear > 150 ? "warn" : null
  const tempStatus = parseFloat(tempDelta) > 12 ? "crit" : parseFloat(tempDelta) > 10 ? "warn" : null

  return (
    <div>
      {/* Health ring + quick bars */}
      <div className="p-4 border-b border-white/[0.05]">
        <div className="flex items-center gap-4">
          <div className="relative w-[84px] h-[84px] flex-shrink-0">
            <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
              <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="7"/>
              <circle cx="40" cy="40" r="36" fill="none" stroke={st.color} strokeWidth="7"
                strokeDasharray={circ} strokeDashoffset={dashOff} strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)", filter:`drop-shadow(0 0 6px ${st.color}80)` }}/>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-white font-black text-[22px] leading-none">{data.health_score?.toFixed(0)}</span>
              <span className="text-slate-500 text-[9px] font-bold tracking-widest">HEALTH</span>
            </div>
          </div>

          <div className="flex-1 space-y-2.5">
            {[
              { label:"Failure Risk",  val:`${data.failure_probability?.toFixed(1)}%`,  pct:data.failure_probability,
                bar: data.failure_probability>60?"bg-red-500":data.failure_probability>30?"bg-amber-400":"bg-green-400",
                tc:  data.failure_probability>60?"text-red-400":data.failure_probability>30?"text-amber-400":"text-green-400" },
              { label:"Machine Load",  val:`${data.machine_load?.toFixed(1)}%`,          pct:data.machine_load, bar:"bg-blue-400",   tc:"text-blue-300"   },
              { label:"Energy Draw",   val:`${data.energy_consumption?.toFixed(1)} kW`,  pct:Math.min(data.energy_consumption/22*100,100), bar:"bg-indigo-400", tc:"text-indigo-300" },
            ].map(({ label, val, pct, bar, tc }) => (
              <div key={label}>
                <div className="flex justify-between mb-1">
                  <span className="text-[11px] text-slate-400 font-semibold">{label}</span>
                  <span className={`text-[12px] font-mono font-black ${tc}`}>{val}</span>
                </div>
                <div className="h-1.5 bg-black/50 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-700 ${bar}`} style={{ width:`${Math.min(pct,100)}%` }}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live telemetry charts */}
      <div className="p-4 border-b border-white/[0.05]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[11px] text-slate-300 font-black uppercase tracking-widest">Live Telemetry</h3>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"/>
            <span className="text-[10px] text-red-400 font-bold tracking-wider">RECORDING</span>
          </div>
        </div>
        <div className="space-y-2">
          <MiniChart data={history} dataKey="rpm"    color="#00f0ff" label="Rotational Speed" val={(data.rotational_speed||1500).toLocaleString()} unit="rpm"/>
          <MiniChart data={history} dataKey="torque" color="#fbbf24" label="Torque"           val={data.torque?.toFixed(1)}  unit="Nm"/>
          <MiniChart data={history} dataKey="wear"   color="#34d399" label="Tool Wear"        val={data.tool_wear||0}         unit="min"/>
        </div>
      </div>

      {/* Sensor parameters table */}
      <div className="p-4 border-b border-white/[0.05]">
        <h3 className="text-[11px] text-slate-300 font-black uppercase tracking-widest mb-2">Sensor Parameters</h3>
        <div className="bg-black/20 rounded-xl px-3 border border-white/[0.05]">
          <MetricRow label="Air Temperature"      value={`${data.air_temperature?.toFixed(1)}`}      unit="K"/>
          <MetricRow label="Process Temperature"  value={`${data.process_temperature?.toFixed(1)}`}  unit={`K  (+${tempDelta}K)`} status={tempStatus}/>
          <MetricRow label="Rotational Speed"     value={(data.rotational_speed||0).toLocaleString()} unit="rpm" status={rpmStatus}/>
          <MetricRow label="Torque"               value={data.torque?.toFixed(1)} unit="Nm"  status={torqStatus}/>
          <MetricRow label="Tool Wear"            value={data.tool_wear||0}       unit="min" status={wearStatus}/>
          <MetricRow label="Production Output"    value={(data.production_output||0).toLocaleString()} unit="units"/>
          <MetricRow label="CO2 Emission"         value={data.carbon_emission?.toFixed(2)} unit="kg/hr"/>
        </div>
      </div>

      {/* Failure flags */}
      <div className="p-4 border-b border-white/[0.05]">
        <h3 className="text-[11px] text-slate-300 font-black uppercase tracking-widest mb-3">Failure Mode Flags</h3>
        <div className="grid grid-cols-5 gap-1.5">
          {[
            ["TWF", data.twf, "Tool Wear Failure"],
            ["HDF", data.hdf, "Heat Dissipation Failure"],
            ["PWF", data.pwf, "Power Failure"],
            ["OSF", data.osf, "Overstrain Failure"],
            ["RNF", data.rnf, "Random Failure"],
          ].map(([label, active, tip]) => (
            <div key={label} title={tip}
              className={`flex flex-col items-center py-2 rounded-xl border transition-all cursor-help
                ${active
                  ? "bg-red-500/10 border-red-500/30 text-red-400"
                  : "bg-white/[0.02] border-white/[0.06] text-slate-500"}`}>
              <span className="text-[10px] font-mono font-bold">{label}</span>
              {active && <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1 alert-pulse"/>}
            </div>
          ))}
        </div>
        <div className="text-[10px] text-slate-600 mt-2 text-center">Hover each badge to see the full failure name</div>
      </div>

      {/* Business impact */}
      <div className="p-4 border-b border-white/[0.05]">
        <h3 className="text-[11px] text-slate-300 font-black uppercase tracking-widest mb-2">Business Impact</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className={`px-3 py-3 rounded-xl border ${data.predicted_downtime > 2 ? "bg-red-500/5 border-red-500/20":"bg-white/[0.02] border-white/[0.05]"}`}>
            <div className="text-[11px] text-slate-500 mb-1">Predicted Downtime</div>
            <div className={`text-[16px] font-black font-mono ${data.predicted_downtime > 2 ? "text-red-400":"text-white"}`}>{data.predicted_downtime?.toFixed(1)} hrs</div>
          </div>
          <div className={`px-3 py-3 rounded-xl border ${data.financial_loss > 10000 ? "bg-red-500/5 border-red-500/20":"bg-white/[0.02] border-white/[0.05]"}`}>
            <div className="text-[11px] text-slate-500 mb-1">Financial Risk</div>
            <div className={`text-[16px] font-black font-mono ${data.financial_loss > 10000 ? "text-red-400":"text-white"}`}>Rs {(data.financial_loss||0).toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* AI recommendation */}
      <div className="p-4">
        <div className="rounded-xl border border-indigo-500/20 overflow-hidden">
          <div className="absolute-0 bg-gradient-to-br from-indigo-600/10 to-blue-600/10 pointer-events-none"/>
          <div className="p-4 bg-indigo-500/5">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
              <span className="text-[11px] text-indigo-400 font-black uppercase tracking-widest">AI Recommendation</span>
            </div>
            <p className="text-[13px] text-slate-300 leading-relaxed">{data.recommendation}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── MAINTENANCE TAB ──────────────────────────────────────────────────────────
function MaintenanceTab({ machine, data }) {
  const schedule     = useStore(s => s.maintenanceSchedule)
  const completeTask = useStore(s => s.completeTask)
  const ms    = schedule.find(s => s.machine_id === machine.id)
  const tasks = ms?.tasks || []
  const now   = Date.now()
  const day   = 86400000

  const priorityStyle = {
    high:   "text-red-300 bg-red-500/10 border-red-500/25",
    medium: "text-amber-300 bg-amber-400/10 border-amber-400/25",
    low:    "text-slate-400 bg-white/[0.04] border-white/10",
  }

  const getDue = (ts) => {
    const diff = ts - now
    if (diff < 0)       return { label: "OVERDUE",   urgent: true  }
    const days = Math.floor(diff / day)
    if (days === 0)     return { label: "Due Today",  urgent: true  }
    if (days === 1)     return { label: "Due Tomorrow",urgent: true  }
    return               { label: `In ${days} days`,  urgent: false }
  }

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-[11px] text-slate-300 font-black uppercase tracking-widest">Maintenance Schedule</h3>
        <span className="text-[12px] text-slate-400 font-semibold">{tasks.filter(t => !t.done).length} tasks pending</span>
      </div>

      {tasks.map(task => {
        const due = getDue(task.due)
        return (
          <div key={task.id}
            className={`rounded-xl border p-3 transition-all duration-200
              ${task.done
                ? "opacity-40 bg-white/[0.01] border-white/[0.04]"
                : "bg-white/[0.03] border-white/[0.07]"}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div
                  onClick={() => !task.done && completeTask(machine.id, task.id)}
                  className={`w-5 h-5 rounded-lg flex-shrink-0 flex items-center justify-center border cursor-pointer transition-all mt-0.5
                    ${task.done
                      ? "bg-green-500/20 border-green-500/40"
                      : "bg-white/5 border-white/15 hover:border-blue-500/50"}`}>
                  {task.done && (
                    <svg className="w-3 h-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
                    </svg>
                  )}
                </div>
                <div>
                  <div className={`text-[13px] font-bold ${task.done ? "line-through text-slate-600" : "text-white"}`}>{task.name}</div>
                  <div className={`text-[11px] font-semibold mt-0.5 ${due.urgent && !task.done ? "text-red-400" : "text-slate-500"}`}>{due.label}</div>
                </div>
              </div>
              <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg border flex-shrink-0 ${priorityStyle[task.priority]}`}>
                {task.priority}
              </span>
            </div>
          </div>
        )
      })}

      <div className="pt-3 border-t border-white/[0.05]">
        <h3 className="text-[11px] text-slate-300 font-black uppercase tracking-widest mb-3">Machine Specifications</h3>
        <div className="bg-black/20 rounded-xl px-3 border border-white/[0.05]">
          <MetricRow label="Machine Type"     value={machine.type.charAt(0).toUpperCase() + machine.type.slice(1)}/>
          <MetricRow label="Serial Number"    value={machine.id}/>
          <MetricRow label="Tool Wear"        value={`${data.tool_wear||0} / 250 min`}
            status={data.tool_wear > 200 ? "crit" : data.tool_wear > 150 ? "warn" : null}/>
          <MetricRow label="Operating Hours"  value={`${3200 + (machine.id.charCodeAt(0)*7) % 800} hrs`}/>
          <MetricRow label="Last Calibration" value="14 days ago"/>
        </div>
      </div>
    </div>
  )
}

// ─── ANALYTICS TAB ────────────────────────────────────────────────────────────
function AnalyticsTab({ machine, data, history }) {
  const radarData = [
    { subject: "Speed",  value: parseFloat(Math.min(((data.rotational_speed||1500)-1000)/1800*100, 100).toFixed(1)) },
    { subject: "Torque", value: parseFloat(Math.min((data.torque||35)/65*100, 100).toFixed(1)) },
    { subject: "Health", value: parseFloat((data.health_score||0).toFixed(1)) },
    { subject: "Wear",   value: parseFloat(Math.min((data.tool_wear||0)/250*100, 100).toFixed(1)) },
    { subject: "Load",   value: parseFloat((data.machine_load||0).toFixed(1)) },
    { subject: "Energy", value: parseFloat(Math.min((data.energy_consumption||12)/22*100, 100).toFixed(1)) },
  ]
  const energyData = history.slice(-15).map((h, i) => ({ t: i, energy: h.energy }))

  return (
    <div className="p-4 space-y-5">
      <div>
        <h3 className="text-[11px] text-slate-300 font-black uppercase tracking-widest mb-3">Performance Profile</h3>
        <div className="h-48 bg-black/20 rounded-xl border border-white/[0.05] overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} margin={{ top:10, right:20, bottom:10, left:20 }}>
              <PolarGrid stroke="rgba(255,255,255,0.07)"/>
              <PolarAngleAxis dataKey="subject" tick={{ fill:"#94a3b8", fontSize:11, fontWeight:700 }}/>
              <Radar dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={1.8}/>
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h3 className="text-[11px] text-slate-300 font-black uppercase tracking-widest mb-2">Energy Trend (kW)</h3>
        <div className="h-28 bg-black/20 rounded-xl border border-white/[0.05] p-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={energyData} margin={{ top:0, left:-20, right:0, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
              <YAxis tick={{ fill:"#475569", fontSize:10 }}/>
              <Tooltip content={<ChartTip />}/>
              <Bar dataKey="energy" fill="#6366f1" radius={[3,3,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h3 className="text-[11px] text-slate-300 font-black uppercase tracking-widest mb-3">Shift Summary</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label:"Production Output", value:`${data.production_output||0} units`,                              color:"text-white"      },
            { label:"Efficiency",        value:`${(85+(data.health_score||80)*0.1).toFixed(1)}%`,                 color:"text-green-400"  },
            { label:"Energy Cost",       value:`Rs ${(data.energy_consumption*8*9.5).toFixed(0)}`,                color:"text-blue-300"   },
            { label:"Defect Rate",       value:`${((data.failure_probability||0)*0.02).toFixed(2)}%`,             color:"text-amber-400"  },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white/[0.02] rounded-xl p-3 border border-white/[0.05]">
              <div className="text-[11px] text-slate-500 mb-1">{label}</div>
              <div className={`text-[15px] font-black font-mono ${color}`}>{value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-4 border-b border-white/[0.06] flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full bg-gradient-to-b from-indigo-400 to-purple-600"/>
          <span className="text-white font-black text-[15px]">Telemetry Detail</span>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
          <svg className="w-7 h-7 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2}
              d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"/>
          </svg>
        </div>
        <p className="text-[13px] text-slate-400 leading-relaxed">
          Select a machine from the left panel or click on any 3D model in the scene to view live telemetry, maintenance tasks, and analytics.
        </p>
      </div>
    </div>
  )
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────
export function HolographicPanel() {
  const selectedId       = useStore(s => s.selectedMachine)
  const machineData      = useStore(s => s.machineData)
  const sensorHistory    = useStore(s => s.sensorHistory)
  const activeRightTab   = useStore(s => s.activeRightTab)
  const setActiveRightTab= useStore(s => s.setActiveRightTab)
  const selectMachine    = useStore(s => s.selectMachine)
  const workOrders       = useStore(s => s.workOrders)

  if (!selectedId) return <EmptyState />

  const machine = MACHINES.find(m => m.id === selectedId)
  const data    = machineData[selectedId]
  const history = sensorHistory[selectedId] || []
  if (!machine || !data) return <EmptyState />

  const st      = STATUS_STYLE[data.status] || STATUS_STYLE.Healthy
  const isHub   = machine.type === "hub"

  const openOrders = workOrders.filter(wo => wo.machine_id === selectedId && wo.status === "open").length

  const TABS = isHub
    ? [
        { id:"hub",         label:"About Hub",   icon:<IconInfo />   },
        { id:"telemetry",   label:"Telemetry",   icon:<IconData />   },
        { id:"maintenance", label:"Maintenance", icon:<IconWrench /> },
      ]
    : [
        { id:"telemetry",   label:"Telemetry",   icon:<IconData />   },
        { id:"maintenance", label:"Maintenance", icon:<IconWrench /> },
        { id:"simulate",    label:"Simulate",    icon:<IconSim />    },
        { id:"workorders",  label:"Orders",      icon:<IconOrders />, badge: openOrders },
      ]

  const activeTab = isHub && (activeRightTab === "analytics" || activeRightTab === "simulate" || activeRightTab === "workorders") ? "hub" : activeRightTab

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      {/* Subtle status glow */}
      <div className={`absolute top-0 left-0 right-0 h-24 opacity-10 blur-3xl pointer-events-none ${st.bg}`}/>

      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.06] relative z-10 flex-shrink-0">
        <div className="flex items-start justify-between mb-2.5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] text-slate-400 font-mono font-bold bg-white/[0.06] px-2 py-0.5 rounded border border-white/10">{machine.id}</span>
              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${st.text} bg-white/[0.05] ${st.border}`}>{data.status}</span>
            </div>
            <div className="text-white font-black text-[18px] leading-tight">{machine.name}</div>
            {isHub && (
              <div className="text-[11px] text-blue-400 font-semibold mt-0.5">
                Central AI System — monitors all factory machines
              </div>
            )}
          </div>
          <button onClick={() => selectMachine(null)}
            className="w-7 h-7 rounded-lg bg-white/[0.06] hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all flex-shrink-0">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1">
          {TABS.map(tab => (
            <button key={tab.id}
              onClick={() => setActiveRightTab(tab.id)}
              className={`relative flex items-center gap-1 px-2 py-2 rounded-xl text-[10px] font-bold transition-all duration-200 flex-1 justify-center
                ${activeTab === tab.id
                  ? "bg-blue-500/15 border border-blue-500/30 text-blue-300"
                  : "text-slate-500 hover:text-slate-300 border border-transparent hover:bg-white/[0.04]"}`}>
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] rounded-full bg-red-500 text-white text-[8px] font-black flex items-center justify-center px-1">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="overflow-y-auto flex-1 relative z-10">
        {activeTab === "hub"         && <AIHubTab        data={data}/>}
        {activeTab === "telemetry"   && <TelemetryTab    machine={machine} data={data} history={history}/>}
        {activeTab === "maintenance" && <MaintenanceTab   machine={machine} data={data}/>}
        {activeTab === "analytics"   && <AnalyticsTab     machine={machine} data={data} history={history}/>}
        {activeTab === "simulate"    && <SimulationPanel  machineData={data}/>}
        {activeTab === "workorders"  && <WorkOrderPanel   machineId={selectedId}/>}
      </div>
    </div>
  )
}
