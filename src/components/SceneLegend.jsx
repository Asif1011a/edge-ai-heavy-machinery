import { useState } from "react"

export function SceneLegend() {
  const [open, setOpen] = useState(true)

  return (
    <div className="absolute bottom-6 right-6 z-30 flex flex-col items-end gap-2">

      {/* Toggle button */}
      <button
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-200 pointer-events-auto border
          ${open
            ? "bg-white/[0.08] border-white/20 text-white"
            : "bg-black/50 border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.06]"}`}
      >
        <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        {open ? "Hide Legend" : "Scene Legend"}
      </button>

      {/* Panel */}
      {open && (
        <div className="glass-panel rounded-2xl px-4 py-3 w-[252px] space-y-4 slide-up pointer-events-auto">

          {/* Heading */}
          <div className="flex items-center justify-between border-b border-white/[0.07] pb-2.5">
            <div className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
              </svg>
              <span className="text-[11px] text-slate-300 font-black uppercase tracking-widest">Scene Legend</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-slate-500 hover:text-white transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Machine status */}
          <div>
            <div className="text-[9px] text-slate-500 font-black uppercase tracking-[0.18em] mb-2">Machine Status Colours</div>
            <div className="space-y-2">
              {[
                { dot:"bg-green-400",  ring:"ring-green-500/30",  label:"Healthy",   desc:"Running normally" },
                { dot:"bg-amber-400",  ring:"ring-amber-400/30",  label:"Warning",   desc:"Minor issue detected" },
                { dot:"bg-orange-500", ring:"ring-orange-500/30", label:"High Risk", desc:"Failure expected soon" },
                { dot:"bg-red-500",    ring:"ring-red-500/30",    label:"Critical",  desc:"Stop and inspect now" },
              ].map(({ dot, ring, label, desc }) => (
                <div key={label} className="flex items-center gap-2.5">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${dot} ring-2 ${ring}`} />
                  <span className="text-[12px] text-white font-semibold w-[76px] flex-shrink-0">{label}</span>
                  <span className="text-[10px] text-slate-500 leading-tight">{desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Connecting lines */}
          <div>
            <div className="text-[9px] text-slate-500 font-black uppercase tracking-[0.18em] mb-2">Connecting Lines</div>
            <div className="space-y-3">

              {/* Risk network */}
              <div className="flex items-start gap-2.5">
                <div className="flex items-center gap-0.5 flex-shrink-0 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                  <div className="w-6 h-[2px] bg-gradient-to-r from-orange-500 to-red-500" />
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                </div>
                <div>
                  <div className="text-[12px] text-white font-bold leading-tight">Risk Network</div>
                  <div className="text-[10px] text-slate-400 leading-snug mt-0.5">
                    If one machine fails, the connected machines downstream will also be affected. Thicker line = higher shared risk.
                  </div>
                </div>
              </div>

              {/* Energy flow */}
              <div className="flex items-start gap-2.5">
                <div className="flex items-center gap-0.5 flex-shrink-0 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  <div className="w-6 h-[2px] bg-gradient-to-r from-blue-400 to-cyan-400" />
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                </div>
                <div>
                  <div className="text-[12px] text-white font-bold leading-tight">Power Flow</div>
                  <div className="text-[10px] text-slate-400 leading-snug mt-0.5">
                    Live electricity flowing from the AI Hub to each machine. Animated dots show the direction and speed of current.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Hub */}
          <div>
            <div className="text-[9px] text-slate-500 font-black uppercase tracking-[0.18em] mb-2">Key Structure</div>
            <div className="flex items-start gap-2.5 bg-blue-500/8 border border-blue-500/20 rounded-xl p-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
              </div>
              <div>
                <div className="text-[12px] text-blue-300 font-bold leading-tight">AI Control Hub</div>
                <div className="text-[10px] text-slate-400 leading-snug mt-0.5">
                  The central server rack in the middle of the factory. It monitors all machines, runs AI failure predictions, and controls the entire production line.
                </div>
              </div>
            </div>
          </div>

          {/* Interaction tip */}
          <div className="border-t border-white/[0.06] pt-2.5">
            <div className="text-[9px] text-slate-500 font-black uppercase tracking-[0.18em] mb-1.5">How to Navigate</div>
            <div className="space-y-1">
              {[
                ["Click machine", "Fly camera to it + view telemetry"],
                ["Drag / orbit",  "Rotate the 3D factory view"],
                ["Scroll wheel",  "Zoom in or out"],
              ].map(([action, desc]) => (
                <div key={action} className="flex items-start gap-2">
                  <span className="text-[10px] text-slate-300 font-semibold w-[76px] flex-shrink-0">{action}</span>
                  <span className="text-[10px] text-slate-500">{desc}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
