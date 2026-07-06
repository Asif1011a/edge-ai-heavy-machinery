import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import * as THREE from 'three'

function FloorGrid() {
  return (
    <>
      {/* Main epoxy floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[70, 70]} />
        <meshStandardMaterial color="#06080f" metalness={0.35} roughness={0.6} />
      </mesh>

      {/* Subtle grid overlay */}
      <gridHelper args={[60, 60, '#0d1828', '#0a1220']} position={[0, 0.001, 0]} />

      {/* â”€ Safety lane markings â”€ */}
      {/* Main aisle stripes */}
      {[-12, 0, 12].map((z, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, z]}>
          <planeGeometry args={[50, 0.12]} />
          <meshBasicMaterial color="#fbbf24" transparent opacity={0.35} />
        </mesh>
      ))}
      {/* Cross aisles */}
      {[-12, -4, 4, 12].map((x, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.003, 0]}>
          <planeGeometry args={[0.12, 30]} />
          <meshBasicMaterial color="#fbbf24" transparent opacity={0.22} />
        </mesh>
      ))}

      {/* â”€ Machine zone floor plates â”€ */}
      {/* CNC zone - back */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, -8]}>
        <planeGeometry args={[26, 5.5]} />
        <meshBasicMaterial color="#0c1830" transparent opacity={0.55} />
      </mesh>
      {/* Robot / conveyor zone */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
        <planeGeometry args={[22, 5.5]} />
        <meshBasicMaterial color="#0a1420" transparent opacity={0.55} />
      </mesh>
      {/* Station zone - front */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 8]}>
        <planeGeometry args={[18, 5.5]} />
        <meshBasicMaterial color="#0c1828" transparent opacity={0.55} />
      </mesh>
      {/* AI Hub zone */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, -14]}>
        <planeGeometry args={[10, 6]} />
        <meshBasicMaterial color="#060e20" transparent opacity={0.7} />
      </mesh>

      {/* Zone neon border strips */}
      {[
        { pos: [-13, 0.008, -8],  rot: [-Math.PI/2,0,0], w: 0.08, h: 5.5,  col: '#3b82f6' },
        {  pos: [13,  0.008, -8], rot: [-Math.PI/2,0,0], w: 0.08, h: 5.5,  col: '#3b82f6' },
        {  pos: [0,   0.008, -10.75], rot: [-Math.PI/2,0,0], w: 26, h: 0.08, col: '#3b82f6' },
        {  pos: [0,   0.008, -5.25],  rot: [-Math.PI/2,0,0], w: 26, h: 0.08, col: '#3b82f6' },
      ].map(({ pos, rot, w, h, col }, i) => (
        <mesh key={i} rotation={rot} position={pos}>
          <planeGeometry args={[w, h]} />
          <meshBasicMaterial color={col} transparent opacity={0.4} />
        </mesh>
      ))}
    </>
  )
}

function Lighting() {
  return (
    <>
      {/* Ambient */}
      <ambientLight intensity={0.18} color="#b0c8e8" />

      {/* Primary overhead directional */}
      <directionalLight
        position={[6, 14, 6]}
        intensity={0.55}
        color="#d8eeff"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.5}
        shadow-camera-far={60}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
        shadow-bias={-0.001}
      />
      <directionalLight position={[-8, 10, -8]} intensity={0.18} color="#7090b8" />

      {/* Zone accent point lights (Reduced for performance) */}
      <pointLight position={[0, 5, -8]}  color="#1d4ed8" intensity={1.2} distance={12} />
      <pointLight position={[0, 5,  0]}  color="#0f766e" intensity={0.8} distance={10} />
      <pointLight position={[0, 4, -14]} color="#3b82f6" intensity={2.0} distance={8}  />
    </>
  )
}

export function FactoryEnvironment() {
  return (
    <group>
      <Lighting />
      <FloorGrid />
    </group>
  )
}
