import { useEffect } from 'react'
import { useStore } from '../store/useStore'
import { MACHINES } from '../data/machines'

// Backend WebSocket URL — dynamically use current host or fallback to localhost
const WS_PROTOCOL = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
const WS_URL = import.meta.env.VITE_WS_URL || `${WS_PROTOCOL}//${window.location.host}/ws`

// ─── FALLBACK SIMULATION ───────────────────────────────────────────────────────
// Used when the backend server is not running.
// Mirrors the real ai4i2020 dataset sensor ranges exactly.

function deriveStatus(fp, rpm, torque, toolWear) {
  if (fp >= 80) return 'Critical'
  if (fp >= 60) return 'High Risk'
  if (rpm > 2400 || rpm < 1250 || torque > 58 || toolWear > 200) return 'Warning'
  if (fp >= 35) return 'Warning'
  return 'Healthy'
}

function getRecommendation(status, fp, twf, hdf, pwf, osf, rnf, wear) {
  if (twf) return 'Tool Wear Failure detected. Replace cutting tool immediately and run surface quality inspection before resuming production.'
  if (hdf) return 'Heat Dissipation Failure. Reduce rotational speed by 15%, check coolant flow rate, and inspect heat exchanger.'
  if (pwf) return 'Power Failure mode active. Verify electrical supply stability, check motor winding resistance and drive inverter.'
  if (osf) return 'Overstrain Failure detected. Reduce torque load by 20%, inspect spindle bearings, and verify workpiece clamping.'
  if (rnf) return 'Random Failure (RNF) triggered. Run full diagnostic cycle, check all sensor outputs for anomalies.'
  if (status === 'Critical')  return `Critical failure probability (${fp.toFixed(1)}%). Schedule immediate preventive maintenance.`
  if (status === 'High Risk') return `High failure risk (${fp.toFixed(1)}%). Plan maintenance within 24 hours. Monitor torque and tool wear closely.`
  if (status === 'Warning')   return `Elevated risk (${fp.toFixed(1)}%). Increase monitoring frequency. ${wear > 180 ? 'Tool wear approaching limit — plan replacement.' : 'Check lubrication and calibration.'}`
  return 'Machine operating within normal parameters. Continue scheduled monitoring and preventive maintenance program.'
}

// Physics-based failure probability mirroring the GradientBoosting model logic
function calcFailureProbability(airT, procT, rpm, torque, wear, load) {
  let fp = 2 + Math.random() * 8  // baseline noise (2-10%)
  // Tool wear contribution
  fp += (wear / 250) * 38
  // Torque overload
  fp += Math.max(0, (torque - 45) / 25) * 22
  // RPM extremes
  if (rpm > 2200 || rpm < 1300) fp += Math.min(Math.abs(rpm - 1750) / 500, 1) * 18
  // Heat delta
  const tdiff = procT - airT
  fp += Math.max(0, (tdiff - 9) / 10) * 14
  // Load stress
  fp += Math.max(0, (load - 75) / 25) * 8
  return Math.min(parseFloat(fp.toFixed(1)), 99.9)
}

function simulateTick(updateMachine, machines) {
  machines.forEach((id) => {
    const airT  = parseFloat((296.5 + Math.random() * 3).toFixed(1))
    const procT = parseFloat((airT + 8.5 + Math.random() * 3).toFixed(1))
    const rpm   = Math.round(1200 + Math.random() * 1100)    // 1200–2300 (dataset range)
    const torque = parseFloat((20 + Math.random() * 50).toFixed(1))
    const wear  = Math.floor(Math.random() * 240)
    const load  = parseFloat((30 + Math.random() * 65).toFixed(1))
    const energy = parseFloat((8 + (load / 100) * 12 + Math.random() * 2).toFixed(2))

    const fp = calcFailureProbability(airT, procT, rpm, torque, wear, load)
    const status = deriveStatus(fp, rpm, torque, wear)
    const hs = parseFloat(Math.max(5, 100 - fp * 0.65 + (Math.random() - 0.5) * 4).toFixed(1))

    const twf = wear > 200 && fp > 60 ? 1 : 0
    const hdf = (procT - airT) > 12 && fp > 50 ? 1 : 0
    const pwf = (rpm * torque) > 100000 && fp > 55 ? 1 : 0
    const osf = torque > 62 && fp > 65 ? 1 : 0
    const rnf = fp > 85 && !twf && !hdf && !pwf && !osf ? 1 : 0

    const downtime = fp >= 80 ? parseFloat((fp * 0.07 + Math.random()).toFixed(1)) : 0
    const loss = Math.round(downtime * 38000)
    const carbon = parseFloat((energy * 0.233).toFixed(3))
    const output = Math.round(200 - load * 0.9 + Math.random() * 25)

    updateMachine({
      machine_id:          id,
      health_score:        hs,
      failure_probability: fp,
      status,
      recommendation:      getRecommendation(status, fp, twf, hdf, pwf, osf, rnf, wear),
      air_temperature:     airT,
      process_temperature: procT,
      rotational_speed:    rpm,
      torque,
      tool_wear:           wear,
      machine_load:        load,
      energy_consumption:  energy,
      production_output:   output,
      carbon_emission:     carbon,
      predicted_downtime:  downtime,
      financial_loss:      loss,
      twf, hdf, pwf, osf, rnf,
      data_source:         'simulated',
      model_used:          false,
    })
  })
}

// ─── MAIN HOOK ────────────────────────────────────────────────────────────────
export function useWebSocket(machineIds) {
  const { updateMachine, setWsStatus } = useStore()

  useEffect(() => {
    let ws = null
    let simInterval = null
    let connected = false

    function startSimulation() {
      if (simInterval) return
      setWsStatus('simulated')
      simulateTick(updateMachine, machineIds)
      simInterval = setInterval(() => simulateTick(updateMachine, machineIds), 2500)
    }

    function handleMessage(raw) {
      try {
        const payload = JSON.parse(raw)

        // New format: { type: "batch", machines: [...] }
        if (payload.type === 'batch' && Array.isArray(payload.machines)) {
          payload.machines.forEach(m => {
            // Find the matching machine in our frontend MACHINES list by mapping backend ID
            const matched = MACHINES.find(fm =>
              fm.id === m.machine_id ||
              m.machine_id?.includes(fm.id.replace(/-\d+$/, '').toLowerCase())
            )
            updateMachine({ ...m, machine_id: matched ? matched.id : m.machine_id })
          })
          return
        }

        // Legacy array format
        if (Array.isArray(payload)) {
          payload.forEach(p => updateMachine(p))
          return
        }

        // Single machine update
        if (payload.machine_id) {
          updateMachine(payload)
        }
      } catch (e) {
        console.warn('[WS] parse error', e)
      }
    }

    function tryConnect() {
      try {
        ws = new WebSocket(WS_URL)
        ws.onopen = () => {
          connected = true
          setWsStatus('connected')
          clearInterval(simInterval)
          simInterval = null
          console.log('[WS] Connected to real data backend — streaming ai4i2020 dataset')
        }
        ws.onmessage = (e) => handleMessage(e.data)
        ws.onclose  = () => { connected = false; startSimulation() }
        ws.onerror  = () => { if (!connected) startSimulation() }
      } catch {
        startSimulation()
      }
    }

    // Give the backend 800ms to respond, then fall back to simulation
    const timer = setTimeout(() => {
      if (!connected) tryConnect()
    }, 100)
    tryConnect()

    return () => {
      clearTimeout(timer)
      ws?.close()
      clearInterval(simInterval)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}
