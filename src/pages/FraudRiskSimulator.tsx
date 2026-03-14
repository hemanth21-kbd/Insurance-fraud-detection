import React, { useState } from 'react';
import { Calculator, TrendingUp, AlertTriangle, CheckCircle, Play, RotateCcw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface SimulationResult {
  fraud_probability: number;
  fraud_score: number;
  risk_level: string;
  risk_color: string;
  risk_factors: Array<{
    factor: string;
    impact: string;
    magnitude: number;
  }>;
  protective_factors: Array<{
    factor: string;
    impact: string;
    magnitude: number;
  }>;
  confidence_interval: {
    lower: number;
    upper: number;
  };
  recommendations: string[];
}

export default function FraudRiskSimulator() {
  const [simulationParams, setSimulationParams] = useState({
    treatment_cost: 5000,
    claim_amount: 6500,
    admission_days: 3,
    test_count: 5,
    age: 45,
    hospital_rating: 3.5,
    previous_claims: 1,
    diagnosis_complexity: 5.0,
    medicine_count: 4,
    procedure_count: 2
  });

  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [scenarios, setScenarios] = useState<any[]>([]);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/simulator/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(simulationParams)
      });
      const result = await response.json();
      setSimulationResult(result);
    } catch (error) {
      console.error('Simulation failed:', error);
      // Mock result for demonstration
      setSimulationResult({
        fraud_probability: 0.35,
        fraud_score: 35,
        risk_level: 'Medium Risk',
        risk_color: 'yellow',
        risk_factors: [
          { factor: 'Claim Amount', impact: 'increases', magnitude: 0.15 },
          { factor: 'Admission Days', impact: 'increases', magnitude: 0.08 }
        ],
        protective_factors: [
          { factor: 'Hospital Rating', impact: 'decreases', magnitude: 0.12 },
          { factor: 'Age', impact: 'decreases', magnitude: 0.05 }
        ],
        confidence_interval: { lower: 0.25, upper: 0.45 },
        recommendations: [
          'Consider additional verification for claim amount',
          'Review admission duration against diagnosis',
          'Standard approval workflow recommended'
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const loadScenarios = async () => {
    try {
      const response = await fetch('/api/simulator/scenarios');
      const data = await response.json();
      setScenarios(data.scenarios || []);
    } catch (error) {
      console.error('Failed to load scenarios:', error);
      // Mock scenarios
      setScenarios([
        {
          name: 'Normal Claim',
          description: 'Typical legitimate insurance claim',
          parameters: {
            treatment_cost: 2500,
            claim_amount: 3200,
            admission_days: 2,
            test_count: 3,
            age: 45,
            hospital_rating: 4.0,
            previous_claims: 1,
            diagnosis_complexity: 4.0,
            medicine_count: 4,
            procedure_count: 2
          }
        },
        {
          name: 'High-Risk Claim',
          description: 'Claim with multiple suspicious indicators',
          parameters: {
            treatment_cost: 15000,
            claim_amount: 18500,
            admission_days: 1,
            test_count: 15,
            age: 35,
            hospital_rating: 2.5,
            previous_claims: 8,
            diagnosis_complexity: 9.0,
            medicine_count: 12,
            procedure_count: 8
          }
        }
      ]);
    }
  };

  const applyScenario = (scenario: any) => {
    setSimulationParams(scenario.parameters);
    setSimulationResult(null);
  };

  const resetSimulation = () => {
    setSimulationParams({
      treatment_cost: 5000,
      claim_amount: 6500,
      admission_days: 3,
      test_count: 5,
      age: 45,
      hospital_rating: 3.5,
      previous_claims: 1,
      diagnosis_complexity: 5.0,
      medicine_count: 4,
      procedure_count: 2
    });
    setSimulationResult(null);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'High Risk': return 'text-red-600 bg-red-50 border-red-200';
      case 'Medium Risk': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Low Risk': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const prepareChartData = (result: SimulationResult) => {
    const allFactors = [...result.risk_factors, ...result.protective_factors];
    return allFactors.map(factor => ({
      factor: factor.factor,
      magnitude: factor.impact === 'increases' ? factor.magnitude : -factor.magnitude,
      impact: factor.impact
    }));
  };

  React.useEffect(() => {
    loadScenarios();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Fraud Risk Simulator</h1>
          <p className="text-slate-500 mt-2">Predict fraud probability for hypothetical claim scenarios</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-lg">
          <Calculator className="w-4 h-4 text-indigo-600" />
          <span className="text-sm font-medium text-indigo-700">XGBoost Model</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Simulation Parameters */}
        <div className="lg:col-span-2 space-y-6">
          {/* Parameter Inputs */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900">Claim Parameters</h3>
              <button
                onClick={resetSimulation}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-slate-100 text-slate-700 rounded hover:bg-slate-200"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Treatment Cost ($)</label>
                <input
                  type="number"
                  value={simulationParams.treatment_cost}
                  onChange={(e) => setSimulationParams(prev => ({ ...prev, treatment_cost: Number(e.target.value) }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Claim Amount ($)</label>
                <input
                  type="number"
                  value={simulationParams.claim_amount}
                  onChange={(e) => setSimulationParams(prev => ({ ...prev, claim_amount: Number(e.target.value) }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Admission Days</label>
                <input
                  type="number"
                  value={simulationParams.admission_days}
                  onChange={(e) => setSimulationParams(prev => ({ ...prev, admission_days: Number(e.target.value) }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Test Count</label>
                <input
                  type="number"
                  value={simulationParams.test_count}
                  onChange={(e) => setSimulationParams(prev => ({ ...prev, test_count: Number(e.target.value) }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Patient Age</label>
                <input
                  type="number"
                  value={simulationParams.age}
                  onChange={(e) => setSimulationParams(prev => ({ ...prev, age: Number(e.target.value) }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Hospital Rating (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  value={simulationParams.hospital_rating}
                  onChange={(e) => setSimulationParams(prev => ({ ...prev, hospital_rating: Number(e.target.value) }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Previous Claims</label>
                <input
                  type="number"
                  value={simulationParams.previous_claims}
                  onChange={(e) => setSimulationParams(prev => ({ ...prev, previous_claims: Number(e.target.value) }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Diagnosis Complexity (1-10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  step="0.1"
                  value={simulationParams.diagnosis_complexity}
                  onChange={(e) => setSimulationParams(prev => ({ ...prev, diagnosis_complexity: Number(e.target.value) }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Medicine Count</label>
                <input
                  type="number"
                  value={simulationParams.medicine_count}
                  onChange={(e) => setSimulationParams(prev => ({ ...prev, medicine_count: Number(e.target.value) }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Procedure Count</label>
                <input
                  type="number"
                  value={simulationParams.procedure_count}
                  onChange={(e) => setSimulationParams(prev => ({ ...prev, procedure_count: Number(e.target.value) }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              onClick={runSimulation}
              disabled={loading}
              className="w-full mt-6 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors disabled:opacity-70 flex justify-center items-center"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Running Simulation...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  Run Fraud Risk Simulation
                </div>
              )}
            </button>
          </div>

          {/* Predefined Scenarios */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Predefined Scenarios</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scenarios.map((scenario, index) => (
                <div key={index} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
                  <h4 className="font-medium text-slate-900 mb-2">{scenario.name}</h4>
                  <p className="text-sm text-slate-600 mb-3">{scenario.description}</p>
                  <button
                    onClick={() => applyScenario(scenario)}
                    className="w-full py-2 px-3 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 text-sm font-medium"
                  >
                    Load Scenario
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Simulation Results */}
        <div className="space-y-6">
          {simulationResult ? (
            <>
              {/* Risk Assessment */}
              <div className={`p-6 rounded-xl shadow-sm border ${getRiskColor(simulationResult.risk_level)}`}>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5" />
                  <h3 className="text-lg font-semibold text-slate-900">Risk Assessment</h3>
                </div>

                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-slate-900 mb-1">
                    {(simulationResult.fraud_probability * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-slate-600">Fraud Probability</div>
                </div>

                <div className="text-center mb-4">
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getRiskColor(simulationResult.risk_level)}`}>
                    {simulationResult.risk_level}
                  </span>
                </div>

                <div className="text-xs text-slate-600 text-center">
                  Confidence Interval: {(simulationResult.confidence_interval.lower * 100).toFixed(1)}% - {(simulationResult.confidence_interval.upper * 100).toFixed(1)}%
                </div>
              </div>

              {/* Risk Factors */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Key Risk Factors</h3>

                <div className="space-y-3 mb-6">
                  <h4 className="font-medium text-red-700 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Risk Factors
                  </h4>
                  {simulationResult.risk_factors.map((factor, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="text-slate-700">{factor.factor}</span>
                      <span className="font-medium text-red-600">+{(factor.magnitude * 100).toFixed(1)}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-green-700 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Protective Factors
                  </h4>
                  {simulationResult.protective_factors.map((factor, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="text-slate-700">{factor.factor}</span>
                      <span className="font-medium text-green-600">-{(factor.magnitude * 100).toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Recommendations</h3>
                <div className="space-y-2">
                  {simulationResult.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-slate-700">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Factor Importance Chart */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Factor Impact Analysis</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={prepareChartData(simulationResult)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="factor"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        fontSize={10}
                      />
                      <YAxis />
                      <Tooltip
                        formatter={(value: number) => [value.toFixed(3), 'Impact']}
                      />
                      <Bar dataKey="magnitude" fill="#6366f1">
                        {prepareChartData(simulationResult).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.magnitude > 0 ? '#ef4444' : '#10b981'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 text-center">
              <Calculator className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">Run Simulation</h3>
              <p className="text-slate-500">Adjust the parameters above and click "Run Fraud Risk Simulation" to see the predicted fraud probability and detailed analysis.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}