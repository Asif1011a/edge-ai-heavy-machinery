import { create } from 'zustand'
import { MACHINES, defaultMachineData } from '../data/machines'

const MAX_HISTORY = 30

const initialData = {}
const initialHistory = {}
MACHINES.forEach(m => {
  initialData[m.id]    = defaultMachineData(m.id)
  initialHistory[m.id] = []
})

// Maintenance schedule per machine
const genMaintenanceTasks = () => {
  const now = Date.now()
  const day = 86400000
  return MACHINES.map(m => ({
    machine_id: m.id,
    tasks: [
      { id: `${m.id}-lubrication`,  name: 'Lubrication Service', due: now + Math.random() * 7 * day,  priority: 'medium', done: false },
      { id: `${m.id}-inspection`,   name: 'Full Inspection',      due: now + Math.random() * 14 * day, priority: 'high',   done: false },
      { id: `${m.id}-calibration`,  name: 'Sensor Calibration',   due: now + Math.random() * 30 * day, priority: 'low',    done: Math.random() > 0.7 },
      { id: `${m.id}-tool-replace`, name: 'Tool Replacement',     due: now + Math.random() * 5 * day,  priority: 'high',   done: Math.random() > 0.8 },
    ]
  }))
}

const maintenanceSchedule = genMaintenanceTasks()

