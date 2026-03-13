export const mockHospitals = [
  { id: 'H001', name: 'General Hospital North', location: 'North', avgCost: 2500, totalClaims: 1200, fraudRisk: 0.12, riskLevel: 'Low' },
  { id: 'H002', name: 'City Care Center', location: 'Central', avgCost: 4800, totalClaims: 850, fraudRisk: 0.85, riskLevel: 'High' },
  { id: 'H003', name: 'Westside Medical', location: 'West', avgCost: 3100, totalClaims: 2100, fraudRisk: 0.45, riskLevel: 'Medium' },
  { id: 'H004', name: 'South Valley Health', location: 'South', avgCost: 2900, totalClaims: 950, fraudRisk: 0.22, riskLevel: 'Low' },
  { id: 'H005', name: 'East End Clinic', location: 'East', avgCost: 5200, totalClaims: 400, fraudRisk: 0.92, riskLevel: 'High' },
];

export const mockClaims = [
  { id: 'C1023', patientId: 'P045', hospitalId: 'H002', doctorId: 'D012', treatment: 'T04', amount: 12500, avgCost: 3000, date: '2023-10-15', fraudProb: 0.87, status: 'Suspicious' },
  { id: 'C1024', patientId: 'P089', hospitalId: 'H001', doctorId: 'D005', treatment: 'T12', amount: 2400, avgCost: 2500, date: '2023-10-16', fraudProb: 0.12, status: 'Normal' },
  { id: 'C1025', patientId: 'P112', hospitalId: 'H005', doctorId: 'D044', treatment: 'T08', amount: 18000, avgCost: 4000, date: '2023-10-16', fraudProb: 0.95, status: 'Suspicious' },
  { id: 'C1026', patientId: 'P045', hospitalId: 'H003', doctorId: 'D012', treatment: 'T04', amount: 12500, avgCost: 3000, date: '2023-10-17', fraudProb: 0.89, status: 'Suspicious' },
];

export const mockNetworkData = {
  nodes: [
    { id: 'P045', group: 1, label: 'Patient P045', val: 1 },
    { id: 'P112', group: 1, label: 'Patient P112', val: 1 },
    { id: 'D012', group: 2, label: 'Dr. Smith (D012)', val: 2 },
    { id: 'D044', group: 2, label: 'Dr. Jones (D044)', val: 2 },
    { id: 'H002', group: 3, label: 'City Care (H002)', val: 3 },
    { id: 'H005', group: 3, label: 'East End (H005)', val: 3 },
    { id: 'PH01', group: 4, label: 'Pharmacy 1', val: 1 },
  ],
  links: [
    { source: 'P045', target: 'D012', value: 5 },
    { source: 'P045', target: 'H002', value: 5 },
    { source: 'D012', target: 'H002', value: 10 },
    { source: 'P112', target: 'D044', value: 3 },
    { source: 'D044', target: 'H005', value: 8 },
    { source: 'P112', target: 'H005', value: 3 },
    { source: 'P045', target: 'PH01', value: 2 },
    { source: 'D012', target: 'PH01', value: 4 },
  ]
};

export const mockShapData = [
  { feature: 'Claim Amount vs Avg Cost', contribution: 0.45 },
  { feature: 'Doctor Claim Density', contribution: 0.25 },
  { feature: 'Hospital Risk Score', contribution: 0.15 },
  { feature: 'Patient Claim Frequency', contribution: 0.10 },
  { feature: 'Diagnosis Mismatch', contribution: 0.05 },
];
