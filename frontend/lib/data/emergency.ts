import type { EmergencyScenario } from '../types';

// ============================================================================
// EMERGENCY SIMULATION CENTER
// Pre-modeled crisis scenarios with impacted zones, orchestrated response
// playbooks (automated + human), and AI-estimated recovery time.
// ============================================================================

export const emergencyScenarios: EmergencyScenario[] = [
  {
    id: 'scn-fire',
    type: 'fire',
    name: 'Fire - Primary Data Center (L5)',
    severity: 'critical',
    description:
      'Smoke detected in the L5 Primary Data Center. Clean-agent suppression armed. Risk to evidence systems and core operations.',
    triggerNarrative:
      'VESDA aspirating detector + thermal camera correlate a smoke signature at rack row C. Fire panel L5 escalates to alarm.',
    impactedZones: [
      { zoneId: 'flr-06-z1', zoneName: 'Primary Data Center', floorName: 'L5 | Secure Core', impact: 'severe' },
      { zoneId: 'flr-06-z2', zoneName: 'Evidence Vault', floorName: 'L5 | Secure Core', impact: 'major' },
      { zoneId: 'flr-06-z3', zoneName: 'Armory', floorName: 'L5 | Secure Core', impact: 'moderate' },
      { zoneId: 'flr-05-z2', zoneName: 'Cellblock B', floorName: 'L4 | Detention', impact: 'minor' },
    ],
    responsePlan: [
      { order: 1, actor: 'Fire Detection AI', action: 'Confirm smoke signature, suppress false-positive checks, raise Stage-2 alarm', etaMinutes: 0, automated: true },
      { order: 2, actor: 'BMS', action: 'Shut down CRAC recirculation, close fire dampers, switch HVAC to smoke-control mode', etaMinutes: 1, automated: true },
      { order: 3, actor: 'Access Control', action: 'Release fail-safe egress doors on L5; lock down Evidence Vault & Armory', etaMinutes: 1, automated: true },
      { order: 4, actor: 'Suppression System', action: 'Arm clean-agent (Novec 1230) with 30s pre-discharge countdown', etaMinutes: 1, automated: true },
      { order: 5, actor: 'Watch Commander', action: 'Verify zone evacuation via cameras, authorize discharge if confirmed', etaMinutes: 2, automated: false },
      { order: 6, actor: 'On-site Security', action: 'Evacuate L5 occupants to muster point, sweep Secure Core', etaMinutes: 4, automated: false },
      { order: 7, actor: 'Fire Brigade', action: 'Dispatch and stage; civil defence ETA based on traffic feed', etaMinutes: 9, automated: false },
      { order: 8, actor: 'IT Operations', action: 'Initiate graceful failover of core services to DR site', etaMinutes: 6, automated: false },
    ],
    estimatedRecoveryMinutes: 240,
    affectedAssets: 11,
    affectedOccupants: 14,
    cascadeRisks: [
      'Core service outage if failover is delayed',
      'Evidence integrity exposure during suppression discharge',
      'Loss of L5 surveillance if power is isolated',
    ],
  },
  {
    id: 'scn-power',
    type: 'power_outage',
    name: 'Power Outage - Utility Mains Failure',
    severity: 'high',
    description:
      'Utility mains lost. Facility on UPS bridging to standby generator. UPS System A redundancy is currently degraded.',
    triggerNarrative:
      'Incoming 11kV feeder trips. ATS signals mains loss; critical loads transfer to UPS while generator spins up.',
    impactedZones: [
      { zoneId: 'flr-01-z3', zoneName: 'UPS & Generator Room', floorName: 'B1 | Parking & Plant', impact: 'severe' },
      { zoneId: 'flr-06-z1', zoneName: 'Primary Data Center', floorName: 'L5 | Secure Core', impact: 'major' },
      { zoneId: 'flr-03-z1', zoneName: 'Command & Control Room', floorName: 'L2 | Operations', impact: 'major' },
      { zoneId: 'flr-04-z3', zoneName: 'Holding Cells', floorName: 'L4 | Detention', impact: 'moderate' },
    ],
    responsePlan: [
      { order: 1, actor: 'Power Management AI', action: 'Detect mains loss, confirm UPS pickup, watch degraded UPS-A load', etaMinutes: 0, automated: true },
      { order: 2, actor: 'ATS', action: 'Signal standby generator start sequence', etaMinutes: 0, automated: true },
      { order: 3, actor: 'BMS', action: 'Shed non-essential loads (public lighting, comfort HVAC)', etaMinutes: 1, automated: true },
      { order: 4, actor: 'Generator', action: 'Reach rated voltage and accept building load', etaMinutes: 1, automated: true },
      { order: 5, actor: 'Watch Commander', action: 'Confirm critical systems on generator; brief command floor', etaMinutes: 3, automated: false },
      { order: 6, actor: 'Facilities', action: 'Manually monitor degraded UPS-A; stage replacement battery', etaMinutes: 8, automated: false },
      { order: 7, actor: 'Utility Liaison', action: 'Open ticket with utility provider for ETA on mains restoration', etaMinutes: 10, automated: false },
    ],
    estimatedRecoveryMinutes: 90,
    affectedAssets: 18,
    affectedOccupants: 320,
    cascadeRisks: [
      'UPS-A degraded - reduced ride-through if generator start fails',
      'Detention door controllers must remain powered (life-safety)',
      'Fuel autonomy ~36h; refuel logistics required for extended outage',
    ],
  },
  {
    id: 'scn-access',
    type: 'unauthorized_access',
    name: 'Unauthorized Access - Evidence Vault (L5)',
    severity: 'high',
    description:
      'Repeated forced-credential attempts at the Evidence Vault reader, coinciding with an after-hours occupancy anomaly.',
    triggerNarrative:
      'Access controller logs 4 denied reads in 60 min; occupancy sensor reports presence in a zone with no scheduled activity.',
    impactedZones: [
      { zoneId: 'flr-06-z2', zoneName: 'Evidence Vault', floorName: 'L5 | Secure Core', impact: 'severe' },
      { zoneId: 'flr-06-z3', zoneName: 'Armory', floorName: 'L5 | Secure Core', impact: 'major' },
      { zoneId: 'flr-06-z1', zoneName: 'Primary Data Center', floorName: 'L5 | Secure Core', impact: 'moderate' },
    ],
    responsePlan: [
      { order: 1, actor: 'Security Analytics AI', action: 'Correlate denied reads with occupancy anomaly, raise security alert', etaMinutes: 0, automated: true },
      { order: 2, actor: 'Access Control', action: 'Lock down Secure Core, suspend the involved credential', etaMinutes: 0, automated: true },
      { order: 3, actor: 'VMS', action: 'Pull and pin live + recorded feeds for L5 cameras to video wall', etaMinutes: 1, automated: true },
      { order: 4, actor: 'Watch Commander', action: 'Assess feeds, classify threat, authorize response posture', etaMinutes: 2, automated: false },
      { order: 5, actor: 'Response Team', action: 'Dispatch officers to L5; secure stairwells and lift lobby', etaMinutes: 4, automated: false },
      { order: 6, actor: 'Records Officer', action: 'Initiate evidence chain-of-custody audit for the vault', etaMinutes: 10, automated: false },
    ],
    estimatedRecoveryMinutes: 60,
    affectedAssets: 6,
    affectedOccupants: 2,
    cascadeRisks: [
      'Evidence chain-of-custody dispute if breach confirmed',
      'Vault reader hardware fault may mask legitimate access',
      'Potential coordinated diversion elsewhere in the facility',
    ],
  },
  {
    id: 'scn-equipment',
    type: 'equipment_failure',
    name: 'Equipment Failure - Cooling Loss, Data Center',
    severity: 'high',
    description:
      'Cascading cooling failure: Chiller 1 trips while the Data Center CRAC is already degraded, threatening thermal shutdown.',
    triggerNarrative:
      'Chiller 1 compressor fault removes plant capacity; CRAC supply-air temperature climbs past the safe envelope.',
    impactedZones: [
      { zoneId: 'flr-06-z1', zoneName: 'Primary Data Center', floorName: 'L5 | Secure Core', impact: 'severe' },
      { zoneId: 'flr-01-z2', zoneName: 'Chiller Plant', floorName: 'B1 | Parking & Plant', impact: 'major' },
      { zoneId: 'flr-03-z1', zoneName: 'Command & Control Room', floorName: 'L2 | Operations', impact: 'moderate' },
    ],
    responsePlan: [
      { order: 1, actor: 'Predictive Maintenance AI', action: 'Detect chiller trip, project data-center thermal runaway curve', etaMinutes: 0, automated: true },
      { order: 2, actor: 'BMS', action: 'Bring Chiller 2 online, maximize CRAC, open free-cooling dampers', etaMinutes: 1, automated: true },
      { order: 3, actor: 'IT Operations', action: 'Throttle non-critical compute to cut thermal load', etaMinutes: 3, automated: false },
      { order: 4, actor: 'Facilities', action: 'Deploy portable cooling to Data Center, inspect Chiller 1', etaMinutes: 12, automated: false },
      { order: 5, actor: 'Watch Commander', action: 'Decide on partial workload migration to DR if temps persist', etaMinutes: 8, automated: false },
      { order: 6, actor: 'HVAC Contractor', action: 'Mobilize for emergency chiller repair', etaMinutes: 45, automated: false },
    ],
    estimatedRecoveryMinutes: 180,
    affectedAssets: 9,
    affectedOccupants: 6,
    cascadeRisks: [
      'Thermal shutdown of core compute if temps exceed 32°C',
      'Single chiller operation removes cooling redundancy',
      'Knock-on risk to L2 operations cooling',
    ],
  },
];

export function scenarioById(id: string): EmergencyScenario | undefined {
  return emergencyScenarios.find((s) => s.id === id);
}
