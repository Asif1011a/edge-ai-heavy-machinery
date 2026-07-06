import { useStore } from "../store/useStore"
import { MACHINES } from "../data/machines"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, LineChart, Line, CartesianGrid } from "recharts"

const STATUS_COLOR = { Healthy:"#4ade80", Warning:"#fbbf24", "High Risk":"#f97316", Critical:"#ef4444" }
const STATUS_BG    = { Healthy:"bg-green-400", Warning:"bg-amber-400", "High Risk":"bg-orange-500", Critical:"bg-red-500" }

const CT = ({ active, payload }) => active && payload?.length ? (
  <div className="bg-[#090e1e]/95 border border-white/10 rounded-lg px-2 py-1.5">
    <span className="text-white font-mono font-bold text-[11px]">{typeof payload[0]?.value === 'number' ? payload[0].value.toFixed(1) : payload[0]?.value}</span>
  </div>
) : null

export function FleetAnalytics({ open }) {
  const machineData = useStore(s => s.machineData)
  const getSummary  = useStore(s => s.getSummary)
  const sensorHistory = useStore(s => s.sensorHistory)

  if (!open) return null

  const s = getSummary()
  const allData = MACHINES.map(m => ({ ...m, data: machineData[m.id] || {} }))

  // Health bar data
  const healthData = allData.map(m => ({
    name: m.id,
    health: parseFloat((m.data.health_score || 0).toFixed(1)),
    risk: parseFloat((m.data.failure_probability || 0).toFixed(1)),
    color: STATUS_COLOR[m.data.status] || STATUS_COLOR.Healthy
  }))

  // Energy data
  const energyData = allData.map(m => ({
    name: m.id,
    kw: parseFloat((m.data.energy_consumption || 0).toFixed(2))
  }))

  // Fleet radar
  const radarData = [
    { subject: "Health",  value: parseFloat(s.avgHealth.toFixed(1)) },
    { subject: "Avail.",  value: parseFloat(s.availability) },
    { subject: "OEE",     value: parseFloat(s.oee) },
    { subject: "Output",  value: Math.min(s.totalOutput / 10, 100) },
    { subject: "Energy",  value: Math.max(0, 100 - (s.totalEnergy / 2)) },
    { subject: "Safety",  value: Math.max(0, 100 - (s.critical * 20 + s.highRisk * 10)) },
  ]

  return (
    <div className="h-[320px] border-t border-white/[0.05] bg-[#060a10] flex-shrink-0 overflow-hidden slide-up">
      <div className="flex items-stretch h-full">

        {/* KPI cards column */}
        <div className="flex-shrink-0 w-[220px] border-r border-white/[0.05] p-4 flex flex-col gap-3 overflow-y-auto">
          <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Fleet Summary</div>
          {[
            { label: "OEE",          value: `${s.oee}%`,             color: "text-blue-400"   },
            { label: "Availability", value: `${s.availability}%`,    color: "text-cyan-400"   },
            { label: "Avg Health",   value: `${s.avgHealth.toFixed(1)}%`, color: "text-green-400" },
            { label: "Total Output", value: s.totalOutput.toLocaleString()+" u", color: "text-white" },
            { label: "Total Energy", value: `${s.totalEnergy.toFixed(1)} kW`, color: "text-indigo-300" },
            { label: "CO₂",          value: `${s.carbonEmissions.toFixed(1)} kg/hr`, color: "text-orange-300" },
            { label: "Fin. Risk",    value: `₹${(s.predictedLoss/1000).toFixed(0)}k`, color: s.predictedLoss > 10000 ? "text-red-400" : "text-slate-300" },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500">{label}</span>
              <span className={`text-[13px] font-black font-mono ${color}`}>{value}</span>
            </div>
          ))}
        </div>

        {/* Health chart */}
        <div className="flex-1 border-r border-white/[0.05] p-4 min-w-0">
          <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-3">Machine Health Scores</div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={healthData} margin={{ top: 0, left: -10, right: 0, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 9 }} angle={-45} textAnchor="end" interval={0} />
                <YAxis domain={[0, 100]} tick={{ fill: '#475569', fontSize: 9 }} />
                <Tooltip content={<CT />} />
                <Bar dataKey="health" radius={[3, 3, 0, 0]} maxBarSize={28}>
                  {healthData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Energy chart */}
        <div className="flex-1 border-r border-white/[0.05] p-4 min-w-0">
          <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-3">Energy Consumption (kW)</div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={energyData} margin={{ top: 0, left: -10, right: 0, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 9 }} angle={-45} textAnchor="end" interval={0} />
                <YAxis tick={{ fill: '#475569', fontSize: 9 }} />
                <Tooltip content={<CT />} />
                <Bar dataKey="kw" fill="#6366f1" radius={[3, 3, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Radar chart */}
        <div className="flex-shrink-0 w-[240px] p-4">
          <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-3">Fleet Performance Index</div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                <PolarGrid stroke="rgba(255,255,255,0.06)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 9, fontWeight: 700 }} />
                <Radar dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={1.5} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  )
}
