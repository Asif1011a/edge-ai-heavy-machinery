import { useStore } from "../store/useStore"
import { MACHINES } from "../data/machines"

const STATUS_META = {
  Healthy:    { dot:"bg-green-400",  bar:"bg-green-400",  text:"text-green-400",  badge:"bg-green-500/10 border-green-500/30 text-green-300"  },
  Warning:    { dot:"bg-amber-400",  bar:"bg-amber-400",  text:"text-amber-400",  badge:"bg-amber-400/10 border-amber-400/30 text-amber-300"   },
  "High Risk":{ dot:"bg-orange-500", bar:"bg-orange-500", text:"text-orange-400", badge:"bg-orange-500/10 border-orange-500/30 text-orange-300" },
  Critical:   { dot:"bg-red-500",    bar:"bg-red-500",    text:"text-red-400",    badge:"bg-red-500/10 border-red-500/30 text-red-300"          },
}

// Machine-type labels (text, no emoji)
const TYPE_LABEL = {
  cnc:"CNC", robot:"Robot", conveyor:"Conveyor", assembly:"Assembly",
  inspection:"Inspect", packaging:"Packaging", hub:"AI Hub",
}

// Type colour accent
const TYPE_COLOR = {
  cnc:"bg-blue-500", robot:"bg-purple-500", conveyor:"bg-slate-500",
  assembly:"bg-green-600", inspection:"bg-cyan-500", packaging:"bg-orange-500", hub:"bg-indigo-500",
}

export function MachineList() {
  const machineData       = useStore(s => s.machineData)
  const selectedId        = useStore(s => s.selectedMachine)
  const searchFilter      = useStore(s => s.searchFilter)
  const activeRightTab    = useStore(s => s.activeRightTab)
  const selectMachine     = useStore(s => s.selectMachine)
  const setSearchFilter   = useStore(s => s.setSearchFilter)
  const setActiveRightTab = useStore(s => s.setActiveRightTab)

  const countByStatus = (st) => MACHINES.filter(m => machineData[m.id]?.status === st).length

  const filtered = MACHINES.filter(m =>
    m.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    m.id.toLowerCase().includes(searchFilter.toLowerCase()) ||
    (machineData[m.id]?.status || "").toLowerCase().includes(searchFilter.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.06] flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-blue-400 to-indigo-600"/>
            <span className="text-white font-black text-[15px] tracking-tight">Asset Monitor</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono font-bold bg-white/[0.06] px-2 py-1 rounded border border-white/10">
            {MACHINES.length} UNITS
          </span>
        </div>

        {/* Status summary */}
        <div className="grid grid-cols-4 gap-1 mb-3">
          {[
            { label:"OK",   count:countByStatus("Healthy"),   color:"text-green-300",  bg:"bg-green-500/10  border border-green-500/20"  },
            { label:"WARN", count:countByStatus("Warning"),   color:"text-amber-300",  bg:"bg-amber-400/10  border border-amber-400/20"  },
            { label:"RISK", count:countByStatus("High Risk"), color:"text-orange-300", bg:"bg-orange-500/10 border border-orange-500/20" },
            { label:"CRIT", count:countByStatus("Critical"),  color:"text-red-300",    bg:"bg-red-500/10    border border-red-500/20"    },
          ].map(({ label, count, color, bg }) => (
            <div key={label} className={`flex flex-col items-center py-2 rounded-lg ${bg}`}>
              <span className={`text-[18px] font-black leading-none ${color}`}>{count}</span>
              <span className={`text-[9px] font-bold mt-0.5 ${color} opacity-80`}>{label}</span>
            </div>
          ))}
        </div>

        {/* Search box */}
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            type="text"
            placeholder="Search by name, ID, or status..."
            value={searchFilter}
            onChange={e => setSearchFilter(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-lg pl-8 pr-8 py-2.5 text-[13px] text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/60 focus:bg-blue-500/5 transition-all"
          />
          {searchFilter && (
            <button onClick={() => setSearchFilter("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Machine rows */}
      <div className="overflow-y-auto flex-1 px-2 py-2 space-y-1">
        {filtered.length === 0 && (
          <div className="text-center py-10 text-slate-500 text-[13px]">
            No machines match <span className="text-white">"{searchFilter}"</span>
          </div>
        )}

        {filtered.map(m => {
          const d = machineData[m.id]
          if (!d) return null
          const st = STATUS_META[d.status] || STATUS_META.Healthy
          const isSelected = selectedId === m.id

          return (
            <div key={m.id}
              className={`rounded-xl transition-all duration-200 relative
                ${isSelected ? "bg-white/[0.09] ring-1 ring-white/20 shadow-lg" : "hover:bg-white/[0.04]"}`}>

              {/* Coloured left stripe when selected */}
              {isSelected && (
                <div className={`absolute left-0 top-2 bottom-2 w-0.5 rounded-full ${st.dot}`}/>
              )}

              <button
                onClick={() => {
                  selectMachine(isSelected ? null : m.id)
                  if (!isSelected) setActiveRightTab(m.type === "hub" ? "hub" : "telemetry")
                }}
                className="w-full text-left px-4 py-3"
              >
                {/* Row header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Type badge */}
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${TYPE_COLOR[m.type] || "bg-slate-600"} text-white flex-shrink-0`}>
                      {TYPE_LABEL[m.type] || m.type.toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <div className="text-white text-[13px] font-bold truncate leading-snug">{m.name}</div>
                      <div className="text-slate-500 text-[10px] font-mono">{m.id}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className={`w-2 h-2 rounded-full ${st.dot} ${d.status === "Critical" ? "alert-pulse" : ""}`}/>
                    <span className={`text-[13px] font-black font-mono ${st.text}`}>{d.health_score?.toFixed(0)}%</span>
                  </div>
                </div>

                {/* Health bar */}
                <div className="w-full h-[3px] bg-black/50 rounded-full mb-2.5 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-700 ${st.bar}`} style={{ width:`${d.health_score}%` }}/>
                </div>

                {/* Metrics footer */}
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${st.badge}`}>{d.status}</span>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-slate-500 text-[9px] uppercase tracking-wider">RPM</div>
                      <div className="text-slate-200 text-[11px] font-mono font-bold">{(d.rotational_speed||0).toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-slate-500 text-[9px] uppercase tracking-wider">kW</div>
                      <div className="text-slate-200 text-[11px] font-mono font-bold">{d.energy_consumption?.toFixed(1)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-slate-500 text-[9px] uppercase tracking-wider">Risk</div>
                      <div className={`text-[11px] font-mono font-bold ${d.failure_probability > 60 ? "text-red-400" : d.failure_probability > 30 ? "text-amber-400" : "text-slate-300"}`}>{d.failure_probability?.toFixed(0)}%</div>
                    </div>
                  </div>
                </div>
              </button>

              {/* Tab quick-nav */}
              {isSelected && (
                <div className="flex gap-1.5 px-4 pb-3">
                  {(m.type === "hub"
                    ? [["hub","About Hub"],["telemetry","Telemetry"],["maintenance","Maintenance"]]
                    : [["telemetry","Telemetry"],["maintenance","Maintenance"],["analytics","Analytics"]]
                  ).map(([tab, label]) => (
                    <button key={tab}
                      onClick={() => setActiveRightTab(tab)}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all duration-150 border
                        ${activeRightTab === tab
                          ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
                          : "text-slate-500 hover:text-slate-300 border-white/5 hover:border-white/10 hover:bg-white/5"}`}>
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
