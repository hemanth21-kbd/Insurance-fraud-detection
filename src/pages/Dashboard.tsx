import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, Building2, Users } from 'lucide-react';
import { mockClaims } from '../data/mockData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
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

  useEffect(() => {
    const fetchRecentClaims = async () => {
      try {
        const response = await fetch('/api/claims/recent');
        const contentType = response.headers.get("content-type");
        if (response.ok && contentType && contentType.includes("application/json")) {
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
    const interval = setInterval(fetchRecentClaims, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Fraud Intelligence Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Claims (30d)" value="12,450" icon={<Activity className="w-6 h-6 text-indigo-600" />} />
        <StatCard title="Suspicious Claims" value="842" icon={<AlertTriangle className="w-6 h-6 text-rose-600" />} />
        <StatCard title="Hospitals Monitored" value="50" icon={<Building2 className="w-6 h-6 text-blue-600" />} />
        <StatCard title="Active Patients" value="2,000" icon={<Users className="w-6 h-6 text-emerald-600" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold mb-4 text-slate-800">Claims vs Fraud Detected</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} stroke="#64748b" />
                <YAxis axisLine={false} tickLine={false} stroke="#64748b" />
                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a' }} />
                <Bar dataKey="claims" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Total Claims" />
                <Bar dataKey="fraud" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Fraudulent" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold mb-4 text-slate-800">Recent Suspicious Activity</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg font-mono">Claim ID</th>
                  <th className="px-4 py-3">Hospital</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3 rounded-tr-lg">Risk Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentClaims.filter(c => c.fraudProb > 0.5).slice(0, 5).map((claim) => (
                  <tr key={claim.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900 font-mono">{claim.id}</td>
                    <td className="px-4 py-3 text-slate-600">{claim.hospitalId}</td>
                    <td className="px-4 py-3 text-slate-700 font-mono">${claim.amount.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs font-medium bg-rose-100 text-rose-700 border border-rose-200 rounded-full">
                        {(claim.fraudProb * 100).toFixed(1)}%
                      </span>
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

function StatCard({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4">
      <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900 font-mono">{value}</h3>
      </div>
    </div>
  );
}
