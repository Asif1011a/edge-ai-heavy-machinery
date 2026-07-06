import os

file_path = "c:\\Users\\zamza\\Downloads\\tata\\src\\components\\MachineMesh.jsx.bak"
dest_path = "c:\\Users\\zamza\\Downloads\\tata\\src\\components\\MachineMesh.jsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Fix the broken StationMesh syntax
broken_syntax = """      <mesh ref={lightRef} position={[0,2.53,-0.15]}>
        <boxGeometry args={[1.82,0.022,0.13]} />
        </group>
      ))}"""

fixed_syntax = """      <mesh ref={lightRef} position={[0,2.53,-0.15]}>
        <boxGeometry args={[1.82,0.022,0.13]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.7} transparent opacity={0.9} />
      </mesh>
      {/* Light hood */}
      {[-0.92,0.92].map((x,i)=>(
        <Box key={i} pos={[x,2.53,-0.15]} size={[0.06,0.024,0.14]} mat={M.panel()} />
      ))}

      {/* DUAL MONITOR ARMS */}
      {[0.55].map((x,i)=>(
        <group key={i} position={[x,0,0]}>
          <Cyl pos={[0,1.52,-0.65]}     args={[0.02,0.02,0.74,8]} mat={M.metal('#2a3448',0.85)} />
          <Box pos={[0.05,1.98,-0.55]} rot={[0.2,0,0]} size={[0.55,0.38,0.04]} mat={M.panel()} />
          <Box pos={[0.05,1.98,-0.525]} rot={[0.2,0,0]} size={[0.48,0.31,0.01]}
            mat={{color:'#020c1a',emissive:accent,emissiveIntensity:0.8}} />
          {/* Monitor stand */}
          <Box pos={[0.05,1.76,-0.62]} size={[0.12,0.015,0.12]} mat={M.panel()} />
        </group>
      ))}"""

if broken_syntax in content:
    content = content.replace(broken_syntax, fixed_syntax)
else:
    print("Could not find broken syntax, maybe it is slightly different?")

# 2. Replace MachineMesh export with XRay version
target_export = "export function MachineMesh({ type, status, selected, data, onClick, xrayMode }) {"
export_idx = content.find(target_export)

if export_idx != -1:
    xray_export_code = """export function MachineMesh({ type, status, selected, data, onClick, xrayMode }) {
  const groupRef = useRef()
  const glowRef  = useRef()
  const statusColor = STATUS_GLOW[status] || '#60a5fa'

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (groupRef.current && status === 'Critical') {
      groupRef.current.scale.setScalar(1 + Math.sin(t * 6) * 0.012)
    } else if (groupRef.current) {
      groupRef.current.scale.setScalar(1)
    }
    if (glowRef.current) {
      glowRef.current.material.opacity = selected
        ? 0.3 + Math.sin(t*2)*0.1
        : xrayMode ? 0.18 + Math.sin(t*1.5)*0.06
        : 0.07 + Math.sin(t*1.5)*0.03
    }
  })

  const render = MESH_MAP[type] || MESH_MAP.cnc

  // Map each machine type to its detailed internal anatomy
  const INTERNAL_MAP = {
    cnc:        <CNCInternals      data={data} />,
    robot:      <RobotInternals    data={data} />,
    conveyor:   <ConveyorInternals data={data} />,
    assembly:   <StationInternals  data={data} />,
    inspection: <StationInternals  data={data} />,
    packaging:  <StationInternals  data={data} />,
    hub:        <HubInternals      data={data} />,
  }

  return (
    <group ref={groupRef} onClick={onClick}>

      {/* Outer shell transparent cyan wireframe when X-Ray is ON */}
      <XRayContext.Provider value={!!xrayMode}>
        {render({ statusColor, data })}
      </XRayContext.Provider>

      {/* X-Ray internal anatomy */}
      {xrayMode && (
        <group>
          {INTERNAL_MAP[type] || INTERNAL_MAP.cnc}

          {/* Holographic bounding-box cage */}
          <mesh position={[0, 1.6, 0]}>
            <boxGeometry args={[3.5, 3.6, 3.5]} />
            <meshBasicMaterial color="#00c8ff" wireframe transparent opacity={0.03} />
          </mesh>

          {/* Sweeping scan beam */}
          <XRayScanBeam />

          {/* Corner bracket markers at floor level */}
          {[[-1.6, 0, -1.6], [1.6, 0, -1.6], [-1.6, 0, 1.6], [1.6, 0, 1.6]].map(([x,, z], i) => (
            <mesh key={i} position={[x, 0.04, z]} rotation={[-Math.PI / 2, 0, i * Math.PI / 2]}>
              <ringGeometry args={[0.1, 0.14, 4]} />
              <meshBasicMaterial color="#00ffee" transparent opacity={0.75} />
            </mesh>
          ))}
        </group>
      )}

      {/* Status glow ring */}
      <mesh ref={glowRef} position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.35, 1.85, 48]} />
        <meshBasicMaterial color={xrayMode ? '#00ffee' : statusColor} transparent opacity={0.07} side={THREE.DoubleSide} />
      </mesh>

      {/* Selection ring */}
      {selected && (
        <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.95, 2.15, 56]} />
          <meshBasicMaterial color={xrayMode ? '#00ffcc' : '#60a5fa'} transparent opacity={0.55} />
        </mesh>
      )}

      {/* Critical pulse ring */}
      {status === 'Critical' && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.2, 2.5, 48]} />
          <meshBasicMaterial color="#ef4444" transparent opacity={0.18} />
        </mesh>
      )}
    </group>
  )
}

// Animated cyan horizontal plane that sweeps up through the machine
function XRayScanBeam() {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.position.y = 0.1 + ((clock.elapsedTime * 0.85) % 3.3)
      ref.current.material.opacity = 0.09 + Math.sin(clock.elapsedTime * 5) * 0.04
    }
  })
  return (
    <mesh ref={ref} position={[0, 0.5, 0]}>
      <boxGeometry args={[4, 0.016, 4]} />
      <meshBasicMaterial color="#00ffee" transparent opacity={0.09} side={THREE.DoubleSide} />
    </mesh>
  )
}
"""
    content = content[:export_idx] + xray_export_code

with open(dest_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Fix applied.")
