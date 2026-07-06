import { useState } from "react"
import { MACHINES } from "./data/machines"
import { useWebSocket } from "./hooks/useWebSocket"
import { useStore } from "./store/useStore"
import { FactoryScene } from "./components/FactoryScene"
import { AIControlCenter } from "./components/AIControlCenter"
import { HolographicPanel } from "./components/HolographicPanel"
import { AlertSystem } from "./components/AlertSystem"
import { MachineList } from "./components/MachineList"
import { EventLog } from "./components/EventLog"
import { FleetAnalytics } from "./components/FleetAnalytics"
import { SceneLegend } from "./components/SceneLegend"

const machineIds = MACHINES.map(m => m.id)

// SVG icons — no emoji
const IcoGlobe = () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth={2}/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>
const IcoCNC   = () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
const IcoWrench= () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
const IcoBrain = () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>

const VIEWS = [
  { id:"overview", label:"Overview",  icon:<IcoGlobe />, cam:{ position:[0, 22, 28], target:[0, 0, 0]    } },
  { id:"cnc",      label:"CNC Zone",  icon:<IcoCNC />,   cam:{ position:[0, 8,  -1], target:[0, 0, -6]  } },
  { id:"assembly", label:"Assembly",  icon:<IcoWrench />,cam:{ position:[0, 8,  12], target:[0, 0,  5]  } },
  { id:"hub",      label:"AI Hub",    icon:<IcoBrain />, cam:{ position:[0, 6,  -6], target:[0, 0, -10] } },
]

const LAYERS = [
  { id:"risk",   label:"Risk Network", color:"bg-orange-400" },
  { id:"energy", label:"Power Flow",   color:"bg-blue-400"   },
  { id:"labels", label:"Labels",       color:"bg-slate-400"  },
  { id:"xray",   label:"X-Ray Mode",   color:"bg-purple-400" },
]

function SectionLabel({ children }) {
  return <div className="text-[10px] text-slate-400 font-black uppercase tracking-[0.18em] mb-2">{children}</div>
}

export default function App() {
  const [targetView,   setTargetView]   = useState(null)
  const [activeViewId, setActiveViewId] = useState("overview")
  const [layers,       setLayers]       = useState({ risk:true, energy:true, labels:true, xray:false })
  const [showEventLog, setShowEventLog] = useState(false)

  const bottomPanelOpen   = useStore(s => s.bottomPanelOpen)
  const toggleBottomPanel = useStore(s => s.toggleBottomPanel)
  const eventLog          = useStore(s => s.eventLog)
  const workOrders        = useStore(s => s.workOrders)
  const selectMachine     = useStore(s => s.selectMachine)
  const openWorkOrders    = workOrders.filter(wo => wo.status === "open").length

  useWebSocket(machineIds)

  const handleViewChange = (view) => {
    selectMachine(null)
    setTargetView(view)
    setActiveViewId(view.id)
  }
  const toggleLayer = (id) => setLayers(p => ({ ...p, [id]: !p[id] }))

  return (
    <div className="w-screen h-screen flex flex-col bg-[#030710] overflow-hidden select-none">

      {/* TOP KPI BAR */}
      <AIControlCenter />

      {/* MAIN 3-PANEL BODY */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* LEFT SIDEBAR */}
        <div className="w-[295px] h-full flex flex-col bg-[#060a12] border-r border-white/[0.07] flex-shrink-0">

          {/* Asset list */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <MachineList />
          </div>

          {/* Camera presets */}
          <div className="flex-shrink-0 border-t border-white/[0.06] px-4 pt-3 pb-2 bg-[#050910]">
            <SectionLabel>Camera Presets</SectionLabel>
            <div className="grid grid-cols-2 gap-1.5">
              {VIEWS.map(v => (
                <button key={v.id} onClick={() => handleViewChange(v)}
                  className={`flex items-center gap-2 py-2.5 px-3 rounded-xl text-[12px] font-bold transition-all duration-200
                    ${activeViewId === v.id
                      ? "bg-indigo-500/20 border border-indigo-400/50 text-white"
                      : "bg-white/[0.03] border border-white/[0.07] text-slate-400 hover:text-white hover:bg-white/[0.06]"}`}>
                  {v.icon}
                  <span>{v.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3D overlay layers */}
          <div className="flex-shrink-0 border-t border-white/[0.06] px-4 pt-3 pb-2 bg-[#050910]">
            <SectionLabel>3D Overlay Layers</SectionLabel>
            <div className="grid grid-cols-2 gap-1.5">
              {LAYERS.map(l => (
                <button key={l.id} onClick={() => toggleLayer(l.id)}
                  className={`flex items-center gap-2.5 py-2.5 px-3 rounded-xl text-[12px] font-bold transition-all duration-200
                    ${layers[l.id]
                      ? "bg-white/[0.08] border border-white/20 text-white"
                      : "bg-white/[0.02] border border-white/[0.06] text-slate-500 hover:text-slate-300 hover:bg-white/[0.05]"}`}>
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${layers[l.id] ? l.color : "bg-slate-700"}`}/>
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bottom action buttons */}
          <div className="flex-shrink-0 border-t border-white/[0.06] px-4 py-3 bg-[#040810] flex gap-2 flex-col">
            <div className="flex gap-2">
              <button onClick={toggleBottomPanel}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-200
                  ${bottomPanelOpen
                    ? "bg-blue-500/20 border border-blue-400/40 text-blue-300"
                    : "bg-white/[0.04] border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.07]"}`}>
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
                Fleet Stats
              </button>
              <button onClick={() => setShowEventLog(v => !v)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-200 relative
                  ${showEventLog
                    ? "bg-amber-500/15 border border-amber-400/40 text-amber-300"
                    : "bg-white/[0.04] border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.07]"}`}>
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                </svg>
                Events
                {eventLog.length > 0 && (
                  <span className="absolute -top-1.5 right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center px-1">
                    {eventLog.length > 9 ? "9+" : eventLog.length}
                  </span>
                )}
              </button>
            </div>
            {/* Work Orders global summary */}
            {openWorkOrders > 0 && (
              <div className="flex items-center gap-2.5 bg-amber-500/8 border border-amber-500/20 rounded-xl px-3 py-2">
                <svg className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
                <span className="text-[11px] text-amber-300 font-bold flex-1">
                  {openWorkOrders} open work order{openWorkOrders > 1 ? "s" : ""}
                </span>
                <span className="text-[9px] text-amber-500 font-bold">Select machine → Orders tab</span>
              </div>
            )}
          </div>

        </div>

        {/* CENTER — 3D scene */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <div className="flex-1 relative min-h-0">
            <FactoryScene targetView={targetView} layers={layers} />

            {/* Navigation hint */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
              <div className="glass-panel rounded-full px-4 py-2 text-[11px] text-slate-400 font-medium tracking-wide opacity-70 flex items-center gap-2">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5"/>
                </svg>
                Click any machine to fly to it &middot; Drag to orbit &middot; Scroll to zoom
              </div>
            </div>

            <div className="absolute bottom-6 left-6 z-40 pointer-events-none">
              <AlertSystem />
            </div>

            {/* Scene legend — bottom right */}
            <SceneLegend />
          </div>

          {/* Fleet analytics bottom drawer */}
          <FleetAnalytics open={bottomPanelOpen} />
        </div>

        {/* RIGHT PANEL */}
        <div className="w-[370px] h-full bg-[#060a12] flex-shrink-0 overflow-hidden relative border-l border-white/[0.07]">
          <HolographicPanel />
          <EventLog open={showEventLog} onClose={() => setShowEventLog(false)} />
        </div>

      </div>
    </div>
  )
}
