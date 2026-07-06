export const MACHINES = [
  // CNC Machines - back row
  { id: 'CNC-01', name: 'CNC Machine 1',     type: 'cnc',        position: [-9, 0, -8], tier: 'M' },
  { id: 'CNC-02', name: 'CNC Machine 2',     type: 'cnc',        position: [-3, 0, -8], tier: 'L' },
  { id: 'CNC-03', name: 'CNC Machine 3',     type: 'cnc',        position: [ 3, 0, -8], tier: 'H' },
  { id: 'CNC-04', name: 'CNC Machine 4',     type: 'cnc',        position: [ 9, 0, -8], tier: 'M' },
  // Robotic Arms - mid flanks
  { id: 'ROB-01', name: 'Robotic Arm 1',     type: 'robot',      position: [-9, 0,  0], tier: 'H' },
  { id: 'ROB-02', name: 'Robotic Arm 2',     type: 'robot',      position: [ 9, 0,  0], tier: 'M' },
  // Conveyor Belts - center lane
  { id: 'CONV-01', name: 'Conveyor Belt 1',  type: 'conveyor',   position: [-3, 0,  0] },
  { id: 'CONV-02', name: 'Conveyor Belt 2',  type: 'conveyor',   position: [ 3, 0,  0] },
  // Stations - front row
  { id: 'ASSM-01', name: 'Assembly Station', type: 'assembly',   position: [-6, 0,  8] },
  { id: 'INSP-01', name: 'Inspection Station',type:'inspection',  position: [ 0, 0,  8] },
  { id: 'PACK-01', name: 'Packaging Station', type: 'packaging',  position: [ 6, 0,  8] },
  // AI Hub - center rear
  { id: 'AI-HUB',  name: 'AI Control Hub',   type: 'hub',        position: [ 0, 0, -14] },
]

// Production flow for risk propagation
export const FLOW_EDGES = [
  ['AI-HUB',  'CNC-01'],
  ['AI-HUB',  'CNC-02'],
  ['AI-HUB',  'CNC-03'],
  ['AI-HUB',  'CNC-04'],
  ['CNC-01',  'ROB-01'],
  ['CNC-02',  'CONV-01'],
  ['CNC-03',  'CONV-02'],
  ['CNC-04',  'ROB-02'],
  ['ROB-01',  'ASSM-01'],
  ['CONV-01', 'ASSM-01'],
  ['CONV-02', 'INSP-01'],
  ['ROB-02',  'INSP-01'],
  ['ASSM-01', 'PACK-01'],
  ['INSP-01', 'PACK-01'],
]

export const STATUS_COLORS = {
  Healthy:     '#00ff88',
  Warning:     '#ffcc00',
  'High Risk': '#ff8800',
  Critical:    '#ff2200',
}

// Default data matching real ai4i2020 sensor ranges
export const defaultMachineData = (id) => {
  const rpm  = 1400 + Math.random() * 300          // 1400–1700 rpm (normal range)
  const torq = 30   + Math.random() * 15            // 30–45 Nm (normal)
  const airT = 297  + Math.random() * 2             // 297–299 K
  const procT = airT + 9 + Math.random() * 1.5     // ~10K above air
  const wear  = Math.floor(Math.random() * 180)    // 0–180 min
  const load  = 40  + Math.random() * 25            // 40–65%
  const energy = 12 + Math.random() * 3             // 12–15 kWh (normal)
  const fp    = Math.random() * 20                  // low failure prob

  return {
    machine_id: id,
    health_score:        parseFloat((100 - fp * 0.8).toFixed(1)),
    failure_probability: parseFloat(fp.toFixed(1)),
    energy_consumption:  parseFloat(energy.toFixed(2)),
    status:              'Healthy',
    predicted_downtime:  0,
    financial_loss:      0,
    recommendation:      'System operating within normal parameters.',
    // ── Real sensor inputs from dataset ──
    air_temperature:     parseFloat(airT.toFixed(1)),
    process_temperature: parseFloat(procT.toFixed(1)),
    rotational_speed:    Math.round(rpm),
    torque:              parseFloat(torq.toFixed(1)),
    tool_wear:           wear,
    machine_load:        parseFloat(load.toFixed(1)),
    // ── Extra outputs ──
    production_output:   Math.round(70 + Math.random() * 30),
    carbon_emission:     parseFloat((energy * 0.233).toFixed(2)),
  }
}
