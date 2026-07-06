import { useEffect, useRef } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars, Environment, ContactShadows } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { Suspense } from 'react'
import * as THREE from 'three'

import { MACHINES } from '../data/machines'
import { useStore } from '../store/useStore'
import { MachineMesh } from './MachineMesh'
import { MachineLabel } from './MachineLabel'
import { RiskNetwork } from './RiskNetwork'
import { EnergyFlow } from './EnergyFlow'
import { FactoryEnvironment } from './FactoryEnvironment'

// Compute a camera position that zooms in on a machine from a nice angle
function getMachineCam(machine) {
  const [mx, my, mz] = machine.position
  // Offset: slightly above, 9 units in front/diagonal
  return {
    position: [mx + 7, my + 8, mz + 9],
    target:   [mx,     my + 1.5, mz],
  }
}

function CameraController({ targetView, controlsRef }) {
  const { camera } = useThree()
  const selectedId = useStore(s => s.selectedMachine)

  // Refs hold the DESIRED position/target so we can lerp every frame
  const desiredPos    = useRef(new THREE.Vector3(0, 22, 28))
  const desiredTarget = useRef(new THREE.Vector3(0, 0, 0))
  const isAnimating   = useRef(false)

  // Update desired cam whenever selected machine OR preset view changes
  useEffect(() => {
    if (selectedId) {
      const machine = MACHINES.find(m => m.id === selectedId)
      if (machine) {
        const cam = getMachineCam(machine)
        desiredPos.current.set(...cam.position)
        desiredTarget.current.set(...cam.target)
        isAnimating.current = true
      }
    } else if (targetView) {
      desiredPos.current.set(...targetView.cam.position)
      desiredTarget.current.set(...targetView.cam.target)
      isAnimating.current = true
    }
  }, [selectedId, targetView])

  useFrame((state, delta) => {
    if (!isAnimating.current) return
    const step = 1 - Math.exp(-4.5 * delta)   // smooth exponential decay

    const distPos    = camera.position.distanceTo(desiredPos.current)
    const distTarget = controlsRef.current
      ? controlsRef.current.target.distanceTo(desiredTarget.current)
      : 0

    camera.position.lerp(desiredPos.current, step)
    if (controlsRef.current) {
      controlsRef.current.target.lerp(desiredTarget.current, step)
      controlsRef.current.update()
    }

    // Stop animating once close enough
    if (distPos < 0.05 && distTarget < 0.05) {
      isAnimating.current = false
    }
  })

  return null
}

export function FactoryScene({ targetView, layers }) {
  const machineData   = useStore(s => s.machineData)
  const selectMachine = useStore(s => s.selectMachine)
  const selectedId    = useStore(s => s.selectedMachine)
  const controlsRef   = useRef()

  return (
    <Canvas
      shadows={false}
      camera={{ position: [0, 22, 28], fov: 45 }}
      gl={{
        antialias: true,
        alpha: false,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.6,
        powerPreference: 'high-performance',
      }}
      style={{ background: 'radial-gradient(ellipse at 50% 30%, #050e20 0%, #020810 100%)' }}
      performance={{ min: 0.5 }}
    >
      <Stars radius={90} depth={55} count={2000} factor={3} saturation={0.1} speed={0.1} />

      <Suspense fallback={null}>
        <Environment preset="city" background={false} environmentIntensity={1.2} />

        <ambientLight intensity={0.7} color="#cce8ff" />
        <directionalLight position={[10, 20, 10]}  intensity={2.0} color="#ffffff" />
        <directionalLight position={[-12, 15, -10]} intensity={0.8} color="#60a5fa" />
        <hemisphereLight skyColor="#0ea5e9" groundColor="#1e3a5f" intensity={0.6} />

        <FactoryEnvironment />

        <ContactShadows
          position={[0, 0.05, 0]}
          opacity={0.55}
          scale={55}
          blur={2.0}
          far={12}
          resolution={256}
          color="#000820"
        />

        {layers.risk   && <RiskNetwork />}
        {layers.energy && <EnergyFlow />}

        {MACHINES.map(machine => {
          const data = machineData[machine.id]
          return (
            <group key={machine.id} position={machine.position}>
              <MachineMesh
                xrayMode={layers.xray}
                type={machine.type}
                status={data?.status || 'Healthy'}
                data={data}
                selected={selectedId === machine.id}
                onClick={(e) => {
                  e.stopPropagation()
                  // Toggle: clicking selected machine deselects; clicking new one selects + flies camera
                  selectMachine(selectedId === machine.id ? null : machine.id)
                }}
              />
              {layers.labels && <MachineLabel machine={machine} />}
            </group>
          )
        })}

        <EffectComposer multisampling={0}>
          <Bloom intensity={0.25} luminanceThreshold={0.65} luminanceSmoothing={0.9} />
          <Vignette eskil={false} offset={0.3} darkness={0.4} />
        </EffectComposer>
      </Suspense>

      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.12}
        rotateSpeed={0.6}
        zoomSpeed={0.8}
        panSpeed={0.8}
        minDistance={4}
        maxDistance={55}
        maxPolarAngle={Math.PI / 2.1}
        target={[0, 0, 0]}
      />
      <CameraController targetView={targetView} controlsRef={controlsRef} />
    </Canvas>
  )
}
