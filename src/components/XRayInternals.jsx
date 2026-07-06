import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

// ── X-RAY INTERNAL COMPONENT LIBRARY ──────────────────────────────────────────

function ServoMotor({ pos, rot = [0, 0, 0], radius = 0.08, length = 0.22, color = '#1a2a3a', rpm = 1500 }) {
  const ref = useRef()
  const ledRef = useRef()
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.z = clock.elapsedTime * (rpm / 60) * 0.08
    if (ledRef.current) ledRef.current.material.emissiveIntensity = 1.5 + Math.sin(clock.elapsedTime * 4) * 0.5
  })
  return (
    <group position={pos} rotation={rot}>
      {/* Motor housing */}
      <mesh castShadow>
        <cylinderGeometry args={[radius, radius, length, 20]} />
        <meshStandardMaterial color={color} metalness={0.92} roughness={0.18} />
      </mesh>
      {/* Copper windings */}
      <mesh>
        <cylinderGeometry args={[radius * 0.7, radius * 0.7, length * 0.82, 16]} />
        <meshStandardMaterial color="#b45309" emissive="#92400e" emissiveIntensity={0.6} metalness={0.75} roughness={0.35} />
      </mesh>
      {/* Rotating shaft */}
      <group ref={ref}>
        <mesh>
          <cylinderGeometry args={[0.012, 0.012, length + 0.08, 10]} />
          <meshStandardMaterial color="#e2e8f0" metalness={1} roughness={0.04} />
        </mesh>
      </group>
      {/* End caps */}
      {[-1, 1].map((s, i) => (
        <mesh key={i} position={[0, s * (length / 2 + 0.012), 0]}>
          <cylinderGeometry args={[radius + 0.008, radius + 0.008, 0.024, 20]} />
          <meshStandardMaterial color="#0f1e2e" metalness={0.95} roughness={0.15} />
        </mesh>
      ))}
      {/* Cooling fins */}
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} position={[0, -length / 2 + (length * i) / 7, 0]} rotation={[0, (i * Math.PI) / 8, 0]}>
          <boxGeometry args={[radius * 2.3, 0.007, 0.02]} />
          <meshStandardMaterial color="#1e3050" metalness={0.9} roughness={0.2} />
        </mesh>
      ))}
      {/* Status LED */}
      <mesh ref={ledRef} position={[radius * 0.85, length * 0.38, 0]}>
        <sphereGeometry args={[0.009, 8, 8]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={2} />
      </mesh>
    </group>
  )
}

