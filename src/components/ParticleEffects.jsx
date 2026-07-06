import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { MACHINES } from '../data/machines'
import { useStore } from '../store/useStore'

/* â”€â”€ Sparks emitter for CNC machines â”€â”€ */
function SparkBurst({ position, active, intensity = 1 }) {
  const count = 28
  const mesh  = useRef()

  const { positions, velocities, lifetimes, sizes } = useMemo(() => {
    const positions  = new Float32Array(count * 3)
    const velocities = Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 0.18 * intensity,
      y:  Math.random() * 0.22 * intensity + 0.04,
      z: (Math.random() - 0.5) * 0.18 * intensity,
      decay: 0.92 + Math.random() * 0.05,
    }))
    const lifetimes = Array.from({ length: count }, () => Math.random())
    const sizes     = new Float32Array(count).fill(0.035)
    return { positions, velocities, lifetimes, sizes }
  }, [])

  const posAttr = useMemo(() => new THREE.BufferAttribute(positions, 3), [positions])

  useFrame(({ clock }) => {
    if (!mesh.current || !active) return
    const t = clock.elapsedTime
    for (let i = 0; i < count; i++) {
      lifetimes[i] -= 0.018
      if (lifetimes[i] <= 0) {
        lifetimes[i] = 0.6 + Math.random() * 0.4
        positions[i * 3]     = (Math.random() - 0.5) * 0.12
        positions[i * 3 + 1] = 0
        positions[i * 3 + 2] = (Math.random() - 0.5) * 0.12
        velocities[i].x = (Math.random() - 0.5) * 0.18 * intensity
        velocities[i].y =  Math.random() * 0.2 * intensity + 0.05
        velocities[i].z = (Math.random() - 0.5) * 0.18 * intensity
      } else {
        positions[i * 3]     += velocities[i].x
        positions[i * 3 + 1] += velocities[i].y
        positions[i * 3 + 2] += velocities[i].z
        velocities[i].x *= velocities[i].decay
        velocities[i].y -= 0.006
        velocities[i].z *= velocities[i].decay
      }
    }
    posAttr.needsUpdate = true
  })

  if (!active) return null

  return (
    <points ref={mesh} position={position}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" {...posAttr} args={[positions, 3]} />
        <bufferAttribute attach="attributes-size"     array={sizes}  itemSize={1} />
      </bufferGeometry>
      <pointsMaterial
        color="#fbbf24"
        size={0.06}
        sizeAttenuation
        transparent
        opacity={0.85}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

/* â”€â”€ Steam / smoke for critical machines â”€â”€ */
function SteamCloud({ position, active }) {
  const count   = 18
  const mesh    = useRef()
  const pdata   = useMemo(() => ({
    positions:  new Float32Array(count * 3),
    velocities: Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 0.03,
      y:  Math.random() * 0.04 + 0.015,
      z: (Math.random() - 0.5) * 0.03,
    })),
    life: Array.from({ length: count }, () => Math.random()),
    sizes: new Float32Array(count).map(() => 0.1 + Math.random() * 0.15),
  }), [])

  const posAttr = useMemo(() => new THREE.BufferAttribute(pdata.positions, 3), [pdata])

  useFrame(() => {
    if (!mesh.current || !active) return
    for (let i = 0; i < count; i++) {
      pdata.life[i] -= 0.012
      if (pdata.life[i] <= 0) {
        pdata.life[i] = 0.5 + Math.random() * 0.5
        pdata.positions[i*3]   = (Math.random()-0.5)*0.2
        pdata.positions[i*3+1] = 0
        pdata.positions[i*3+2] = (Math.random()-0.5)*0.2
        pdata.velocities[i] = { x: (Math.random()-0.5)*0.03, y: Math.random()*0.04+0.015, z: (Math.random()-0.5)*0.03 }
      } else {
        pdata.positions[i*3]   += pdata.velocities[i].x
        pdata.positions[i*3+1] += pdata.velocities[i].y
        pdata.positions[i*3+2] += pdata.velocities[i].z
        pdata.velocities[i].x  *= 0.97
        pdata.velocities[i].z  *= 0.97
      }
    }
    posAttr.needsUpdate = true
  })

  if (!active) return null

  return (
    <points ref={mesh} position={position}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" {...posAttr} args={[pdata.positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#ef4444"
        size={0.18}
        sizeAttenuation
        transparent
        opacity={0.35}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

/* â”€â”€ AGV (Automated Guided Vehicle) â”€â”€ */
function AGV() {
  const ref    = useRef()
  const lightRef = useRef()

  // Path: follows a loop around the factory floor
  const path = useMemo(() => {
    const pts = [
      new THREE.Vector3(-14, 0.2,  12),
      new THREE.Vector3( 14, 0.2,  12),
      new THREE.Vector3( 14, 0.2, -18),
      new THREE.Vector3(-14, 0.2, -18),
    ]
    return new THREE.CatmullRomCurve3(pts, true)
  }, [])

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t   = (clock.elapsedTime * 0.022) % 1
    const pos = path.getPoint(t)
    const tan = path.getTangent(t)
    ref.current.position.copy(pos)
    ref.current.rotation.y = Math.atan2(tan.x, tan.z)
    if (lightRef.current) lightRef.current.material.emissiveIntensity = 0.8 + Math.sin(clock.elapsedTime * 8) * 0.5
  })

  return (
    <group ref={ref}>
      {/* AGV body */}
      <mesh position={[0, 0.1, 0]} castShadow>
        <boxGeometry args={[0.6, 0.2, 0.9]} />
        <meshStandardMaterial color="#0f1828" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Top surface */}
      <mesh position={[0, 0.22, 0]}>
        <boxGeometry args={[0.58, 0.04, 0.88]} />
        <meshStandardMaterial color="#1a2840" metalness={0.85} roughness={0.25} />
      </mesh>
      {/* Warning light */}
      <mesh ref={lightRef} position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.08, 10]} />
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.9} />
      </mesh>
      {/* Wheels */}
      {[[-0.25,-0.08,0.35],[0.25,-0.08,0.35],[-0.25,-0.08,-0.35],[0.25,-0.08,-0.35]].map(([x,y,z],i)=>(
        <mesh key={i} position={[x,y,z]} rotation={[Math.PI/2, 0, 0]}>
          <cylinderGeometry args={[0.09, 0.09, 0.06, 12]} />
          <meshStandardMaterial color="#080c12" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
      {/* Headlights */}
      {[-0.18, 0.18].map((x, i) => (
        <group key={i}>
          <mesh position={[x, 0.1, 0.46]}>
            <cylinderGeometry args={[0.04, 0.04, 0.04, 8]} />
            <meshStandardMaterial color="#fffbe0" emissive="#fffbe0" emissiveIntensity={1.2} />
          </mesh>
          <pointLight position={[x, 0.1, 0.5]} color="#fffbe0" intensity={0.6} distance={3} />
        </group>
      ))}
      <pointLight position={[0, 0.4, 0]} color="#fbbf24" intensity={0.8} distance={3} />
    </group>
  )
}

export function ParticleEffects() {
  const machineData = useStore(s => s.machineData)

  return (
    <group>
      <AGV />
      {MACHINES.map(m => {
        const d = machineData[m.id]
        if (!d) return null
        const isCritical = d.status === 'Critical'
        const isRunning  = d.status === 'Healthy' || d.status === 'Warning'
        const [px, py, pz] = m.position

        return (
          <group key={m.id}>
            {/* Sparks for CNC machines */}
            {m.type === 'cnc' && (
              <SparkBurst
                position={[px, py + 0.85, pz - 0.25]}
                active={isRunning || isCritical}
                intensity={isCritical ? 2.5 : 1}
              />
            )}
            {/* Sparks for robotic arms */}
            {m.type === 'robot' && isRunning && (
              <SparkBurst
                position={[px + 0.05, py + 2.2, pz]}
                active
                intensity={0.6}
              />
            )}
            {/* Red steam for critical machines */}
            {isCritical && (
              <SteamCloud
                position={[px, py + 2.6, pz]}
                active
              />
            )}
          </group>
        )
      })}
    </group>
  )
}
