import { useStore } from "../store/useStore"
import { MACHINES } from "../data/machines"

export function AlertSystem() {
  const alerts = useStore(s => s.alerts)
  const selectMachine = useStore(s => s.selectMachine)

  if (alerts.length === 0) return null

  return (
    <div className="flex flex-col gap-3 pointer-events-none w-[340px]">
      {alerts.slice(0, 3).map((alert, i) => {
        const machine = MACHINES.find(m => m.id === alert.machine_id)
        const isCrit  = alert.status === "Critical"
        return (
          <div
            key={alert.machine_id}
            onClick={() => selectMachine(alert.machine_id)}
            className={`glass-panel rounded-2xl cursor-pointer slide-in pointer-events-auto relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300
              ${isCrit ? 'shadow-[0_8px_30px_rgba(255,0,68,0.3)]' : 'shadow-[0_8px_30px_rgba(255,85,0,0.2)]'}`}
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <div className={`absolute inset-0 opacity-20 mix-blend-overlay ${isCrit ? "bg-critical alert-pulse" : "bg-risk alert-pulse"}`} />
            
            <div className="relative z-10 p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner ${isCrit ? "bg-critical/20" : "bg-risk/20"}`}>
                  <svg className={`w-4 h-4 ${isCrit ? "text-red-400" : "text-orange-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className={`text-[10px] font-bold uppercase tracking-widest ${isCrit ? "text-red-400" : "text-orange-400"}`}>
                    {isCrit ? "Critical Fault" : "High Risk"}
                  </div>
                  <div className="text-white font-extrabold text-[15px] truncate drop-shadow-sm leading-tight">{machine?.name}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/[0.06]">
                <div className="flex-1">
                  <div className="text-slate-500 text-[9px] uppercase tracking-wider font-bold mb-0.5">Failure Probability</div>
                  <div className={`font-mono font-bold text-[14px] ${isCrit ? "text-red-400" : "text-orange-400"}`}>
                    {alert.failure_probability?.toFixed(0)}%
                  </div>
                </div>
                <div className="w-px h-6 bg-white/[0.06]" />
                <div className="flex-1">
                  <div className="text-slate-500 text-[9px] uppercase tracking-wider font-bold mb-0.5">Est. Downtime</div>
                  <div className="font-mono font-bold text-[14px] text-white">
                    {alert.predicted_downtime?.toFixed(1)} <span className="text-[10px] text-slate-500">hrs</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