export const useStore = create((set, get) => ({
  machineData:     initialData,
  sensorHistory:   initialHistory,
  selectedMachine: null,
  wsStatus:        'disconnected',
  alerts:          [],
  eventLog:        [],
  maintenanceSchedule,
  compareIds:      [],
  searchFilter:    '',
  activeRightTab:  'telemetry',
  bottomPanelOpen: false,

  // ── Eco-Mode ──
  ecoMode: false,
  toggleEcoMode: () => set(s => ({ ecoMode: !s.ecoMode })),

  // ── CMMS Work Orders ──
  workOrders: [],
  dispatchWorkOrder: (orderId, technicianName) => set(s => ({
    workOrders: s.workOrders.map(wo =>
      wo.id === orderId
        ? { ...wo, status: 'dispatched', technician: technicianName, dispatched_at: Date.now() }
        : wo
    )
  })),
  resolveWorkOrder: (orderId) => set(s => ({
    workOrders: s.workOrders.map(wo =>
      wo.id === orderId ? { ...wo, status: 'resolved', resolved_at: Date.now() } : wo
    )
  })),

  updateMachine: (payload) => set(state => {
    const prev    = state.machineData[payload.machine_id] || {}
    const updated = { ...prev, ...payload }

    if (!payload.status) {
      const fp     = updated.failure_probability
      const rpm    = updated.rotational_speed || 1500
      const torque = updated.torque || 35
      const wear   = updated.tool_wear || 0
      if      (fp >= 80 || (rpm > 2400 && torque > 55)) updated.status = 'Critical'
      else if (fp >= 60 || rpm > 2200 || torque > 58 || wear > 210) updated.status = 'High Risk'
      else if (fp >= 35 || wear > 175 || torque > 50)   updated.status = 'Warning'
      else                                               updated.status = 'Healthy'
    }

    // Apply eco-mode multiplier (only on live data, not on eco_mode-flagged payloads)
    if (state.ecoMode && !payload.eco_mode) {
      updated.energy_consumption = parseFloat(((updated.energy_consumption || 12) * 0.78).toFixed(2))
      updated.carbon_emission    = parseFloat(((updated.carbon_emission    || 5)  * 0.78).toFixed(3))
      updated.rotational_speed   = Math.round((updated.rotational_speed || 1500) * 0.90)
      updated.production_output  = Math.round((updated.production_output || 80)  * 0.93)
    }

    const prev_hist = state.sensorHistory[payload.machine_id] || []
    const newPoint  = {
      t:      Date.now(),
      fp:     updated.failure_probability,
      hs:     updated.health_score,
      rpm:    updated.rotational_speed,
      torque: updated.torque,
      wear:   updated.tool_wear,
      energy: updated.energy_consumption,
      load:   updated.machine_load,
    }
    const newHist = [...prev_hist, newPoint].slice(-MAX_HISTORY)

    let alerts    = state.alerts
    let eventLog  = state.eventLog
    let workOrders = state.workOrders

    const prevStatus = prev.status
    if (updated.status !== prevStatus && prevStatus) {
      const severity = updated.status === 'Critical'  ? 'error'
                     : updated.status === 'High Risk' ? 'warning'
                     : updated.status === 'Warning'   ? 'info' : 'success'
      const machine = MACHINES.find(m => m.id === payload.machine_id)

      eventLog = [{
        id:           `${Date.now()}-${payload.machine_id}`,
        timestamp:    Date.now(),
        machine_id:   payload.machine_id,
        machine_name: machine?.name || payload.machine_id,
        type:         severity,
        message:      `Status changed to ${updated.status}`,
        detail:       `FP: ${updated.failure_probability?.toFixed(1)}% | RPM: ${updated.rotational_speed} | Torque: ${updated.torque?.toFixed(1)} Nm`
      }, ...eventLog].slice(0, 50)

      // ── Auto-generate CMMS Work Order on High Risk or Critical ──
      if (
        (updated.status === 'High Risk' || updated.status === 'Critical') &&
        prevStatus !== 'High Risk' && prevStatus !== 'Critical'
      ) {
        const failureModes = []
        if (updated.twf) failureModes.push('Tool Wear Failure (TWF)')
        if (updated.hdf) failureModes.push('Heat Dissipation Failure (HDF)')
        if (updated.pwf) failureModes.push('Power Failure (PWF)')
        if (updated.osf) failureModes.push('Overstrain Failure (OSF)')
        if (updated.rnf) failureModes.push('Random Failure (RNF)')
        if (!failureModes.length) failureModes.push('Elevated Failure Probability')

        const spareMap = {
          'Tool Wear Failure (TWF)':          ['Carbide Insert Set', 'Torque Wrench'],
          'Heat Dissipation Failure (HDF)':   ['Coolant Filter', 'Heat Exchanger Module'],
          'Power Failure (PWF)':              ['Drive Inverter', 'Motor Winding Kit'],
          'Overstrain Failure (OSF)':         ['Spindle Bearing Set', 'Clamping Fixture'],
          'Random Failure (RNF)':             ['General Diagnostic Kit'],
          'Elevated Failure Probability':     ['General Service Kit'],
        }
        const spares = [...new Set(failureModes.flatMap(f => spareMap[f] || ['General Service Kit']))]

        const newOrder = {
          id:                 `WO-${Date.now()}-${payload.machine_id}`,
          machine_id:         payload.machine_id,
          machine_name:       machine?.name || payload.machine_id,
          created_at:         Date.now(),
          priority:           updated.status === 'Critical' ? 'critical' : 'high',
          failure_modes:      failureModes,
          spare_parts:        spares,
          failure_probability: updated.failure_probability,
          estimated_downtime: updated.predicted_downtime || 0,
          financial_loss:     updated.financial_loss || 0,
          recommendation:     updated.recommendation || '',
          status:             'open',
          technician:         null,
          dispatched_at:      null,
          resolved_at:        null,
        }
        workOrders = [newOrder, ...workOrders].slice(0, 30)
      }

      // Auto-resolve work orders when machine recovers
      if (updated.status === 'Healthy' || updated.status === 'Warning') {
        workOrders = workOrders.map(wo =>
          wo.machine_id === payload.machine_id && wo.status === 'open'
            ? { ...wo, status: 'resolved', resolved_at: Date.now() }
            : wo
        )
      }
    }

    if (updated.failure_probability >= 80) {
      const existing = alerts.find(a => a.machine_id === payload.machine_id)
      if (!existing) {
        alerts = [{ ...updated, timestamp: Date.now() }, ...alerts].slice(0, 5)
      } else {
        alerts = alerts.map(a => a.machine_id === payload.machine_id ? { ...updated, timestamp: a.timestamp } : a)
      }
    } else {
      alerts = alerts.filter(a => a.machine_id !== payload.machine_id)
    }

    return {
      machineData:   { ...state.machineData,  [payload.machine_id]: updated },
      sensorHistory: { ...state.sensorHistory, [payload.machine_id]: newHist },
      alerts,
      eventLog,
      workOrders,
    }
  }),

  selectMachine:     (id)  => set({ selectedMachine: id }),
  setWsStatus:       (s)   => set({ wsStatus: s }),
  setSearchFilter:   (v)   => set({ searchFilter: v }),
  setActiveRightTab: (tab) => set({ activeRightTab: tab }),
  toggleBottomPanel: ()    => set(s => ({ bottomPanelOpen: !s.bottomPanelOpen })),
  toggleCompare: (id) => set(s => {
    const ids = s.compareIds
    if (ids.includes(id)) return { compareIds: ids.filter(x => x !== id) }
    if (ids.length >= 2)  return { compareIds: [ids[1], id] }
    return { compareIds: [...ids, id] }
  }),
  completeTask: (machineId, taskId) => set(s => ({
    maintenanceSchedule: s.maintenanceSchedule.map(ms =>
      ms.machine_id === machineId
        ? { ...ms, tasks: ms.tasks.map(t => t.id === taskId ? { ...t, done: true } : t) }
        : ms
    )
  })),

  getSummary: () => {
    const data   = Object.values(get().machineData)
    const totalE = data.reduce((s, d) => s + (d.energy_consumption || 0), 0)
    const healthy = data.filter(d => d.status === 'Healthy').length
    const warning = data.filter(d => d.status === 'Warning').length
    const availability = ((healthy + warning) / Math.max(data.length, 1) * 100)
    return {
      total:           data.length,
      healthy,
      warning,
      highRisk:        data.filter(d => d.status === 'High Risk').length,
      critical:        data.filter(d => d.status === 'Critical').length,
      totalEnergy:     totalE,
      carbonEmissions: totalE * 0.233,
      predictedLoss:   data.reduce((s, d) => s + (d.financial_loss || 0), 0),
      avgHealth:       data.reduce((s, d) => s + (d.health_score   || 0), 0) / Math.max(data.length, 1),
      availability:    availability.toFixed(1),
      oee:             (availability * 0.88 * 0.95).toFixed(1),
      totalOutput:     data.reduce((s, d) => s + (d.production_output || 0), 0),
    }
  },
}))
