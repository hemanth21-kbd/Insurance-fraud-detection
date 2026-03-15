import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, Building2, Users, RefreshCw, CheckCircle, Database, Shield } from 'lucide-react';
import { mockClaims } from '../data/mockData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const chartData = [
  { name: 'Mon', claims: 400, fraud: 24 },
  { name: 'Tue', claims: 300, fraud: 13 },
  { name: 'Wed', claims: 550, fraud: 45 },
  { name: 'Thu', claims: 200, fraud: 8 },
  { name: 'Fri', claims: 278, fraud: 39 },
  { name: 'Sat', claims: 189, fraud: 48 },
  { name: 'Sun', claims: 239, fraud: 38 },
];

export default function Dashboard() {
  const [recentClaims, setRecentClaims] = useState(mockClaims);
  const [retraining, setRetraining] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [stats, setStats] = useState({
    totalClaims: "12,450",
    suspicious: "842",
    hospitals: "15",
    activePatients: "2,042"
  });

  useEffect(() => {
    const fetchRecentClaims = async () => {
      try {
        const response = await fetch('/api/claims/recent');
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            setRecentClaims(data);
          }
        }
      } catch (error) {
        console.error("Failed to fetch recent claims:", error);
      }
    };

    fetchRecentClaims();
    const interval = setInterval(fetchRecentClaims, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleRetrain = async () => {
    setRetraining(true);
    try {
      const response = await fetch('/api/system/retrain', { method: 'POST' });
      if (response.ok) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 5000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRetraining(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Fraud Intelligence Overview</h1>
          <p className="text-slate-500">Real-time surveillance and predictive analytics engine</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[10px] font-black border border-emerald-100 uppercase tracking-wider">
              <Shield className="w-3 h-3" />
              Dataset Trained & Active
            </div>
            <span className="text-[10px] text-slate-400 font-mono">ID: XG-BOOST-V3.2 | OPTIMIZED: {new Date().toLocaleDateString()}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {showSuccess && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-sm font-bold rounded-lg border border-emerald-100 animate-in fade-in slide-in-from-right-4">
              <CheckCircle className="w-4 h-4" />
              Models Optimized
            </div>
          )}
          <button
            onClick={handleRetrain}
            disabled={retraining}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${retraining ? 'animate-spin' : ''}`} />
            {retraining ? 'Retraining System...' : 'Retrain with Fresh Dataset'}
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Claims (30d)" value={stats.totalClaims} icon={<Activity className="w-6 h-6 text-indigo-600" />} change="+12%" />
        <StatCard title="Suspicious Claims" value={stats.suspicious} icon={<AlertTriangle className="w-6 h-6 text-rose-600" />} change="+5.2%" isNegative />
        <StatCard title="Hospitals Monitored" value={stats.hospitals} icon={<Building2 className="w-6 h-6 text-blue-600" />} />
        <StatCard title="Indexed Patients" value={stats.activePatients} icon={<Database className="w-6 h-6 text-emerald-600" />} change="+184" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800">Fraud Detection Trends</h3>
            <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                Claims
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                Fraud
              </div>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} stroke="#94a3b8" fontSize={12} dy={10} />
                <YAxis axisLine={false} tickLine={false} stroke="#94a3b8" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Line type="monotone" dataKey="claims" stroke="#6366f1" strokeWidth={3} dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="fraud" stroke="#f43f5e" strokeWidth={3} dot={{ fill: '#f43f5e', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold mb-6 text-slate-800">Real-time Suspect Monitoring</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] text-slate-400 uppercase tracking-widest font-black bg-slate-50/80">
                <tr>
                  <th className="px-4 py-4 rounded-tl-xl">Identification</th>
                  <th className="px-4 py-4">Institution</th>
                  <th className="px-4 py-4">Exposure</th>
                  <th className="px-4 py-4 rounded-tr-xl text-center">Threat Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentClaims.slice(0, 5).map((claim, idx) => (
                  <tr key={claim.id + idx} className="hover:bg-slate-50 transition-all group">
                    <td className="px-4 py-4">
                      <div className="font-bold text-slate-900 font-mono text-xs">{claim.id}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{new Date(claim.timestamp).toLocaleTimeString()}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-xs font-semibold text-slate-700">{claim.hospitalId}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-xs font-bold text-slate-900">${(claim.amount || 0).toLocaleString()}</div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight border shadow-sm ${
                        claim.fraudProb > 0.7 
                          ? "bg-rose-50 text-rose-600 border-rose-100" 
                          : claim.fraudProb > 0.4 
                          ? "bg-amber-50 text-amber-600 border-amber-100" 
                          : "bg-emerald-50 text-emerald-600 border-emerald-100"
                      }`}>
                        {(claim.fraudProb * 100).toFixed(0)}% RISK
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, change, isNegative }: { title: string, value: string, icon: React.ReactNode, change?: string, isNegative?: boolean }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-5 transition-all hover:border-indigo-100 hover:shadow-indigo-100/20 hover:shadow-lg">
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 group-hover:bg-white shadow-inner">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</p>
        <div className="flex items-baseline gap-2 mt-1">
          <h3 className="text-2xl font-black text-slate-900 font-mono">{value}</h3>
          {change && (
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${isNegative ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
              {change}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
