import { useMemo } from 'react'

export function Sparkline({ data = [], color = '#60a5fa', height = 32, width = 180 }) {
  const points = useMemo(() => {
    if (data.length < 2) return ''
    const max = Math.max(...data, 1)
    const min = Math.min(...data, 0)
    const range = max - min || 1
    return data.map((v, i) => {
      const x = (i / (data.length - 1)) * width
      const y = height - ((v - min) / range) * height
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    }).join(' ')
  }, [data, width, height])

  const fillPoints = useMemo(() => {
    if (!points) return ''
    return `${points} L${width},${height} L0,${height} Z`
  }, [points, width, height])

  if (data.length < 2) {
    return (
      <div style={{ width, height }} className="flex items-center justify-center">
        <span className="text-[9px] text-slate-700 font-mono">No data</span>
      </div>
    )
  }

  const latest = data[data.length - 1]
  const prev   = data[data.length - 2]
  const trend  = latest > prev ? 'â–²' : latest < prev ? 'â–¼' : 'â”€'
  const trendColor = latest > prev ? '#ef4444' : latest < prev ? '#34d399' : '#9ca3af'

  return (
    <div style={{ position: 'relative', width, height }}>
      <svg width={width} height={height} style={{ display: 'block' }}>
        <defs>
          <linearGradient id={`sg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {/* Fill */}
        <path d={fillPoints} fill={`url(#sg-${color.replace('#','')})`} />
        {/* Line */}
        <path d={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Latest dot */}
        {data.length > 1 && (() => {
          const lx = width
          const max = Math.max(...data, 1)
          const min = Math.min(...data, 0)
          const ly = height - ((latest - min) / (max - min || 1)) * height
          return <circle cx={lx} cy={ly} r="2.5" fill={color} />
        })()}
      </svg>
      <span style={{ position: 'absolute', bottom: 0, right: 0, fontSize: 9, color: trendColor, fontFamily: 'monospace', fontWeight: 600 }}>{trend}</span>
    </div>
  )
}
