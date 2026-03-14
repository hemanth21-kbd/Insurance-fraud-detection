import React, { useState } from 'react';
import { Brain, BarChart3, TrendingUp, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface FeatureImportance {
  [key: string]: number;
}

interface ShapExplanation {
  base_value: number;
  shap_values: number[];
  feature_names: string[];
}

export default function AIClaimExplanation() {
  const [selectedClaim, setSelectedClaim] = useState<any>(null);
  const [explanationData, setExplanationData] = useState<any>(null);

  // Mock data for demonstration
  const mockClaims = [
    {
      id: 'CLM-123456',
      hospital: 'City General Hospital',
      amount: 12500,
      fraud_score: 85.2,
      risk_level: 'High Risk',
      features: {
        treatment_cost: 10000,
        claim_amount: 12500,
        admission_days: 5,
        test_count: 12,
        age: 45,
        hospital_rating: 3.8,
        previous_claims: 3,
        diagnosis_complexity: 7.5,
        medicine_count: 8,
        procedure_count: 4
      },
      shap_explanation: {
        base_value: 0.15,
        shap_values: [0.25, 0.18, 0.12, 0.08, 0.05, -0.03, 0.04, 0.15, 0.06, 0.02],
        feature_names: ['treatment_cost', 'claim_amount', 'admission_days', 'test_count', 'age', 'hospital_rating', 'previous_claims', 'diagnosis_complexity', 'medicine_count', 'procedure_count']
      }
    },
    {
      id: 'CLM-789012',
      hospital: 'Metro Medical Center',
      amount: 3200,
      fraud_score: 25.1,
      risk_level: 'Low Risk',
      features: {
        treatment_cost: 2800,
        claim_amount: 3200,
        admission_days: 2,
        test_count: 4,
        age: 52,
        hospital_rating: 4.2,
        previous_claims: 1,
        diagnosis_complexity: 3.2,
        medicine_count: 3,
        procedure_count: 2
      },
      shap_explanation: {
        base_value: 0.15,
        shap_values: [-0.02, -0.01, -0.03, -0.04, 0.01, 0.02, -0.05, -0.08, -0.06, -0.02],
        feature_names: ['treatment_cost', 'claim_amount', 'admission_days', 'test_count', 'age', 'hospital_rating', 'previous_claims', 'diagnosis_complexity', 'medicine_count', 'procedure_count']
      }
    }
  ];

  const handleClaimSelect = (claim: any) => {
    setSelectedClaim(claim);
    setExplanationData(claim);
  };

  const getRiskColor = (score: number) => {
    if (score >= 75) return 'text-red-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getRiskBgColor = (score: number) => {
    if (score >= 75) return 'bg-red-50 border-red-200';
    if (score >= 40) return 'bg-yellow-50 border-yellow-200';
    return 'bg-green-50 border-green-200';
  };

  const formatFeatureName = (name: string) => {
    return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const prepareChartData = (shapData: ShapExplanation) => {
    return shapData.feature_names.map((name, index) => ({
      feature: formatFeatureName(name),
      shap_value: shapData.shap_values[index],
      importance: Math.abs(shapData.shap_values[index])
    })).sort((a, b) => b.importance - a.importance);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">AI Claim Explanation System</h1>
          <p className="text-slate-500 mt-2">Explainable AI analysis with SHAP and feature importance for fraud detection</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-lg">
          <Brain className="w-4 h-4 text-indigo-600" />
          <span className="text-sm font-medium text-indigo-700">XGBoost + SHAP</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Claims List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">Recent Claims</h3>
            <p className="text-sm text-slate-500 mt-1">Select a claim to see detailed AI explanations</p>
          </div>
          <div className="divide-y divide-slate-200 max-h-96 overflow-y-auto">
            {mockClaims.map((claim) => (
              <div
                key={claim.id}
                onClick={() => handleClaimSelect(claim)}
                className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors ${
                  selectedClaim?.id === claim.id ? 'bg-indigo-50 border-r-4 border-indigo-500' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-slate-900">{claim.id}</span>
                  <span className={`text-sm font-semibold ${getRiskColor(claim.fraud_score)}`}>
                    {claim.fraud_score.toFixed(1)}%
                  </span>
                </div>
                <div className="text-sm text-slate-600 mb-1">{claim.hospital}</div>
                <div className="text-sm text-slate-500">${claim.amount.toLocaleString()}</div>
                <div className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-2 ${getRiskBgColor(claim.fraud_score)}`}>
                  {claim.risk_level}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Explanation Dashboard */}
        <div className="lg:col-span-2 space-y-6">
          {selectedClaim ? (
            <>
              {/* Claim Overview */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">Claim Analysis</h3>
                  <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getRiskBgColor(selectedClaim.fraud_score)}`}>
                    {selectedClaim.risk_level}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900">{selectedClaim.fraud_score.toFixed(1)}%</div>
                    <div className="text-sm text-slate-500">Fraud Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900">${selectedClaim.amount.toLocaleString()}</div>
                    <div className="text-sm text-slate-500">Claim Amount</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900">{selectedClaim.features.admission_days}</div>
                    <div className="text-sm text-slate-500">Admission Days</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900">{selectedClaim.features.medicine_count}</div>
                    <div className="text-sm text-slate-500">Medicines</div>
                  </div>
                </div>

                {/* AI Confidence */}
                <div className="bg-slate-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-5 h-5 text-indigo-600" />
                    <span className="font-medium text-slate-900">AI Model Confidence</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full"
                      style={{ width: `${selectedClaim.fraud_score}%` }}
                    ></div>
                  </div>
                  <div className="text-sm text-slate-600 mt-1">
                    Model predicts {selectedClaim.fraud_score >= 50 ? 'fraudulent' : 'legitimate'} with {(selectedClaim.fraud_score / 100 * 0.8 + 0.2).toFixed(2)} confidence
                  </div>
                </div>
              </div>

              {/* SHAP Feature Importance */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-semibold text-slate-900">SHAP Feature Importance</h3>
                </div>

                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={prepareChartData(selectedClaim.shap_explanation)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="feature"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        fontSize={12}
                      />
                      <YAxis />
                      <Tooltip
                        formatter={(value: number) => [value.toFixed(3), 'SHAP Value']}
                        labelFormatter={(label) => `Feature: ${label}`}
                      />
                      <Bar dataKey="shap_value" fill="#6366f1">
                        {prepareChartData(selectedClaim.shap_explanation).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.shap_value > 0 ? '#ef4444' : '#10b981'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    <span>Increases fraud risk</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span>Decreases fraud risk</span>
                  </div>
                </div>
              </div>

              {/* Top Contributing Factors */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Key Contributing Factors</h3>
                <div className="space-y-3">
                  {prepareChartData(selectedClaim.shap_explanation).slice(0, 5).map((factor, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {factor.shap_value > 0 ? (
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        ) : (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                        <span className="font-medium text-slate-900">{factor.feature}</span>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold ${factor.shap_value > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {factor.shap_value > 0 ? '+' : ''}{factor.shap_value.toFixed(3)}
                        </div>
                        <div className="text-xs text-slate-500">SHAP value</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 text-center">
              <Info className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">Select a Claim</h3>
              <p className="text-slate-500">Choose a claim from the list to see detailed AI explanations and feature importance analysis.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}