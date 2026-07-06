import { Html } from "@react-three/drei"
import { useStore } from "../store/useStore"

const STATUS_STYLE = {
  Healthy:    { dot: "bg-healthy",  text: "text-healthy",  border: "border-[#00ff88]" },
  Warning:    { dot: "bg-warning",  text: "text-warning",  border: "border-[#ffb700]" },
  "High Risk":{ dot: "bg-risk",     text: "text-risk",     border: "border-[#ff5500]" },
  Critical:   { dot: "bg-critical", text: "text-critical", border: "border-[#ff0044]" },
}

export function MachineLabel({ machine }) {
  const data = useStore(s => s.machineData[machine.id])
  const selected = useStore(s => s.selectedMachine === machine.id)
  const selectMachine = useStore(s => s.selectMachine)
  if (!data) return null

  const st = STATUS_STYLE[data.status] || STATUS_STYLE.Healthy

  return (
    <Html position={[0, 3.2, 0]} center distanceFactor={14} zIndexRange={[100, 0]}>
      <div
        onClick={() => selectMachine(machine.id)}
        className="cursor-pointer flex items-center group relative"
        style={{ whiteSpace: "nowrap" }}
      >
        {/* Glow behind the dot */}
        <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full blur-md opacity-40 mix-blend-screen transition-opacity ${st.dot}`} />
        
        <div className="flex items-center gap-2">
          {/* Connector Line */}
          <div className={`w-3 h-px ${st.dot} opacity-50`} />
          
          <div
            className="flex items-center gap-3 pr-3 pl-2 py-1.5 rounded-[12px] transition-all duration-300 relative overflow-hidden"
            style={{
              background: selected ? "rgba(255,255,255,0.15)" : "rgba(8,12,20,0.6)",
              backdropFilter: "blur(12px)",
              border: `1px solid ${selected ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.1)"}`,
              boxShadow: selected ? "0 4px 20px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.2)" : "0 4px 12px rgba(0,0,0,0.3)",
              transform: selected ? "scale(1.05)" : "scale(1)",
            }}
          >
            {selected && <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none" />}
            
            <div className={`status-orb flex-shrink-0 ${st.dot} ${data.status === "Critical" ? "alert-pulse" : ""}`} />
            
            <div className="flex items-baseline gap-2 relative z-10">
              <span className="font-bold text-[13px] text-white tracking-wide">{machine.name}</span>
              <span className={`font-mono text-[11px] font-bold ${st.text}`}>{data.health_score?.toFixed(0)}%</span>
            </div>
          </div>
        </div>
      </div>
    </Html>
  )
}
