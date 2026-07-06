import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { MACHINES, FLOW_EDGES } from '../data/machines'
import { useStore } from '../store/useStore'

function FlowLine({ from, to, machineData }) {
  const lineRef = useRef()
  const dotRef  = useRef()

  const fromM = MACHINES.find(m => m.id === from)
  const toM   = MACHINES.find(m => m.id === to)
  if (!fromM || !toM) return null

  const fromStatus = machineData[from]?.status || 'Healthy'
  const toStatus   = machineData[to]?.status   || 'Healthy'
  const isCritical = fromStatus === 'Critical' || toStatus === 'Critical'
  const isWarning  = fromStatus === 'Warning'  || toStatus === 'Warning' || fromStatus === 'High Risk' || toStatus === 'High Risk'

  const color = isCritical ? '#ef4444' : isWarning ? '#f97316' : '#3b82f6'

  const start = new THREE.Vector3(...fromM.position).add(new THREE.Vector3(0, 0.6, 0))
  const end   = new THREE.Vector3(...toM.position).add(new THREE.Vector3(0, 0.6, 0))

  const points = useMemo(() => {
    const mid = start.clone().lerp(end, 0.5).add(new THREE.Vector3(0, 1.2, 0))
    return new THREE.QuadraticBezierCurve3(start, mid, end).getPoints(28)
  }, [from, to])

  const geometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points])

  useFrame(({ clock }) => {
    if (lineRef.current) {
      lineRef.current.material.opacity = isCritical
        ? 0.15 + Math.sin(clock.elapsedTime * 6) * 0.15
        : 0.1
    }
    if (dotRef.current) {
      const t   = (clock.elapsedTime * 0.35) % 1
      const idx = Math.floor(t * (points.length - 1))
      const p   = points[Math.min(idx, points.length - 1)]
      dotRef.current.position.set(p.x, p.y, p.z)
    }
  })

  return (
    <group>
      <line ref={lineRef} geometry={geometry}>
        <lineBasicMaterial color={color} transparent opacity={0.1} />
      </line>
      <mesh ref={dotRef}>
        <sphereGeometry args={[0.035, 6, 6]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  )
}

export function RiskNetwork() {
  const machineData = useStore(s => s.machineData)
  return (
    <group>
      {FLOW_EDGES.map(([from, to], i) => (
        <FlowLine key={i} from={from} to={to} machineData={machineData} />
      ))}
    </group>
  )
}