function Motherboard({ pos, rot = [0, 0, 0], size = [0.42, 0.003, 0.3], color = '#0a3a1a' }) {
  const chipsRef = useRef()
  useFrame(({ clock }) => {
    if (chipsRef.current) {
      chipsRef.current.children.forEach((c, i) => {
        if (c.material) c.material.emissiveIntensity = 0.5 + Math.sin(clock.elapsedTime * 2.5 + i * 0.8) * 0.35
      })
    }
  })
  const traceColors = ['#00ff88', '#00c8ff', '#ff6600', '#ffcc00', '#ff44aa']
  const chips = [
    { pos: [-0.1, 0.008, -0.08], size: [0.065, 0.013, 0.065], color: '#1a1a2e', tc: 0 },
    { pos: [0.06, 0.008, -0.07], size: [0.042, 0.011, 0.042], color: '#0f2a1a', tc: 1 },
    { pos: [-0.09, 0.008, 0.05], size: [0.058, 0.011, 0.042], color: '#1a0a2e', tc: 2 },
    { pos: [0.1, 0.008, 0.01],   size: [0.032, 0.011, 0.052], color: '#2a1a0a', tc: 3 },
    { pos: [0.01, 0.008, 0.09],  size: [0.048, 0.011, 0.037], color: '#0a1a2e', tc: 4 },
  ]
  return (
    <group position={pos} rotation={rot}>
      {/* PCB board */}
      <mesh>
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.65} emissive="#021a08" emissiveIntensity={0.2} />
      </mesh>
      {/* Copper trace lines */}
      {[
        { from: [-size[0] / 2 + 0.04, 0.002, 0], to: [size[0] / 2 - 0.04, 0.002, 0], tc: 0 },
        { from: [0, 0.002, -size[2] / 2 + 0.03], to: [0, 0.002, size[2] / 2 - 0.03], tc: 1 },
        { from: [-0.1, 0.002, -0.05], to: [0.06, 0.002, 0.05], tc: 2 },
        { from: [-0.05, 0.002, 0.0], to: [0.1, 0.002, -0.025], tc: 3 },
      ].map(({ from, to, tc }, i) => {
        const w = Math.abs(to[0] - from[0]) || 0.003
        const d = Math.abs(to[2] - from[2]) || 0.003
        return (
          <mesh key={i} position={[(from[0] + to[0]) / 2, from[1], (from[2] + to[2]) / 2]}>
            <boxGeometry args={[w, 0.001, d]} />
            <meshStandardMaterial color={traceColors[tc]} emissive={traceColors[tc]} emissiveIntensity={0.6} transparent opacity={0.9} />
          </mesh>
        )
      })}
      {/* IC Chips */}
      <group ref={chipsRef}>
        {chips.map((c, i) => (
          <group key={i} position={c.pos}>
            <mesh>
              <boxGeometry args={c.size} />
              <meshStandardMaterial color={c.color} metalness={0.6} roughness={0.4} emissive={traceColors[c.tc]} emissiveIntensity={0.5} />
            </mesh>
            {/* Status LED */}
            <mesh position={[c.size[0] / 2 - 0.004, c.size[1] + 0.004, 0]}>
              <sphereGeometry args={[0.004, 6, 6]} />
              <meshStandardMaterial color={traceColors[c.tc]} emissive={traceColors[c.tc]} emissiveIntensity={2.5} />
            </mesh>
          </group>
        ))}
      </group>
      {/* Capacitors */}
      {[[-0.05, -0.09], [0.13, -0.05], [0.08, 0.1], [-0.13, 0.07]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.02, z]}>
          <cylinderGeometry args={[0.006, 0.006, 0.028, 8]} />
          <meshStandardMaterial color="#3a5a1a" metalness={0.7} roughness={0.4} emissive="#1a3a08" emissiveIntensity={0.4} />
        </mesh>
      ))}
      {/* CPU Heatsink */}
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} position={[-0.1, 0.022, -0.08 + i * 0.013 - 0.03]}>
          <boxGeometry args={[0.07, 0.02, 0.002]} />
          <meshStandardMaterial color="#a0b0c0" metalness={0.95} roughness={0.12} />
        </mesh>
      ))}
    </group>
  )
}

function DriveInverter({ pos, rot = [0, 0, 0] }) {
  const screenRef = useRef()
  useFrame(({ clock }) => {
    if (screenRef.current) screenRef.current.material.emissiveIntensity = 0.45 + Math.sin(clock.elapsedTime * 3) * 0.3
  })
  return (
    <group position={pos} rotation={rot}>
      <mesh>
        <boxGeometry args={[0.14, 0.19, 0.065]} />
        <meshStandardMaterial color="#0a1828" metalness={0.86} roughness={0.24} />
      </mesh>
      <mesh ref={screenRef} position={[0, 0.04, 0.034]}>
        <boxGeometry args={[0.085, 0.065, 0.002]} />
        <meshStandardMaterial color="#001828" emissive="#00c8ff" emissiveIntensity={0.5} />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} position={[0, -0.05 + i * 0.014, -0.044]}>
          <boxGeometry args={[0.13, 0.002, 0.022]} />
          <meshStandardMaterial color="#1a2840" metalness={0.9} roughness={0.2} />
        </mesh>
      ))}
      {[-0.04, -0.01, 0.02].map((x, i) => (
        <mesh key={i} position={[x, -0.08, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.016, 6]} />
          <meshStandardMaterial color={['#ef4444', '#94a3b8', '#22c55e'][i]} metalness={0.9} roughness={0.2} />
        </mesh>
      ))}
    </group>
  )
}

function BearingAssembly({ pos, rot = [0, 0, 0], outerR = 0.12, innerR = 0.07 }) {
  const ballsRef = useRef()
  useFrame(({ clock }) => { if (ballsRef.current) ballsRef.current.rotation.z = clock.elapsedTime * 3 })
  const midR = (outerR + innerR) / 2
  const tubeR = (outerR - innerR) / 2
  return (
    <group position={pos} rotation={rot}>
      <mesh>
        <torusGeometry args={[midR, tubeR, 10, 36]} />
        <meshStandardMaterial color="#8090a0" metalness={0.96} roughness={0.09} />
      </mesh>
      <mesh>
        <torusGeometry args={[innerR * 0.72, innerR * 0.12, 8, 24]} />
        <meshStandardMaterial color="#a0b0c0" metalness={0.96} roughness={0.07} />
      </mesh>
      <group ref={ballsRef}>
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2
          return (
            <mesh key={i} position={[Math.cos(a) * midR, Math.sin(a) * midR, 0]}>
              <sphereGeometry args={[tubeR * 0.72, 8, 8]} />
              <meshStandardMaterial color="#c8d8e8" metalness={1} roughness={0.03} />
            </mesh>
          )
        })}
      </group>
    </group>
  )
}

