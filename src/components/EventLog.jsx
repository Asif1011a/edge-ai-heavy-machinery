import { useStore } from "../store/useStore"

const TYPE_META = {
  error:   { color:"text-red-400",   bg:"bg-red-500/5",   border:"border-red-500/20",   dot:"bg-red-500",   label:"Critical"  },
  warning: { color:"text-amber-400", bg:"bg-amber-400/5", border:"border-amber-400/20", dot:"bg-amber-400", label:"Warning"   },
  info:    { color:"text-blue-400",  bg:"bg-blue-500/5",  border:"border-blue-500/20",  dot:"bg-blue-400",  label:"Info"      },
  success: { color:"text-green-400", bg:"bg-green-500/5", border:"border-green-500/20", dot:"bg-green-400", label:"Resolved"  },
}

function ago(ts) {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60)  return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60)  return `${m}m ago`
  return `${Math.floor(m / 60)}h ago`
}

export function EventLog({ open, onClose }) {
  const eventLog      = useStore(s => s.eventLog)
  const selectMachine = useStore(s => s.selectMachine)

  if (!open) return null

  return (
    <div className="absolute top-0 right-0 h-full w-[380px] z-50 flex flex-col bg-[#060a12] border-l border-white/[0.06] shadow-[-8px_0_40px_rgba(0,0,0,0.7)] slide-in">

      {/* Header */}
      <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-1 h-5 rounded-full bg-gradient-to-b from-yellow-400 to-orange-500"/>
          <span className="text-white font-black text-[15px]">Event Log</span>
          <span className="bg-white/10 text-white text-[9px] px-2 py-0.5 rounded font-mono font-bold border border-white/10">
            {eventLog.length} events
          </span>
        </div>
        <button onClick={onClose}
          className="w-7 h-7 rounded-lg bg-white/[0.06] hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      {/* Empty state */}
      {eventLog.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
          </div>
          <p className="text-[13px] text-slate-500 leading-relaxed">
            No events recorded yet. Events appear here when machine statuses change.
          </p>
        </div>
      ) : (
        <div className="overflow-y-auto flex-1 p-3 space-y-2">
          {eventLog.map(evt => {
            const style = TYPE_META[evt.type] || TYPE_META.info
            return (
              <div key={evt.id}
                onClick={() => { selectMachine(evt.machine_id); onClose() }}
                className={`rounded-xl border p-3 cursor-pointer hover:brightness-110 transition-all duration-200 ${style.bg} ${style.border}`}>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${style.dot}`}/>
                    <span className={`text-[10px] font-black uppercase tracking-wider ${style.color}`}>{style.label}</span>
                  </div>
                  <span className="text-[10px] text-slate-600 font-mono flex-shrink-0">{ago(evt.timestamp)}</span>
                </div>
                <div className="text-white font-bold text-[13px] leading-tight mb-0.5">{evt.machine_name}</div>
                <div className="text-slate-400 text-[12px]">{evt.message}</div>
                <div className="text-slate-600 text-[10px] font-mono mt-1">{evt.detail}</div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
