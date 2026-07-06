import { createContext, useContext } from 'react'
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CNCInternals, RobotInternals, ConveyorInternals, StationInternals, HubInternals } from './XRayInternals'

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   SHARED MATERIAL HELPERS
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const M = {
  metal:    (c='#4b5563', m=0.9, r=0.15) => ({ color:c, metalness:m, roughness:r, envMapIntensity: 1.8 }),
  darkMet:  (c='#1e293b') => ({ color:c, metalness:0.95, roughness:0.2, envMapIntensity: 1.5 }),
  chrome:   () => ({ color:'#f1f5f9', metalness:1.0, roughness:0.02, envMapIntensity: 2.5 }),
  rubber:   (c='#0f172a') => ({ color:c, metalness:0.1, roughness:0.9, envMapIntensity: 0.2 }),
  glass:    (c='#bae6fd', op=0.35) => ({ color:c, metalness:0.2, roughness:0.05, transparent:true, opacity:op, envMapIntensity: 2.0 }),
  emissive: (c,e,i=1.5) => ({ color:c, emissive:e, emissiveIntensity:i, metalness:0.4, roughness:0.5 }),
  screen:   (e,i=1.2) => ({ color:'#020617', emissive:e, emissiveIntensity:i }),
  panel:    (c='#334155') => ({ color:c, metalness:0.85, roughness:0.25, envMapIntensity: 1.2 }),
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   REUSABLE PRIMITIVE COMPONENTS
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const XRayContext = createContext(false);
function Box({ pos=[0,0,0], rot=[0,0,0], size=[1,1,1], mat }) {
  const xray = useContext(XRayContext);
  return (
    <mesh position={pos} rotation={rot} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial {...mat} wireframe={xray} color={xray ? '#00f0ff' : mat.color} emissive={xray ? '#0088ff' : (mat.emissive||'#000')} emissiveIntensity={xray ? 0.5 : (mat.emissiveIntensity||0)} transparent={xray ? true : mat.transparent} opacity={xray ? 0.3 : mat.opacity} />
    </mesh>
  )
}
function Cyl({ pos=[0,0,0], rot=[0,0,0], args=[0.1,0.1,1,16], mat }) {
  const xray = useContext(XRayContext);
  return (
    <mesh position={pos} rotation={rot} castShadow>
      <cylinderGeometry args={args} />
      <meshStandardMaterial {...mat} wireframe={xray} color={xray ? '#00f0ff' : mat.color} emissive={xray ? '#0088ff' : (mat.emissive||'#000')} emissiveIntensity={xray ? 0.5 : (mat.emissiveIntensity||0)} transparent={xray ? true : mat.transparent} opacity={xray ? 0.3 : mat.opacity} />
    </mesh>
  )
}
function Sph({ pos=[0,0,0], r=0.1, seg=12, mat }) {
  const xray = useContext(XRayContext);
  return (
    <mesh position={pos} castShadow>
      <sphereGeometry args={[r,seg,seg]} />
      <meshStandardMaterial {...mat} wireframe={xray} color={xray ? '#00f0ff' : mat.color} emissive={xray ? '#0088ff' : (mat.emissive||'#000')} emissiveIntensity={xray ? 0.5 : (mat.emissiveIntensity||0)} transparent={xray ? true : mat.transparent} opacity={xray ? 0.3 : mat.opacity} />
    </mesh>
  )
}
function Ring({ pos=[0,0,0], rot=[0,0,0], args, mat }) {
  const xray = useContext(XRayContext);
  return (
    <mesh position={pos} rotation={rot}>
      <torusGeometry args={args} />
      <meshStandardMaterial {...mat} wireframe={xray} color={xray ? '#00f0ff' : mat.color} emissive={xray ? '#0088ff' : (mat.emissive||'#000')} emissiveIntensity={xray ? 0.5 : (mat.emissiveIntensity||0)} transparent={xray ? true : mat.transparent} opacity={xray ? 0.3 : mat.opacity} />
    </mesh>
  )
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   CNC VERTICAL MACHINING CENTER  (Haas VF-2 / DMG Mori style)
   Real dimensions scaled ~1:3.5  â†’  body ~2.5W Ã— 2.7H Ã— 2.0D
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function CNCMesh({ statusColor, data }) {
  const spindleRef = useRef()
  const toolRef    = useRef()
  const atcRef     = useRef()
  const doorRef    = useRef()
  const lightRef   = useRef()

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const rpm = data?.rotational_speed || 1500
    const speed = rpm / 100
    if (spindleRef.current) spindleRef.current.rotation.y = t * speed
    if (toolRef.current)    toolRef.current.rotation.y    = t * speed
    if (atcRef.current)     atcRef.current.rotation.y     = t * (speed * 0.01)
    if (doorRef.current)    doorRef.current.position.x    = -0.78 + Math.sin(t*0.25)*0.05
    if (lightRef.current)   lightRef.current.material.emissiveIntensity = 0.7 + Math.sin(t*3)*0.3
  })

  const bodyGray  = M.metal('#18202e', 0.88, 0.22)
  const darkBody  = M.metal('#0e1520', 0.92, 0.18)
  const accentMet = M.metal('#22304a', 0.85, 0.25)
  const chromeMat = M.chrome()
  const glassMat  = M.glass('#082040', 0.5)
  const panelMat  = M.panel('#0c1624')

  return (
    <group>
      {/* â•â• BASE CASTING (heavy machine base) â•â• */}
      <Box pos={[0, 0.12, 0]}   size={[2.65, 0.24, 2.15]} mat={M.darkMet('#080c12')} />
      <Box pos={[0, 0.26, 0]}   size={[2.55, 0.06, 2.05]} mat={M.metal('#0d1420', 0.9, 0.2)} />
      {/* Base ribbing / legs */}
      {[[-1.1,-0.88],[1.1,-0.88],[-1.1,0.88],[1.1,0.88]].map(([x,z],i)=>(
        <Cyl key={i} pos={[x,0.1,z]} args={[0.09,0.12,0.2,8]} mat={M.darkMet('#060a0f')} />
      ))}
      {/* Front coolant chip tray lip */}
      <Box pos={[0, 0.19, 1.1]}  size={[2.5, 0.08, 0.05]} mat={accentMet} />

      {/* â•â• MAIN COLUMN (Y-axis gantry) â•â• */}
      <Box pos={[0, 1.62, -0.72]} size={[2.55, 2.7, 0.62]} mat={bodyGray} />
      {/* Column face detail â€” recessed guides */}
      <Box pos={[0, 1.62, -0.40]} size={[0.18, 2.55, 0.04]} mat={accentMet} />
      {/* Column cap */}
      <Box pos={[0, 3.02, -0.72]} size={[2.58, 0.1, 0.65]} mat={darkBody} />

      {/* â•â• LEFT / RIGHT SIDE PANELS â•â• */}
      <Box pos={[-1.28, 1.55, 0.2]} size={[0.08, 2.5, 1.6]}  mat={bodyGray} />
      <Box pos={[ 1.28, 1.55, 0.2]} size={[0.08, 2.5, 1.6]}  mat={bodyGray} />
      {/* Panel seam lines */}
      {[-1.27,1.27].map((x,i)=>(
        <Box key={i} pos={[x, 1.55, 0.2]} size={[0.012, 2.4, 0.015]} mat={{color:'#060a12',metalness:0.5}} />
      ))}

      {/* â•â• ROOF / TOP PANEL â•â• */}
      <Box pos={[0, 3.08, 0.2]}  size={[2.6, 0.12, 1.62]} mat={darkBody} />
      {/* Chip guard roof lips */}
      <Box pos={[0, 2.98, 1.05]} size={[2.55, 0.08, 0.06]} mat={accentMet} />

      {/* â•â• FRONT DOOR FRAME â•â• */}
      <Box pos={[-1.2, 1.65, 1.07]} size={[0.12, 2.58, 0.06]} mat={accentMet} />
      <Box pos={[ 1.2, 1.65, 1.07]} size={[0.12, 2.58, 0.06]} mat={accentMet} />
      <Box pos={[0,  3.0,  1.07]}   size={[2.54, 0.1,  0.06]} mat={accentMet} />
      <Box pos={[0,  0.32, 1.07]}   size={[2.54, 0.1,  0.06]} mat={accentMet} />

      {/* â•â• SLIDING GLASS DOOR (left panel) â•â• */}
      <group ref={doorRef}>
        <Box pos={[-0.78, 1.65, 1.09]} size={[1.2, 2.52, 0.04]} mat={glassMat} />
        {/* Door frame border */}
        <Box pos={[-0.78, 1.65, 1.1]}  size={[1.22, 0.055, 0.045]} mat={accentMet} />
        <Box pos={[-0.78, 2.9,  1.1]}  size={[1.22, 0.055, 0.045]} mat={accentMet} />
        {/* Door handle */}
        <Box pos={[-0.2,  1.65, 1.13]} size={[0.04, 0.28, 0.04]}   mat={chromeMat} />
        <Cyl pos={[-0.2,  1.65, 1.15]} rot={[Math.PI/2,0,0]} args={[0.022,0.022,0.07,10]} mat={chromeMat} />
      </group>
      {/* Fixed glass panel (right) */}
      <Box pos={[0.72, 1.65, 1.09]} size={[0.85, 2.52, 0.04]} mat={glassMat} />

      {/* â•â• INTERIOR STRUCTURE â•â• */}
      {/* Interior back wall */}
      <Box pos={[0, 1.65, -0.38]}    size={[2.3, 2.45, 0.04]} mat={{color:'#0c1828',metalness:0.5,roughness:0.5}} />
      {/* Interior floor */}
      <Box pos={[0, 0.36, 0.3]}      size={[2.1, 0.04, 1.1]}  mat={M.metal('#1a2436',0.85,0.25)} />
      {/* Interior side walls */}
      <Box pos={[-1.2, 1.65, 0.3]}   size={[0.04, 2.45, 1.1]} mat={{color:'#0c1828',metalness:0.5,roughness:0.5}} />
      <Box pos={[ 1.2, 1.65, 0.3]}   size={[0.04, 2.45, 1.1]} mat={{color:'#0c1828',metalness:0.5,roughness:0.5}} />

      {/* â•â• X-AXIS LINEAR RAILS (on interior back wall) â•â• */}
      {[1.2, 2.1].map((y,i)=>(
        <Box key={i} pos={[0, y, -0.35]} size={[1.9, 0.06, 0.06]} mat={chromeMat} />
      ))}
      {/* Z-axis column rails */}
      {[-0.14, 0.14].map((x,i)=>(
        <Box key={i} pos={[x, 1.65, -0.38]} size={[0.06, 2.2, 0.06]} mat={chromeMat} />
      ))}

      {/* â•â• SPINDLE HEAD ASSEMBLY (Z-carriage) â•â• */}
      <Box pos={[0, 1.5, -0.25]}  size={[0.52, 0.55, 0.46]}  mat={M.metal('#141e30',0.9,0.18)} />
      {/* Spindle motor housing */}
      <Cyl pos={[0, 1.78, -0.1]}  args={[0.18,0.18,0.38,24]}  mat={M.metal('#1c2840',0.88,0.2)} />
      {/* Spindle nose / quill */}
      <Cyl pos={[0, 1.42, -0.1]}  args={[0.095,0.12,0.26,20]} mat={chromeMat} />
      {/* Tool holder (ISO40/HSK-A63) */}
      <Cyl pos={[0, 1.28, -0.1]}  args={[0.052,0.068,0.22,16]} mat={M.metal('#909ab0',0.95,0.08)} />
      {/* Spinning endmill */}
      <group ref={spindleRef} position={[0,1.28,-0.1]}>
        <Cyl pos={[0,-0.1,0]} args={[0.028,0.034,0.24,8]} mat={M.metal('#c0ccd8',1.0,0.03)} />
        {[0,1,2,3].map(i=>(
          <Box key={i} pos={[0,-0.1,0]}
            rot={[0, i*Math.PI/2, 0]}
            size={[0.056,0.22,0.01]}
            mat={{color:'#c0ccd8',metalness:1,roughness:0.05}} />
        ))}
      </group>
      {/* Coolant nozzles (pair) */}
      {[-0.07,0.07].map((x,i)=>(
        <Cyl key={i} pos={[x,1.4,-0.02]} rot={[0.5,0,0]} args={[0.01,0.01,0.22,6]} mat={M.metal('#607080')} />
      ))}
      {/* Spindle light (ring LED) */}
      <Ring pos={[0,1.45,-0.08]} rot={[Math.PI/2,0,0]} args={[0.14,0.018,8,32]}
        mat={{color:'#22d3ee',emissive:'#22d3ee',emissiveIntensity:0.8}} />

      {/* â•â• WORK TABLE / PALLET â•â• */}
      <Box pos={[0, 0.54, 0.18]}  size={[1.72, 0.1, 1.2]}  mat={M.metal('#1a2840',0.88,0.3)} />
      {/* T-slot grooves */}
      {[-0.52,-0.18,0.18,0.52].map((z,i)=>(
        <Box key={i} pos={[0, 0.6, z]} size={[1.65, 0.04, 0.08]} mat={{color:'#060a12',metalness:0.7}} />
      ))}
      {/* Workpiece on table */}
      <Box pos={[0.2, 0.67, 0.1]}  size={[0.32, 0.14, 0.22]} mat={M.metal('#304060',0.85,0.3)} />

      {/* â•â• ATC â€” AUTOMATIC TOOL CHANGER (left side, chain/carousel type) â•â• */}
      <group position={[-1.36, 1.8, -0.3]}>
        {/* ATC housing */}
        <Box pos={[0, 0, 0]}    size={[0.18, 1.1, 0.8]}  mat={darkBody} />
        <Box pos={[0, 0, 0.42]} size={[0.18, 1.1, 0.04]} mat={accentMet} />
        {/* Tool carousel disc */}
        <group ref={atcRef} position={[0.12, 0, 0]}>
          <Cyl pos={[0,0,0]} rot={[0,0,Math.PI/2]} args={[0.35,0.35,0.06,24]} mat={M.metal('#141e2e',0.9,0.2)} />
          {/* 12 tool pockets around disc */}
          {Array.from({length:12},(_,i)=>{
            const a = (i/12)*Math.PI*2
            return (
              <group key={i} position={[0, Math.sin(a)*0.27, Math.cos(a)*0.27]} rotation={[a,0,0]}>
                <Cyl pos={[0,0,0]} rot={[0,0,Math.PI/2]} args={[0.04,0.04,0.1,8]} mat={chromeMat} />
              </group>
            )
          })}
        </group>
      </group>

      {/* â•â• CONTROL PENDANT (Fanuc-style, right side) â•â• */}
      {/* Pendant arm */}
      <Cyl pos={[1.44,1.5,0.8]} rot={[0,0,0.3]} args={[0.025,0.025,0.75,10]} mat={accentMet} />
      {/* Pendant box */}
      <Box pos={[1.56, 1.08, 0.88]} rot={[0.12,-0.28,0]} size={[0.22,0.34,0.07]} mat={panelMat} />
      {/* Screen */}
      <Box pos={[1.575,1.1,0.925]} rot={[0.12,-0.28,0]} size={[0.16,0.22,0.01]}
        mat={{color:'#030e1c',emissive:'#0a4080',emissiveIntensity:0.8}} />
      {/* Keypad buttons */}
      {[[-0.04,-0.07],[0.04,-0.07],[0,-0.02],[-0.04,-0.02],[0.04,-0.02]].map(([dx,dy],i)=>(
        <Box key={i} pos={[1.575+dx, 1.0+dy, 0.93]} rot={[0.12,-0.28,0]}
          size={[0.025,0.02,0.008]} mat={{color:['#1d4ed8','#dc2626','#16a34a','#d97706','#6d28d9'][i],metalness:0.5,roughness:0.5}} />
      ))}
      {/* E-stop mushroom button */}
      <Cyl pos={[1.565, 0.88, 0.93]} rot={[Math.PI/2,0,-0.28]} args={[0.022,0.022,0.02,12]}
        mat={{color:'#dc2626',emissive:'#dc2626',emissiveIntensity:0.4}} />

      {/* â•â• STATUS LIGHT TOWER â•â• */}
      <Cyl pos={[1.1, 2.8, -0.55]}  args={[0.028,0.028,0.52,10]} mat={accentMet} />
      <Cyl pos={[1.1, 3.12, -0.55]} args={[0.058,0.058,0.11,12]} mat={{color:'#7f1d1d',emissive:'#ef4444',emissiveIntensity:0.2}} />
      <Cyl pos={[1.1, 3.24, -0.55]} args={[0.058,0.058,0.11,12]} mat={{color:'#713f12',emissive:'#f59e0b',emissiveIntensity:0.2}} />
      <Cyl ref={lightRef} pos={[1.1, 3.36, -0.55]} args={[0.058,0.058,0.11,12]}
        mat={{color:'#14532d',emissive:'#22c55e',emissiveIntensity:0.8}} />
      <Cyl pos={[1.1, 3.44, -0.55]} args={[0.035,0.035,0.09,8]} mat={accentMet} />

      {/* â•â• COOLANT TANK (front lower) â•â• */}
      <Box pos={[0.7, 0.22, 1.06]}  size={[0.7, 0.3, 0.08]}  mat={darkBody} />
      <Box pos={[0.7, 0.22, 1.1]}   size={[0.64, 0.24, 0.03]} mat={{color:'#0a1828',metalness:0.6,roughness:0.5}} />

      {/* â•â• CHIP CONVEYOR (rear, on base) â•â• */}
      <Box pos={[-1.15, 0.2, -0.3]}  size={[0.28, 0.12, 1.8]} mat={darkBody} />
      <Box pos={[-1.15, 0.27, -0.3]} size={[0.22, 0.04, 1.7]} mat={{color:'#101828',metalness:0.5}} />

      {/* â•â• ELECTRICAL CABINET (rear right) â•â• */}
      <Box pos={[1.15, 0.9, -0.9]}  size={[0.28, 1.4, 0.25]}  mat={darkBody} />
      <Box pos={[1.15, 0.9, -0.77]} size={[0.24, 1.3, 0.01]}  mat={panelMat} />
      {/* Cabinet indicator strip */}
      <Box pos={[1.15, 1.5, -0.77]} size={[0.18, 0.06, 0.012]}
        mat={{color:'#0e2040',emissive:statusColor,emissiveIntensity:0.6}} />

      {/* â•â• STATUS INDICATORS on front â•â• */}
      {[0,1,2,3].map(i=>(
        <Sph key={i} pos={[-0.6+i*0.22, 3.0, 1.08]} r={0.024} seg={8}
          mat={{color:i===0?statusColor:'#1d4ed8',emissive:i===0?statusColor:'#1d4ed8',emissiveIntensity:i===0?1.2:0.5}} />
      ))}
    </group>
  )
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   6-DOF INDUSTRIAL ROBOT ARM  (FANUC M-20iA / ABB IRB style)
   Characteristic orange body with precise joint proportions
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function RobotMesh({ statusColor, data }) {
  const j1=useRef(), j2=useRef(), j3=useRef(), j4=useRef(), j5=useRef()
  const gripL=useRef(), gripR=useRef(), baseRing=useRef()

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const speedMod = (data?.machine_load || 50) / 50
    if(j1.current) j1.current.rotation.y  =  Math.sin(t*0.4*speedMod)*0.9
    if(j2.current) j2.current.rotation.z  = -0.55 + Math.sin(t*0.55*speedMod)*0.45
    if(j3.current) j3.current.rotation.z  =  0.5  + Math.sin(t*0.8*speedMod)*0.38
    if(j4.current) j4.current.rotation.y  =  Math.sin(t*1.2*speedMod)*0.7
    if(j5.current) j5.current.rotation.z  =  Math.sin(t*1.8*speedMod)*0.3
    const g = 0.04 + Math.abs(Math.sin(t*2*speedMod))*0.08
    if(gripL.current) gripL.current.position.x = -g
    if(gripR.current) gripR.current.position.x =  g
    if(baseRing.current) baseRing.current.material.emissiveIntensity = 0.5+Math.sin(t*2)*0.2
  })

  // FANUC orange + dark gray joints
  const orange = { color:'#c44a00', metalness:0.7, roughness:0.3 }
  const jGray  = { color:'#707888', metalness:0.88, roughness:0.14 }
  const jDark  = { color:'#2a3240', metalness:0.92, roughness:0.18 }
  const grip   = { color:'#c0ccd8', metalness:0.96, roughness:0.06 }
  const chromeMat = M.chrome()

  return (
    <group>
      {/* â•â• BASE PEDESTAL â•â• */}
      {/* Heavy base plate */}
      <Cyl pos={[0,0.06,0]}  args={[0.6,0.66,0.12,24]} mat={M.darkMet('#080c14')} />
      {/* Base body */}
      <Cyl pos={[0,0.28,0]}  args={[0.5,0.55,0.32,24]} mat={jDark} />
      {/* Cable entry */}
      <Cyl pos={[0.42,0.1,0]} rot={[0,0,Math.PI/2]} args={[0.055,0.055,0.14,10]} mat={M.darkMet()} />
      {/* Status ring */}
      <mesh ref={baseRing} position={[0,0.44,0]} rotation={[-Math.PI/2,0,0]}>
        <ringGeometry args={[0.52,0.58,36]} />
        <meshStandardMaterial color={statusColor} emissive={statusColor} emissiveIntensity={0.6} side={THREE.DoubleSide} />
      </mesh>

      {/* â•â• J1: WAIST ROTATION HOUSING â•â• */}
      <group ref={j1} position={[0,0.44,0]}>
        {/* Waist drum */}
        <Cyl pos={[0,0.24,0]}  args={[0.36,0.4,0.48,24]}  mat={orange} />
        {/* Harmonic drive cover */}
        <Cyl pos={[0,0.5,0]}   args={[0.26,0.26,0.1,20]}  mat={jGray} />
        {/* Cable conduit stub */}
        <Cyl pos={[0.32,0.28,0]} rot={[0,0,Math.PI/2]} args={[0.04,0.04,0.18,8]} mat={jDark} />

        {/* â•â• J2: SHOULDER â•â• */}
        <group ref={j2} position={[0,0.56,0]}>
          {/* Shoulder cross-bar */}
          <Cyl pos={[0,0,0]} rot={[Math.PI/2,0,0]} args={[0.18,0.18,0.55,18]} mat={jGray} />
          {/* Counterbalance cylinder (left) */}
          <Cyl pos={[-0.2,0.1,-0.12]} rot={[0.4,0,0]} args={[0.045,0.045,0.4,10]} mat={jDark} />

          {/* â”€â”€ LOWER ARM LINK (J2â†’J3) â”€â”€ */}
          {/* Main link body */}
          <Box pos={[0,0.6,0]}    size={[0.26,1.18,0.28]} mat={orange} />
          {/* Link ribs */}
          {[-0.1,0.1].map((x,i)=>(
            <Box key={i} pos={[x,0.6,0]} size={[0.04,1.14,0.32]} mat={{color:'#a03a00',metalness:0.75,roughness:0.3}} />
          ))}
          {/* Motor bulge (J2 servo) */}
          <Cyl pos={[0.18,0.82,0]} rot={[0,0,Math.PI/2]} args={[0.12,0.12,0.14,16]} mat={jDark} />

          {/* â•â• J3: ELBOW â•â• */}
          <group ref={j3} position={[0,1.24,0]}>
            {/* Elbow cross joint */}
            <Cyl pos={[0,0,0]} rot={[Math.PI/2,0,0]} args={[0.155,0.155,0.42,18]} mat={jGray} />
            {/* Motor housing */}
            <Cyl pos={[0,0.08,0.22]} args={[0.1,0.1,0.22,14]} mat={jDark} />

            {/* â”€â”€ FOREARM LINK (J3â†’J4) â”€â”€ */}
            <Box pos={[0,0.42,0]} size={[0.22,0.82,0.24]} mat={orange} />
            {/* Forearm taper toward wrist */}
            <Box pos={[0,0.82,0.02]} size={[0.17,0.15,0.2]}  mat={orange} />
            {/* Cable loom on forearm */}
            <Cyl pos={[0.14,0.5,0.05]} rot={[0,0,0.15]} args={[0.025,0.025,0.7,6]}
              mat={{color:'#1d4ed8',roughness:0.85}} />

            {/* â•â• J4: WRIST ROTATION â•â• */}
            <group ref={j4} position={[0,0.88,0]}>
              <Cyl pos={[0,0,0]} rot={[Math.PI/2,0,0]} args={[0.105,0.105,0.28,16]} mat={jGray} />
              {/* J5 link housing */}
              <Cyl pos={[0,0.12,0]} args={[0.09,0.09,0.14,14]} mat={orange} />

              {/* â•â• J5: WRIST BEND â•â• */}
              <group ref={j5} position={[0,0.22,0]}>
                <Cyl pos={[0,0,0]} rot={[Math.PI/2,0,0]} args={[0.085,0.085,0.22,14]} mat={jGray} />
                {/* J6 flange */}
                <Cyl pos={[0,0.1,0]}  args={[0.076,0.076,0.08,14]} mat={jGray} />
                {/* Tool mounting plate */}
                <Cyl pos={[0,0.15,0]} args={[0.075,0.075,0.02,14]} mat={chromeMat} />
                {/* Bolt holes on flange */}
                {[0,1,2,3,4,5].map(i=>{
                  const a=(i/6)*Math.PI*2
                  return <Cyl key={i} pos={[Math.cos(a)*0.054,0.16,Math.sin(a)*0.054]}
                    args={[0.008,0.008,0.025,6]} mat={M.darkMet()} />
                })}

                {/* â•â• GRIPPER (Parallel jaw) â•â• */}
                {/* Gripper body */}
                <Box pos={[0,0.27,0]}  size={[0.3,0.1,0.14]}  mat={jDark} />
                {/* Pneumatic cylinder */}
                <Cyl pos={[0,0.27,0.04]} rot={[Math.PI/2,0,0]} args={[0.03,0.03,0.1,10]} mat={jGray} />
                {/* Moving fingers */}
                {[[-1,gripL],[1,gripR]].map(([side,ref],i)=>(
                  <group key={i}>
                    <mesh ref={ref} position={[side*0.1,0.4,0]}>
                      <boxGeometry args={[0.06,0.28,0.1]} />
                      <meshStandardMaterial {...grip} />
                    </mesh>
                    {/* Rubber tip on finger */}
                    <mesh position={[side*0.1,0.55,0.02]}>
                      <boxGeometry args={[0.055,0.04,0.07]} />
                      <meshStandardMaterial {...M.rubber()} />
                    </mesh>
                    {/* Finger serrations */}
                    {[0,1,2].map(k=>(
                      <Box key={k} pos={[side*0.1,0.42+k*0.05,-0.03]} size={[0.055,0.014,0.012]}
                        mat={{color:'#90a0b0',metalness:0.9,roughness:0.2}} />
                    ))}
                  </group>
                ))}
                {/* Force sensor (round) */}
                <Cyl pos={[0,0.19,0]} args={[0.06,0.06,0.025,14]}
                  mat={{color:'#1a3050',emissive:'#1d4ed8',emissiveIntensity:0.5}} />
              </group>
            </group>
          </group>
        </group>
      </group>

      {/* â•â• TEACH PENDANT HOLDER â•â• */}
      <Box pos={[-0.5, 0.5, -0.42]} size={[0.14,0.26,0.06]} mat={jDark} />
      <Box pos={[-0.5, 0.5, -0.39]} size={[0.1, 0.19,0.01]}
        mat={{color:'#020e1c',emissive:'#0a4080',emissiveIntensity:0.7}} />
      {/* Coiled cable */}
      {[0,1,2,3].map(i=>(
        <Cyl key={i} pos={[-0.44, 0.32+i*0.06, -0.38]} rot={[0.5,0,0]}
          args={[0.02,0.02,0.07,6]} mat={{color:'#1a2030',roughness:0.9}} />
      ))}
    </group>
  )
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   HEAVY-DUTY INDUSTRIAL CONVEYOR BELT
   Modelled after Hytrol/Dorner industrial conveyors
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function ConveyorMesh({ statusColor, data }) {
  const beltRef  = useRef()
  const box1=useRef(), box2=useRef(), box3=useRef()
  const motorRef = useRef()

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const torque = data?.torque || 35
    const speed = 0.38 * (torque / 35)
    const wrap = 2.8
    ;[box1,box2,box3].forEach((r,i)=>{
      if(r.current) r.current.position.x = ((-1.35 + t*speed + i*0.95)%wrap) - 1.42
    })
    if(motorRef.current) motorRef.current.rotation.y = t*(8 * (torque / 35))
    if(beltRef.current && beltRef.current.material)
      beltRef.current.material.emissiveIntensity = 0.04+Math.sin(t*5)*0.02
  })

  const frameMat  = M.metal('#141e2c',0.88,0.22)
  const rollerMat = M.metal('#0a1018',0.94,0.14)
  const beltMat   = {color:'#0e1620',metalness:0.12,roughness:0.9,emissive:'#1a2840',emissiveIntensity:0.04}
  const legMat    = M.darkMet('#080c12')

  return (
    <group>
      {/* â•â• MAIN SIDE FRAMES (C-channel steel) â•â• */}
      {[-0.52,0.52].map((z,i)=>(
        <group key={i}>
          {/* Web */}
          <Box pos={[0,0.45,z]}         size={[2.9,0.12,0.09]}  mat={frameMat} />
          {/* Top flange */}
          <Box pos={[0,0.52,z]}         size={[2.88,0.04,0.14]} mat={frameMat} />
          {/* Bottom flange */}
          <Box pos={[0,0.38,z]}         size={[2.88,0.04,0.14]} mat={frameMat} />
          {/* Front/rear end plates */}
          <Box pos={[-1.44,0.45,z]}     size={[0.06,0.18,0.14]} mat={frameMat} />
          <Box pos={[1.44,0.45,z]}      size={[0.06,0.18,0.14]} mat={frameMat} />
        </group>
      ))}

      {/* â•â• CROSS-TIES (ladder rungs) â•â• */}
      {[-1.0,-0.5,0,0.5,1.0].map((x,i)=>(
        <Box key={i} pos={[x,0.42,0]} size={[0.05,0.07,1.08]} mat={legMat} />
      ))}

      {/* â•â• SUPPORT LEGS (4 pairs with gussets) â•â• */}
      {[-1.1,-0.35,0.35,1.1].map((x,i)=>(
        <group key={i}>
          {[-0.44,0.44].map((z,j)=>(
            <group key={j}>
              {/* Leg tube */}
              <Box pos={[x,0.2,z]}    size={[0.075,0.4,0.075]} mat={legMat} />
              {/* Leveling foot */}
              <Cyl pos={[x,0.02,z]}   args={[0.055,0.07,0.04,8]} mat={{color:'#060810',metalness:0.6}} />
              {/* Gusset plate */}
              <Box pos={[x,0.36,z]}   size={[0.065,0.06,0.12]}  mat={legMat} />
            </group>
          ))}
          {/* Cross brace */}
          <Box pos={[x,0.22,0]} size={[0.06,0.06,0.92]} mat={legMat} />
        </group>
      ))}

      {/* â•â• DRIVE DRUMS (end rollers) â•â• */}
      {[-1.43,1.43].map((x,i)=>(
        <group key={i}>
          <Cyl pos={[x,0.5,0]} rot={[Math.PI/2,0,0]} args={[0.135,0.135,0.96,20]} mat={rollerMat} />
          {/* Drum shaft stub */}
          {[-0.5,0.5].map((dz,j)=>(
            <Cyl key={j} pos={[x,0.5,dz*0.98]} rot={[Math.PI/2,0,0]} args={[0.04,0.04,0.06,8]} mat={M.chrome()} />
          ))}
        </group>
      ))}

      {/* â•â• IDLER ROLLERS (7) â•â• */}
      {[-1.0,-0.67,-0.33,0,0.33,0.67,1.0].map((x,i)=>(
        <group key={i}>
          <Cyl pos={[x,0.5,0]} rot={[Math.PI/2,0,0]} args={[0.055,0.055,0.94,14]} mat={M.metal('#1a2030',0.88,0.22)} />
          {/* Roller bearing housings */}
          {[-0.48,0.48].map((dz,j)=>(
            <Cyl key={j} pos={[x,0.5,dz]} rot={[Math.PI/2,0,0]} args={[0.07,0.07,0.04,10]} mat={rollerMat} />
          ))}
        </group>
      ))}

      {/* â•â• BELT SURFACE â•â• */}
      <mesh ref={beltRef} position={[0,0.58,0]} castShadow>
        <boxGeometry args={[2.85,0.04,0.9]} />
        <meshStandardMaterial {...beltMat} />
      </mesh>
      {/* Belt ribs (chevron pattern) */}
      {Array.from({length:22},(_,i)=>(
        <Box key={i} pos={[-1.38+i*0.132,0.605,0]} size={[0.03,0.018,0.88]}
          mat={{color:'#1a2840',roughness:0.9}} />
      ))}
      {/* Belt return (bottom) */}
      <Box pos={[0,0.4,0]} size={[2.84,0.025,0.84]} mat={{color:'#0a1018',roughness:0.9}} />

      {/* â•â• DRIVE MOTOR + GEARBOX (right end) â•â• */}
      <group position={[1.5,0.5,0.32]}>
        {/* Gearbox */}
        <Box pos={[0,0,0]}     size={[0.25,0.26,0.34]} mat={M.metal('#0e1828',0.85,0.3)} />
        <Box pos={[0,0,0.19]}  size={[0.22,0.22,0.03]} mat={M.panel()} />
        {/* Motor */}
        <Cyl pos={[0.2,0,0]} rot={[0,0,Math.PI/2]} args={[0.1,0.1,0.32,16]} mat={M.metal('#0c1420',0.88,0.25)} />
        {/* Motor fan cover */}
        <Cyl pos={[0.38,0,0]} rot={[0,0,Math.PI/2]} args={[0.105,0.105,0.05,16]} mat={M.darkMet()} />
        {/* Cooling fins */}
        {[0,1,2,3,4].map(i=>(
          <Box key={i} pos={[0.27,0,i*0.04-0.08]} size={[0.22,0.005,0.03]} mat={M.darkMet()} />
        ))}
        {/* Rotating fan */}
        <group ref={motorRef} position={[0.38,0,0]}>
          {[0,1,2,3].map(i=>(
            <Box key={i} pos={[0,0,0]} rot={[i*Math.PI/2,0,Math.PI/2]}
              size={[0.18,0.012,0.025]} mat={{color:'#1a2436',metalness:0.7}} />
          ))}
        </group>
      </group>

      {/* â•â• CONTROL BOX (side) â•â• */}
      <Box pos={[-1.3, 0.55, -0.58]} size={[0.22,0.28,0.14]} mat={M.panel()} />
      <Box pos={[-1.3, 0.55, -0.51]} size={[0.16,0.2,0.01]}
        mat={{color:'#020c18',emissive:statusColor,emissiveIntensity:0.6}} />
      {/* E-stop */}
      <Cyl pos={[-1.3,0.72,-0.52]} rot={[Math.PI/2,0,0]} args={[0.02,0.02,0.02,10]}
        mat={{color:'#dc2626',emissive:'#dc2626',emissiveIntensity:0.5}} />

      {/* â•â• SIDE GUARD RAILS â•â• */}
      {[-0.54,0.54].map((z,i)=>(
        <Box key={i} pos={[0,0.78,z]} size={[2.82,0.028,0.014]}
          mat={{color:statusColor,emissive:statusColor,emissiveIntensity:0.4,transparent:true,opacity:0.7}} />
      ))}

      {/* â•â• PRODUCT BOXES ON BELT (sliding) â•â• */}
      {[[box1,'#4a2010'],[box2,'#1a3a60'],[box3,'#2a1a50']].map(([ref,col],i)=>(
        <mesh key={i} ref={ref} position={[0, 0.65, (i-1)*0.22]} castShadow>
          <boxGeometry args={[0.3,0.24,0.22]} />
          <meshStandardMaterial color={col} roughness={0.7} metalness={0.05} />
        </mesh>
      ))}

      {/* â•â• PHOTOCELL SENSORS â•â• */}
      {[-1.2,1.2].map((x,i)=>(
        <group key={i}>
          <Box pos={[x,0.7,-0.54]} size={[0.06,0.08,0.06]} mat={M.panel()} />
          <Box pos={[x,0.7,-0.51]} size={[0.02,0.02,0.01]}
            mat={{color:'#22d3ee',emissive:'#22d3ee',emissiveIntensity:0.9}} />
        </group>
      ))}
    </group>
  )
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   INDUSTRIAL WORKSTATION  (Assembly / Inspection / Packaging)
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function StationMesh({ statusColor, variant, data }) {
  const scanRef  = useRef()
  const armRef   = useRef()
  const lightRef = useRef()

  const accent = variant==='inspection' ? '#22d3ee' : variant==='packaging' ? '#a78bfa' : '#34d399'

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const load = (data?.machine_load || 50) / 50
    if(lightRef.current) lightRef.current.material.emissiveIntensity = 0.6+Math.sin(t*2)*0.25
    if(armRef.current  && variant==='assembly')   armRef.current.rotation.z = -0.5+Math.sin(t*0.9*load)*0.3
    if(scanRef.current && variant==='inspection') {
      scanRef.current.position.x = Math.sin(t*1.4*load)*0.38
      scanRef.current.material.emissiveIntensity = 0.6+Math.sin(t*5)*0.35
    }
  })

  const cabinetMat = M.metal('#0c1420',0.85,0.28)
  const surfMat    = M.metal('#182436',0.92,0.18)

  return (
    <group>
      {/* â•â• BASE CABINET â•â• */}
      <Box pos={[0,0.52,0]} size={[2.1,1.04,1.55]} mat={cabinetMat} />
      {/* Cabinet panels (doors) */}
      {[-0.54,0.54].map((x,i)=>(
        <group key={i}>
          <Box pos={[x,0.52,0.79]} size={[0.96,0.9,0.03]}  mat={M.panel()} />
          {/* Handle */}
          <Box pos={[x,0.52,0.83]} size={[0.2,0.025,0.025]} mat={M.chrome()} />
          {/* Hinge pins */}
          {[-0.35,0.35].map((dy,j)=>(
            <Cyl key={j} pos={[x+(i?-0.45:0.45),0.52+dy,0.81]} rot={[Math.PI/2,0,0]}
              args={[0.01,0.01,0.04,6]} mat={M.chrome()} />
          ))}
        </group>
      ))}
      {/* Ventilation slots */}
      {[-0.6,-0.2,0.2,0.6].map((x,i)=>(
        <Box key={i} pos={[x,0.2,0.79]} size={[0.06,0.18,0.02]} mat={{color:'#060a12',metalness:0.6}} />
      ))}

      {/* â•â• WORK SURFACE â•â• */}
      <Box pos={[0,1.07,0]}      size={[2.16,0.072,1.6]}  mat={surfMat} />
      {/* Rubber edge strip */}
      <Box pos={[0,1.11,0.8]}    size={[2.14,0.025,0.012]} mat={M.rubber()} />
      {/* Surface edge accent */}
      <Box pos={[0,1.12,0.8]}    size={[2.12,0.015,0.008]}
        mat={{color:accent,emissive:accent,emissiveIntensity:0.5}} />

      {/* â•â• BACK UPRIGHT FRAME â•â• */}
      {[-0.95,0.95].map((x,i)=>(
        <Box key={i} pos={[x,1.75,-0.74]} size={[0.07,1.42,0.07]} mat={M.metal('#141e30',0.88,0.22)} />
      ))}
      <Box pos={[0,2.5,-0.74]}   size={[1.96,0.07,0.07]} mat={M.metal('#141e30',0.88,0.22)} />
      {/* Pegboard back panel */}
      <Box pos={[0,1.72,-0.72]}  size={[1.92,1.28,0.04]} mat={{color:'#0a1220',metalness:0.5,roughness:0.7}} />
      {/* Pegboard holes */}
      {Array.from({length:4},(_,row)=>Array.from({length:6},(_,col)=>(
        <Cyl key={`${row}-${col}`} pos={[-0.72+col*0.28, 1.28+row*0.28, -0.7]}
          args={[0.015,0.015,0.05,6]} mat={{color:'#050810',metalness:0.5}} />
      )))}

      {/* â•â• OVERHEAD LIGHT BAR â•â• */}
      <Box pos={[0,2.6,-0.15]}   size={[1.88,0.07,0.16]} mat={M.panel()} />
      <mesh ref={lightRef} position={[0,2.53,-0.15]}>
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
      ))}

      {/* â•â• VARIANT-SPECIFIC DETAILS â•â• */}
      {variant==='assembly' && (
        <>
          {/* Torque screwdriver arm */}
          <group ref={armRef} position={[-0.72,1.52,-0.4]}>
            <Cyl pos={[0,0,0]}      args={[0.02,0.02,0.62,8]} mat={M.metal('#374151')} />
            <Box pos={[0,0.38,0]}   size={[0.12,0.1,0.1]}      mat={M.panel()} />
            <Cyl pos={[0,0.5,0]}    args={[0.018,0.014,0.28,8]} mat={M.chrome()} />
            <Cyl pos={[0,0.66,0]}   args={[0.008,0.008,0.1,6]}  mat={M.chrome()} />
          </group>
          {/* Part bins on pegboard */}
          {[-0.55,0,0.55].map((x,i)=>(
            <Box key={i} pos={[x,1.85,-0.66]} size={[0.44,0.16,0.26]}
              mat={{color:['#1e3a5f','#1c2a4a','#1a2a3a'][i],metalness:0.6,roughness:0.5}} />
          ))}
          {/* Assembly parts on surface */}
          {[-0.4,0,0.4].map((x,i)=>(
            <Cyl key={i} pos={[x,1.12,0.25]} args={[0.055,0.075,0.08,14]}
              mat={M.metal('#5070a0',0.9,0.15)} />
          ))}
          {/* Fixture plate */}
          <Box pos={[0,1.12,0.15]} size={[0.6,0.04,0.38]} mat={M.metal('#243040',0.85,0.3)} />
        </>
      )}

      {variant==='inspection' && (
        <>
          {/* Camera gantry */}
          {[-0.8,0.8].map((x,i)=>(
            <Box key={i} pos={[x,2.1,0.22]} size={[0.06,2.1,0.06]} mat={M.metal('#182030',0.9)} />
          ))}
          <Box pos={[0,3.22,0.22]}  size={[1.68,0.06,0.06]} mat={M.metal('#182030',0.9)} />
          {/* Camera body */}
          <Box pos={[0,2.95,0.22]}  size={[0.18,0.15,0.2]}  mat={M.panel()} />
          {/* Lens assembly */}
          <Cyl pos={[0,2.95,0.34]}  args={[0.06,0.07,0.1,16]} mat={M.metal('#0a1828',0.3,0.1)} />
          <Cyl pos={[0,2.95,0.39]}  args={[0.04,0.04,0.02,14]} mat={{color:'#000810',metalness:0.1,roughness:0.0,transparent:true,opacity:0.8}} />
          {/* Ring light */}
          <Ring pos={[0,2.78,0.34]} rot={[Math.PI/2,0,0]} args={[0.14,0.02,8,32]}
            mat={{color:accent,emissive:accent,emissiveIntensity:0.9}} />
          {/* Scan laser beam */}
          <mesh ref={scanRef} position={[0,2.5,0.34]} rotation={[Math.PI/2,0,0]}>
            <planeGeometry args={[0.7,0.012]} />
            <meshBasicMaterial color={accent} transparent opacity={0.75} side={THREE.DoubleSide} />
          </mesh>
          {/* Measurement part on stage */}
          <Box pos={[0,1.12,0.25]} size={[0.3,0.04,0.22]} mat={M.metal('#283c54',0.88,0.22)} />
          {/* Stage fixture clamps */}
          {[-0.14,0.14].map((x,i)=>(
            <Box key={i} pos={[x,1.15,0.3]} size={[0.04,0.06,0.12]} mat={M.metal('#1a2840',0.85)} />
          ))}
          {/* Pass/Fail indicator tower */}
          <Cyl pos={[-0.88,1.42,-0.15]} args={[0.025,0.025,0.62,8]} mat={M.panel()} />
          <Cyl pos={[-0.88,1.76,-0.15]} args={[0.055,0.055,0.1,10]}
            mat={{color:accent,emissive:accent,emissiveIntensity:1.0}} />
        </>
      )}

      {variant==='packaging' && (
        <>
          {/* Box erector frame */}
          {[-0.65,0.65].map((x,i)=>(
            <Box key={i} pos={[x,1.7,0.15]} size={[0.07,1.25,0.07]} mat={M.metal('#182030',0.88)} />
          ))}
          <Box pos={[0,2.38,0.15]}  size={[1.38,0.07,0.07]} mat={M.metal('#182030',0.88)} />
          {/* Label applicator */}
          <Cyl pos={[0.55,1.55,0.1]} rot={[0,0,-0.35]} args={[0.022,0.022,0.6,8]} mat={M.metal('#374151')} />
          <Box pos={[0.7,1.28,0.1]}  size={[0.18,0.1,0.12]} mat={M.panel()} />
          <Box pos={[0.7,1.28,0.17]} size={[0.1,0.06,0.015]}
            mat={{color:'#f8fafc',emissive:'#f0f4ff',emissiveIntensity:0.4}} />
          {/* Tape dispenser */}
          <Cyl pos={[0.3,1.15,-0.05]} args={[0.07,0.07,0.07,14]} mat={M.metal('#1f3a5f',0.6)} />
          <Cyl pos={[0.3,1.15,-0.05]} args={[0.04,0.04,0.08,10]} mat={M.chrome()} />
          {/* Stack of boxes on surface */}
          {[0,1,2].map(i=>(
            <Box key={i} pos={[-0.3,1.13+i*0.26,0.25]} size={[0.32,0.24,0.26]}
              mat={{color:['#7c3d12','#92400e','#78350f'][i],roughness:0.7,metalness:0.05}} />
          ))}
          {/* Wrapped/sealed box */}
          <Box pos={[0,1.12,-0.1]}    size={[0.28,0.22,0.22]} mat={{color:'#d1d5db',roughness:0.8,metalness:0.0}} />
          <Box pos={[0,1.12,-0.1]}    size={[0.29,0.005,0.23]}
            mat={{color:accent,emissive:accent,emissiveIntensity:0.4,transparent:true,opacity:0.8}} />
        </>
      )}

      {/* â•â• SAFETY FENCE POSTS â•â• */}
      {[[-1.12,-0.82],[1.12,-0.82],[-1.12,0.82],[1.12,0.82]].map(([x,z],i)=>(
        <Cyl key={i} pos={[x,0.75,z]} args={[0.025,0.025,1.4,8]}
          mat={{color:accent,emissive:accent,emissiveIntensity:0.35}} />
      ))}
      {/* Fence rails */}
      <Box pos={[0,1.06,-0.82]}    size={[2.28,0.018,0.014]}
        mat={{color:accent,emissive:accent,emissiveIntensity:0.25,transparent:true,opacity:0.6}} />
      <Box pos={[0,1.06,0.82]}     size={[2.28,0.018,0.014]}
        mat={{color:accent,emissive:accent,emissiveIntensity:0.25,transparent:true,opacity:0.6}} />
    </group>
  )
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   AI CONTROL HUB â€” Server Rack Array + Holographic Display
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function HubMesh({ statusColor, data }) {
  const ring1=useRef(), ring2=useRef(), ring3=useRef()
  const coreRef=useRef(), screenRef=useRef()

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const load = (data?.machine_load || 50) / 50
    if(ring1.current) ring1.current.rotation.y = t*(0.6*load)
    if(ring2.current) ring2.current.rotation.x = t*(0.4*load)
    if(ring3.current) ring3.current.rotation.z = t*(0.3*load)
    if(coreRef.current) coreRef.current.material.emissiveIntensity = 0.9+Math.sin(t*2.5*load)*0.35
    if(screenRef.current) screenRef.current.material.emissiveIntensity = 0.55+Math.sin(t*1.2)*0.15
  })

  const rackMat = M.darkMet('#060c16')
  const unitMat = {color:'#0a1628',emissive:'#1d4ed8',emissiveIntensity:0.3,metalness:0.7,roughness:0.3}

  return (
    <group>
      {/* SERVER RACK COLUMNS (3 full racks) */}
      {[-1.25,0,1.25].map((x,ri)=>(
        <group key={ri} position={[x,0,0]}>
          <Box pos={[0,1.05,0]}  size={[0.88,2.1,1.05]} mat={rackMat} />
          <Box pos={[0,2.12,0]}  size={[0.9,0.08,1.07]}  mat={M.darkMet()} />
          <Box pos={[0,1.05,0.53]} size={[0.9,2.12,0.04]} mat={M.panel()} />
          {[[-0.38,-0.48],[0.38,-0.48],[-0.38,0.48],[0.38,0.48]].map(([fx,fz],i)=>(
            <Box key={i} pos={[fx,0.03,fz]} size={[0.08,0.06,0.08]} mat={M.darkMet()} />
          ))}
          {Array.from({length:10},(_,i)=>(
            <group key={i} position={[0,0.22+i*0.18,0.53]}>
              <Box pos={[0,0,0]} size={[0.78,0.14,0.03]} mat={{...unitMat,emissiveIntensity:0.15+(i%3)*0.12}} />
              {[-0.22,-0.08,0.06].map((dx,j)=>(
                <Box key={j} pos={[dx,0,0.02]} size={[0.1,0.09,0.01]} mat={M.darkMet()} />
              ))}
              {[0,1,2].map(j=>(
                <Sph key={j} pos={[0.27+j*0.055,0,0.028]} r={0.013} seg={6}
                  mat={{color:['#22c55e','#3b82f6','#f59e0b'][j],emissive:['#22c55e','#3b82f6','#f59e0b'][j],emissiveIntensity:0.9}} />
              ))}
              <Sph pos={[0.34,0,0.028]} r={0.01} seg={6} mat={{color:'#4ade80',emissive:'#4ade80',emissiveIntensity:0.8}} />
            </group>
          ))}
          <Box pos={[0,2.08,0.53]}   size={[0.78,0.12,0.03]} mat={M.metal('#0a1830',0.75,0.4)} />
          {Array.from({length:10},(_,p)=>(
            <Box key={p} pos={[-0.32+p*0.072,2.08,0.555]} size={[0.05,0.05,0.014]}
              mat={{color:'#1d4a7a',emissive:'#1d4ed8',emissiveIntensity:0.4,metalness:0.6}} />
          ))}
          <Box pos={[0,0.12,0.53]}   size={[0.78,0.14,0.03]} mat={M.metal('#091422',0.8,0.3)} />
          <Box pos={[-0.2,0.12,0.56]} size={[0.32,0.08,0.015]} mat={{color:'#1a3a60',emissive:'#1d4ed8',emissiveIntensity:0.35}} />
        </group>
      ))}

      {/* CABLE MANAGEMENT OVERHEAD TRAY */}
      <Box pos={[0,2.22,-0.12]} size={[3.55,0.055,0.38]} mat={M.darkMet()} />
      {[-1.0,0,1.0].map((x,i)=>(
        <Cyl key={i} pos={[x,2.17,-0.05]} args={[0.018,0.018,0.22,6]}
          mat={{color:['#1d4ed8','#7c3aed','#0f766e'][i],roughness:0.85}} />
      ))}
      {[-0.9,-0.3,0.3,0.9].map((x,i)=>(
        <Cyl key={i} pos={[x,2.2,-0.12]} rot={[0,0,Math.PI/2]} args={[0.014,0.014,0.42,6]}
          mat={{color:'#0f1a28',roughness:0.9}} />
      ))}

      {/* HOLOGRAPHIC DISPLAY DOME */}
      <Cyl pos={[0,2.38,-0.25]} args={[0.58,0.68,0.14,24]} mat={M.darkMet('#060c18')} />
      <Ring pos={[0,2.46,-0.25]} rot={[Math.PI/2,0,0]} args={[0.62,0.025,8,40]}
        mat={{color:'#3b82f6',emissive:'#3b82f6',emissiveIntensity:0.8}} />

      {/* Orbital rings */}
      <mesh ref={ring1} position={[0,3.2,-0.25]}>
        <torusGeometry args={[1.18,0.034,10,58]} />
        <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={1.0} />
      </mesh>
      <mesh ref={ring2} position={[0,3.2,-0.25]}>
        <torusGeometry args={[0.88,0.026,10,58]} />
        <meshStandardMaterial color="#60a5fa" emissive="#60a5fa" emissiveIntensity={0.9} />
      </mesh>
      <mesh ref={ring3} position={[0,3.2,-0.25]}>
        <torusGeometry args={[0.62,0.02,10,58]} />
        <meshStandardMaterial color="#93c5fd" emissive="#93c5fd" emissiveIntensity={0.8} />
      </mesh>

      {/* Core sphere */}
      <mesh ref={coreRef} position={[0,3.2,-0.25]}>
        <sphereGeometry args={[0.25,24,24]} />
        <meshStandardMaterial color="#bfdbfe" emissive="#60a5fa" emissiveIntensity={0.9}
          roughness={0.08} metalness={0.5} transparent opacity={0.92} />
      </mesh>
      {/* Inner glow */}
      <Sph pos={[0,3.2,-0.25]} r={0.15} seg={16}
        mat={{color:'#e0f2ff',emissive:'#93c5fd',emissiveIntensity:1.8,transparent:true,opacity:0.55}} />

      {/* â•â• CURVED DISPLAY WALL (back) â•â• */}
      <mesh ref={screenRef} position={[0,1.45,-0.68]}>
        <boxGeometry args={[3.3,2.1,0.055]} />
        <meshStandardMaterial color="#030c1c" emissive="#071830" emissiveIntensity={0.55} metalness={0.5} />
      </mesh>
      {/* Scanlines */}
      {Array.from({length:14},(_,i)=>(
        <Box key={i} pos={[0,0.5+i*0.15,-0.645]} size={[3.24,0.007,0.01]}
          mat={{color:'#1d4ed8',transparent:true,opacity:0.12}} />
      ))}
      {/* Data panels on screen */}
      {[-1.05,0,1.05].map((x,i)=>(
        <Box key={i} pos={[x,1.45,-0.645]} size={[0.9,1.7,0.01]}
          mat={{color:'#060f22',emissive:['#0a3870','#071e4a','#0a3870'][i],emissiveIntensity:0.45}} />
      ))}

      {/* â•â• ANTENNA MAST â•â• */}
      <Cyl pos={[0,4.12,-0.25]}  args={[0.012,0.018,0.95,6]} mat={M.chrome()} />
      <Sph pos={[0,4.6,-0.25]} r={0.045} seg={12}
        mat={{color:'#60a5fa',emissive:'#60a5fa',emissiveIntensity:2.0}} />
      {/* Crossbar */}
      <Box pos={[0,4.3,-0.25]} size={[0.3,0.01,0.01]} mat={M.chrome()} />

      {/* Hub lights */}
      <pointLight position={[0,3.2,-0.25]} color="#3b82f6" intensity={3.5} distance={10} />
      <pointLight position={[0,1.2,0.5]}   color="#1d4ed8" intensity={1.5} distance={6} />
    </group>
  )
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   MESH MAP + MAIN EXPORT
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const MESH_MAP = {
  cnc:        p => <CNCMesh      {...p} />,
  robot:      p => <RobotMesh    {...p} />,
  conveyor:   p => <ConveyorMesh {...p} />,
  assembly:   p => <StationMesh  {...p} variant="assembly"   />,
  inspection: p => <StationMesh  {...p} variant="inspection" />,
  packaging:  p => <StationMesh  {...p} variant="packaging"  />,
  hub:        p => <HubMesh      {...p} />,
}

const STATUS_GLOW = {
  Healthy:    '#34d399',
  Warning:    '#fbbf24',
  'High Risk':'#f97316',
  Critical:   '#ef4444',
}

export function MachineMesh({ type, status, selected, data, onClick, xrayMode }) {
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