function CoolantPump({ pos }) {
  const impRef = useRef()
  useFrame(({ clock }) => { if (impRef.current) impRef.current.rotation.y = clock.elapsedTime * 9 })
  return (
    <group position={pos}>
      <mesh>
        <sphereGeometry args={[0.065, 16, 12]} />
        <meshStandardMaterial color="#0a2a3a" metalness={0.85} roughness={0.28} />
      </mesh>
      {[[0, 0.065, 0], [0, -0.065, 0]].map((p, i) => (
        <mesh key={i} position={p}>
          <cylinderGeometry args={[0.018, 0.018, 0.055, 10]} />
          <meshStandardMaterial color="#1a3a4a" metalness={0.9} roughness={0.2} />
        </mesh>
      ))}
      <group ref={impRef}>
        {Array.from({ length: 5 }, (_, i) => {
          const a = (i / 5) * Math.PI * 2
          return (
            <mesh key={i} position={[Math.cos(a) * 0.038, 0, Math.sin(a) * 0.038]} rotation={[0, a, 0]}>
              <boxGeometry args={[0.038, 0.022, 0.009]} />
              <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={0.5} metalness={0.8} roughness={0.28} />
            </mesh>
          )
        })}
      </group>
      <mesh>
        <sphereGeometry args={[0.028, 8, 8]} />
        <meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={1.8} transparent opacity={0.65} />
      </mesh>
    </group>
  )
}

function PowerSupply({ pos, rot = [0, 0, 0] }) {
  const fanRef = useRef()
  useFrame(({ clock }) => { if (fanRef.current) fanRef.current.rotation.z = clock.elapsedTime * 6 })
  return (
    <group position={pos} rotation={rot}>
      <mesh>
        <boxGeometry args={[0.15, 0.065, 0.1]} />
        <meshStandardMaterial color="#0c1828" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.033, 0]}>
        <cylinderGeometry args={[0.026, 0.026, 0.005, 16]} />
        <meshStandardMaterial color="#0a1428" metalness={0.7} roughness={0.4} />
      </mesh>
      <group ref={fanRef} position={[0, 0.035, 0]}>
        {Array.from({ length: 4 }, (_, i) => (
          <mesh key={i} rotation={[0, (i * Math.PI) / 2, 0]}>
            <boxGeometry args={[0.022, 0.002, 0.01]} />
            <meshStandardMaterial color="#1a2840" metalness={0.8} roughness={0.3} />
          </mesh>
        ))}
      </group>
      {[-0.045, 0, 0.045].map((x, i) => (
        <mesh key={i} position={[x, 0, 0.052]}>
          <boxGeometry args={[0.019, 0.019, 0.009]} />
          <meshStandardMaterial color={['#ef4444', '#fbbf24', '#22c55e'][i]} metalness={0.7} roughness={0.4} />
        </mesh>
      ))}
    </group>
  )
}

// ── PER-MACHINE X-RAY INTERNAL VIEWS ──────────────────────────────────────────

