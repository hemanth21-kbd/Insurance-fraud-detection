import React, { useState, useEffect } from 'react';
import { mockHospitals } from '../data/mockData';
import { Building2, AlertTriangle, TrendingUp, ShieldCheck } from 'lucide-react';

export default function HospitalRanking() {
  const [hospitals, setHospitals] = useState(mockHospitals);

  useEffect(() => {
    const fetchHospitalRisk = async () => {
      try {
        const response = await fetch('/api/network/hospital-risk');
        const contentType = response.headers.get("content-type");
        if (response.ok && contentType && contentType.includes("application/json")) {
          const data = await response.json();
          if (data && data.length > 0) {
            // Merge with mock data or replace
            const updatedHospitals = [...mockHospitals];
            data.forEach((backendHospital: any) => {
              const existingIndex = updatedHospitals.findIndex(h => h.name === backendHospital.hospitalName);
              const riskLevel = backendHospital.riskScore > 70 ? 'High' : backendHospital.riskScore > 30 ? 'Medium' : 'Low';
              
              if (existingIndex >= 0) {
                updatedHospitals[existingIndex] = {
                  ...updatedHospitals[existingIndex],
                  fraudRisk: backendHospital.riskScore / 100,
                  riskLevel: riskLevel,
                  totalClaims: updatedHospitals[existingIndex].totalClaims + backendHospital.connections
                };
              } else {
                updatedHospitals.push({
                  id: `H-${Math.floor(Math.random() * 10000)}`,
                  name: backendHospital.hospitalName,
                  location: 'Unknown',
                  avgCost: 0,
                  fraudRisk: backendHospital.riskScore / 100,
                  riskLevel: riskLevel,
                  totalClaims: backendHospital.connections
                });
              }
            });
            setHospitals(updatedHospitals);
          }
        }
      } catch (error) {
        console.error("Failed to fetch hospital risk data:", error);
      }
    };

    fetchHospitalRisk();
    // Poll every 10 seconds
    const interval = setInterval(fetchHospitalRisk, 10000);
    return () => clearInterval(interval);
  }, []);

  const sortedHospitals = [...hospitals].sort((a, b) => b.fraudRisk - a.fraudRisk);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Hospital Fraud Risk Ranking</h1>
          <p className="text-slate-500 mt-1">Leaderboard based on abnormal billing frequency and suspicious patient overlap.</p>
        </div>
        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center space-x-2 shadow-sm">
          <TrendingUp className="w-4 h-4" />
          <span>Export Report</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-rose-50 border border-rose-100 p-6 rounded-xl flex items-start space-x-4">
          <div className="bg-rose-100 p-3 rounded-lg border border-rose-200"><AlertTriangle className="w-6 h-6 text-rose-600" /></div>
          <div>
            <h3 className="text-rose-900 font-bold text-xl">2 High Risk</h3>
            <p className="text-rose-700 text-sm mt-1">Hospitals require immediate audit</p>
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-100 p-6 rounded-xl flex items-start space-x-4">
          <div className="bg-amber-100 p-3 rounded-lg border border-amber-200"><Building2 className="w-6 h-6 text-amber-600" /></div>
          <div>
            <h3 className="text-amber-900 font-bold text-xl">1 Medium Risk</h3>
            <p className="text-amber-700 text-sm mt-1">Hospitals under observation</p>
          </div>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-xl flex items-start space-x-4">
          <div className="bg-emerald-100 p-3 rounded-lg border border-emerald-200"><ShieldCheck className="w-6 h-6 text-emerald-600" /></div>
          <div>
            <h3 className="text-emerald-900 font-bold text-xl">2 Low Risk</h3>
            <p className="text-emerald-700 text-sm mt-1">Hospitals operating normally</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Rank</th>
                <th className="px-6 py-4">Hospital Name</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4 text-right">Avg Treatment Cost</th>
                <th className="px-6 py-4 text-right">Total Claims</th>
                <th className="px-6 py-4 text-center">Risk Score</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedHospitals.map((hospital, index) => (
                <tr key={hospital.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900 font-mono">#{index + 1}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                        hospital.riskLevel === 'High' ? 'bg-rose-100 text-rose-600 border-rose-200' : 
                        hospital.riskLevel === 'Medium' ? 'bg-amber-100 text-amber-600 border-amber-200' : 
                        'bg-emerald-100 text-emerald-600 border-emerald-200'
                      }`}>
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{hospital.name}</p>
                        <p className="text-xs text-slate-500 font-mono">ID: {hospital.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{hospital.location}</td>
                  <td className="px-6 py-4 text-right font-mono text-slate-700">${hospital.avgCost.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right text-slate-600 font-mono">{hospital.totalClaims.toLocaleString()}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            hospital.fraudRisk > 0.7 ? 'bg-rose-500' : 
                            hospital.fraudRisk > 0.3 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${hospital.fraudRisk * 100}%` }}
                        />
                      </div>
                      <span className="font-medium text-slate-700 font-mono">{(hospital.fraudRisk * 100).toFixed(1)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                      hospital.riskLevel === 'High' ? 'bg-rose-100 text-rose-700 border-rose-200' : 
                      hospital.riskLevel === 'Medium' ? 'bg-amber-100 text-amber-700 border-amber-200' : 
                      'bg-emerald-100 text-emerald-700 border-emerald-200'
                    }`}>
                      {hospital.riskLevel} Risk
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
