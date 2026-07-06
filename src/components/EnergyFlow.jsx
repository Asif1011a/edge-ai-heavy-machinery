import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { MACHINES } from '../data/machines'
import { useStore } from '../store/useStore'

const POWER_SOURCE = [0, 0, -16]

function EnergyLine({ target, energy, maxEnergy }) {
  const lineRef = useRef()
  const dots    = useRef([null, null, null])

  const ratio = Math.min(energy / maxEnergy, 1)
  const color = ratio > 0.75 ? '#ef4444' : ratio > 0.5 ? '#f97316' : '#3b82f6'

  const start = new THREE.Vector3(...POWER_SOURCE).add(new THREE.Vector3(0, 0.4, 0))
  const end   = new THREE.Vector3(...target).add(new THREE.Vector3(0, 0.4, 0))

  const points = useMemo(() => {
    const mid = start.clone().lerp(end, 0.5).add(new THREE.Vector3(0, 1.5, 0))
    return new THREE.QuadraticBezierCurve3(start, mid, end).getPoints(20)
  }, [target.join()])

  const geometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points])

  useFrame(({ clock }) => {
    if (lineRef.current) lineRef.current.material.opacity = 0.08 + Math.sin(clock.elapsedTime * 2 + ratio * 4) * 0.04
    dots.current.forEach((d, i) => {
      if (!d) return
      const t   = ((clock.elapsedTime * (0.25 + ratio * 0.35) + i * 0.33) % 1)
      const idx = Math.floor(t * (points.length - 1))
      const p   = points[Math.min(idx, points.length - 1)]
      d.position.set(p.x, p.y, p.z)
    })
  })

  return (
    <group>
      <line ref={lineRef} geometry={geometry}>
        <lineBasicMaterial color={color} transparent opacity={0.1} />
      </line>
      {[0, 1, 2].map(i => (
        <mesh key={i} ref={el => dots.current[i] = el}>
          <sphereGeometry args={[0.03, 5, 5]} />
          <meshBasicMaterial color={color} />
        </mesh>
      ))}
    </group>
  )
}

export function EnergyFlow() {
  const machineData = useStore(s => s.machineData)
  const max = Math.max(...MACHINES.map(m => machineData[m.id]?.energy_consumption || 0), 1)

  return (
    <group>
      <mesh position={POWER_SOURCE}>
        <boxGeometry args={[1.2, 1.2, 1.2]} />
        <meshStandardMaterial color="#0f172a" emissive="#1d4ed8" emissiveIntensity={0.5} metalness={0.9} />
      </mesh>
      <pointLight position={POWER_SOURCE} color="#3b82f6" intensity={1.5} distance={5} />
      {MACHINES.map(m => (
        <EnergyLine key={m.id} target={m.position} energy={machineData[m.id]?.energy_consumption || 0} maxEnergy={max} />
      ))}
    </group>
  )
}