export function CNCInternals({ data }) {
  const rpm = data?.rotational_speed || 1500
  return (
    <group>
      <ServoMotor pos={[0, 1.78, -0.1]} rot={[Math.PI / 2, 0, 0]} radius={0.15} length={0.36} color="#0a1828" rpm={rpm} />
      <ServoMotor pos={[-0.5, 1.2, -0.3]} rot={[0, 0, Math.PI / 2]} radius={0.062} length={0.19} color="#0e2030" rpm={rpm * 0.3} />
      <ServoMotor pos={[0, 0.7, -0.5]} rot={[Math.PI / 2, 0, 0]} radius={0.072} length={0.21} color="#0e2030" rpm={rpm * 0.2} />
      <ServoMotor pos={[0.5, 1.5, -0.3]} rot={[0, 0, 0]} radius={0.062} length={0.19} color="#0e2030" rpm={rpm * 0.4} />
      <DriveInverter pos={[1.05, 0.9, -0.78]} rot={[0, 0, 0]} />
      <Motherboard pos={[-0.3, 0.55, -0.2]} rot={[Math.PI / 2, 0, 0.2]} size={[0.44, 0.003, 0.3]} />
      <CoolantPump pos={[0.5, 0.2, 0.82]} />
      <PowerSupply pos={[-0.8, 0.38, -0.6]} rot={[0, 0.3, 0]} />
      <BearingAssembly pos={[0, 1.95, -0.1]} rot={[Math.PI / 2, 0, 0]} outerR={0.095} innerR={0.058} />
      <BearingAssembly pos={[0, 1.55, -0.1]} rot={[Math.PI / 2, 0, 0]} outerR={0.088} innerR={0.054} />
      {/* Power bus */}
      <mesh position={[0, 1.2, -0.2]}>
        <boxGeometry args={[0.004, 1.45, 0.004]} />
        <meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={0.9} transparent opacity={0.75} />
      </mesh>
      <mesh position={[-0.3, 1.0, -0.35]}>
        <boxGeometry args={[0.92, 0.004, 0.004]} />
        <meshStandardMaterial color="#00ff88" emissive="#00ff88" emissiveIntensity={0.9} transparent opacity={0.65} />
      </mesh>
      <pointLight position={[0, 1.5, 0]} color="#00c8ff" intensity={1.5} distance={3.5} />
    </group>
  )
}

export function RobotInternals({ data }) {
  const rpm = data?.rotational_speed || 1500
  return (
    <group>
      <ServoMotor pos={[0, 0.38, 0]} rot={[0, 0, 0]} radius={0.1} length={0.26} color="#1a0a00" rpm={rpm * 0.1} />
      <ServoMotor pos={[0, 0.72, 0]} rot={[Math.PI / 2, 0, 0]} radius={0.082} length={0.23} color="#1a0800" rpm={rpm * 0.15} />
      <ServoMotor pos={[0, 1.6, 0]} rot={[Math.PI / 2, 0, 0]} radius={0.072} length={0.19} color="#200a00" rpm={rpm * 0.2} />
      <ServoMotor pos={[0, 2.0, 0]} rot={[0, 0, Math.PI / 2]} radius={0.052} length={0.145} color="#180800" rpm={rpm * 0.3} />
      <Motherboard pos={[0, 0.12, -0.25]} rot={[Math.PI / 2, 0, 0]} size={[0.4, 0.003, 0.26]} color="#1a0a08" />
      {[[-0.3, 0.5], [0, 0.5], [0.3, 0.5]].map(([x, y], i) => (
        <DriveInverter key={i} pos={[x, y, -0.34]} />
      ))}
      <BearingAssembly pos={[0, 0.56, 0]} rot={[0, 0, 0]} outerR={0.145} innerR={0.092} />
      <BearingAssembly pos={[0, 1.24, 0]} rot={[0, 0, 0]} outerR={0.112} innerR={0.07} />
      <PowerSupply pos={[0.3, 0.12, -0.3]} />
      {[0, 1, 2].map(i => (
        <mesh key={i} position={[i * 0.025 - 0.025, 1.0, -0.02]}>
          <boxGeometry args={[0.008, 1.65, 0.008]} />
          <meshStandardMaterial color={['#ef4444', '#3b82f6', '#fbbf24'][i]} emissive={['#ef4444', '#3b82f6', '#fbbf24'][i]} emissiveIntensity={0.55} transparent opacity={0.82} />
        </mesh>
      ))}
      <pointLight position={[0, 1.0, 0]} color="#ff6600" intensity={1.2} distance={3.5} />
    </group>
  )
}

export function ConveyorInternals({ data }) {
  const torque = data?.torque || 35
  return (
    <group>
      <ServoMotor pos={[1.5, 0.5, 0.32]} rot={[0, 0, Math.PI / 2]} radius={0.092} length={0.32} color="#0a1828" rpm={torque * 20} />
      <BearingAssembly pos={[1.18, 0.5, 0.32]} rot={[Math.PI / 2, 0, 0]} outerR={0.082} innerR={0.052} />
      <BearingAssembly pos={[-1.43, 0.5, 0]} rot={[Math.PI / 2, 0, 0]} outerR={0.072} innerR={0.044} />
      <Motherboard pos={[-1.3, 0.55, -0.52]} rot={[Math.PI / 2, 0, Math.PI / 2]} size={[0.3, 0.003, 0.2]} />
      <DriveInverter pos={[-1.3, 0.72, -0.52]} rot={[0, Math.PI / 2, 0]} />
      <PowerSupply pos={[0, 0.25, -0.4]} />
      {[-0.5, 0.5].map((z, i) => (
        <mesh key={i} position={[1.4, 0.38, z]}>
          <torusGeometry args={[0.025, 0.005, 6, 16]} />
          <meshStandardMaterial color="#607080" metalness={0.9} roughness={0.2} emissive="#304050" emissiveIntensity={0.3} />
        </mesh>
      ))}
      <mesh position={[0, 0.55, -0.48]}>
        <boxGeometry args={[2.65, 0.003, 0.003]} />
        <meshStandardMaterial color="#00ff88" emissive="#00ff88" emissiveIntensity={0.9} transparent opacity={0.75} />
      </mesh>
      <pointLight position={[0, 0.6, 0]} color="#22d3ee" intensity={1.0} distance={4.5} />
    </group>
  )
}

export function StationInternals({ data }) {
  return (
    <group>
      <Motherboard pos={[0, 0.3, -0.2]} rot={[Math.PI / 2, 0, 0]} size={[0.54, 0.003, 0.38]} color="#081a10" />
      <PowerSupply pos={[0.62, 0.25, -0.52]} />
      {[-0.42, 0.42].map((x, i) => (
        <Motherboard key={i} pos={[x, 0.56, -0.66]} rot={[0, 0, 0]} size={[0.32, 0.003, 0.22]} color="#0a1a30" />
      ))}
      <DriveInverter pos={[-0.72, 1.5, -0.54]} />
      {[0, 1, 2].map(i => (
        <mesh key={i} position={[i * 0.04 - 0.04, 1.2, -0.62]}>
          <boxGeometry args={[0.006, 1.25, 0.006]} />
          <meshStandardMaterial color={['#6d28d9', '#0ea5e9', '#10b981'][i]} emissive={['#6d28d9', '#0ea5e9', '#10b981'][i]} emissiveIntensity={0.55} transparent opacity={0.82} />
        </mesh>
      ))}
      <pointLight position={[0, 1.0, 0]} color="#a78bfa" intensity={1.0} distance={4.5} />
    </group>
  )
}

export function HubInternals({ data }) {
  const coreRef = useRef()
  useFrame(({ clock }) => {
    if (coreRef.current) coreRef.current.rotation.y = clock.elapsedTime * 0.35
  })
  return (
    <group>
      {[-1.25, 0, 1.25].map((x, ri) => (
        <group key={ri} position={[x, 0, 0]}>
          {Array.from({ length: 4 }, (_, i) => (
            <Motherboard key={i} pos={[0, 0.22 + i * 0.42, 0.3]} rot={[0, 0, 0]} size={[0.72, 0.003, 0.3]} color="#040e1c" />
          ))}
          <PowerSupply pos={[0, 0.1, 0.3]} />
          {Array.from({ length: 3 }, (_, i) => (
            <ServoMotor key={i} pos={[0.22 - i * 0.22, 2.0, 0.3]} rot={[Math.PI / 2, 0, 0]} radius={0.042} length={0.055} color="#08121e" rpm={3000} />
          ))}
        </group>
      ))}
      <group ref={coreRef} position={[0, 3.2, -0.25]}>
        <mesh>
          <sphereGeometry args={[0.19, 20, 20]} />
          <meshStandardMaterial color="#001030" metalness={0.5} roughness={0.2} transparent opacity={0.28} />
        </mesh>
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2
          return (
            <mesh key={i} position={[Math.cos(a) * 0.13, Math.sin(a) * 0.055, Math.sin(a) * 0.13]}>
              <boxGeometry args={[0.026, 0.026, 0.026]} />
              <meshStandardMaterial color="#1d4ed8" emissive="#3b82f6" emissiveIntensity={1.8} metalness={0.8} roughness={0.2} />
            </mesh>
          )
        })}
      </group>
      <pointLight position={[0, 3.2, -0.25]} color="#60a5fa" intensity={2.5} distance={4.5} />
    </group>
  )
}
