import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, AlertTriangle, TrendingUp, Filter, Download, Activity, Building2 } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface HeatmapData {
  hospital_name: string;
  location: number[];
  address: string;
  avg_fraud_probability: number;
  risk_level: string;
  risk_color: string;
  claim_count: number;
  avg_claim_amount: number;
  total_claim_amount: number;
  hospital_rating: number;
  coordinates: { lat: number; lng: number };
}

export default function FraudRiskHeatmap() {
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    hospital: [] as string[],
    claim_type: [] as string[],
    risk_level: [] as string[],
    date_range: ['', '']
  });
  const [selectedHospital, setSelectedHospital] = useState<HeatmapData | null>(null);

  const mapCenter = useMemo(() => {
    if (heatmapData.length === 0) return [20.5937, 78.9629] as [number, number];
    const avgLat = heatmapData.reduce((sum, h) => sum + h.coordinates.lat, 0) / heatmapData.length;
    const avgLng = heatmapData.reduce((sum, h) => sum + h.coordinates.lng, 0) / heatmapData.length;
    return [avgLat, avgLng] as [number, number];
  }, [heatmapData]);

  useEffect(() => {
    fetchHeatmapData();
  }, [filters]);

  const fetchHeatmapData = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.hospital.length > 0) {
        filters.hospital.forEach(h => queryParams.append('hospital', h));
      }
      if (filters.claim_type.length > 0) {
        filters.claim_type.forEach(ct => queryParams.append('claim_type', ct));
      }
      if (filters.risk_level.length > 0) {
        filters.risk_level.forEach(rl => queryParams.append('risk_level', rl));
      }
      if (filters.date_range[0] && filters.date_range[1]) {
        queryParams.append('date_from', filters.date_range[0]);
        queryParams.append('date_to', filters.date_range[1]);
      }

      const response = await fetch(`/api/heatmap?${queryParams}`);
      const data = await response.json();
      setHeatmapData(data.heatmap_data || []);
    } catch (error) {
      console.error('Failed to fetch heatmap data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (probability: number) => {
    if (probability >= 0.6) return 'bg-red-500';
    if (probability >= 0.3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getRiskTextColor = (probability: number) => {
    if (probability >= 0.6) return 'text-red-700';
    if (probability >= 0.3) return 'text-yellow-700';
    return 'text-green-700';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Fraud Risk Heatmap</h1>
          <p className="text-slate-500 mt-2">Geographic visualization of hospital fraud patterns with interactive filtering</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          <Download className="w-4 h-4" />
          Export Data
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-900">Filters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Risk Level</label>
            <select
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
              value={filters.risk_level[0] || ''}
              onChange={(e) => {
                setFilters(prev => ({ ...prev, risk_level: e.target.value ? [e.target.value] : [] }));
              }}
            >
              <option value="">All Risks</option>
              <option value="Low Risk">Low Risk</option>
              <option value="Medium Risk">Medium Risk</option>
              <option value="High Risk">High Risk</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Hospital Name</label>
            <input
              type="text"
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
              placeholder="e.g. AIIMS"
              onChange={(e) => setFilters(prev => ({ ...prev, hospital: e.target.value ? [e.target.value] : [] }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Date From</label>
            <input
              type="date"
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
              onChange={(e) => setFilters(prev => ({
                ...prev,
                date_range: [e.target.value, prev.date_range[1]]
              }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Date To</label>
            <input
              type="date"
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
              onChange={(e) => setFilters(prev => ({
                ...prev,
                date_range: [prev.date_range[0], e.target.value]
              }))}
            />
          </div>
        </div>
      </div>

      {/* Risk Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-500">Avg Fraud Prob</span>
            <Activity className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {(heatmapData.reduce((sum, h) => sum + h.avg_fraud_probability, 0) / (heatmapData.length || 1) * 100).toFixed(1)}%
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-500">Total Claims</span>
            <AlertTriangle className="w-5 h-5 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {heatmapData.reduce((sum, h) => sum + h.claim_count, 0).toLocaleString()}
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-500">Flagged Amount</span>
            <Building2 className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            ${(heatmapData.reduce((sum, h) => sum + h.total_claim_amount, 0) / 1000000).toFixed(1)}M
          </div>
        </div>
      </div>

      {/* Heatmap Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 px-2">Geographic Risk Distribution</h3>
          <div className="h-[500px] rounded-lg overflow-hidden">
            <MapContainer
              center={[20.5937, 78.9629]}
              zoom={5}
              className="h-full w-full"
            >
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {heatmapData.map((hospital) => (
                <CircleMarker
                  key={hospital.hospital_name}
                  center={[hospital.coordinates.lat, hospital.coordinates.lng]}
                  radius={8 + (hospital.avg_fraud_probability * 20)}
                  pathOptions={{
                    color: hospital.risk_color,
                    fillColor: hospital.risk_color,
                    fillOpacity: 0.7
                  }}
                >
                  <Popup>
                    <div className="text-sm p-1">
                      <div className="font-bold text-slate-900 mb-1">{hospital.hospital_name}</div>
                      <div className="text-[10px] text-slate-500 mb-2">{hospital.address}</div>
                      <div className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Fraud Index</span>
                        <span className={`text-xs font-black ${hospital.avg_fraud_probability > 0.15 ? 'text-rose-600' : 'text-slate-900'}`}>
                          {(hospital.avg_fraud_probability * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* Risk Summary */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Risk Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Total Hospitals</span>
                <span className="font-semibold">{heatmapData.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">High Risk</span>
                <span className="font-semibold text-red-600">
                  {heatmapData.filter(h => h.risk_level === 'High Risk').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Medium Risk</span>
                <span className="font-semibold text-yellow-600">
                  {heatmapData.filter(h => h.risk_level === 'Medium Risk').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Low Risk</span>
                <span className="font-semibold text-green-600">
                  {heatmapData.filter(h => h.risk_level === 'Low Risk').length}
                </span>
              </div>
            </div>
          </div>

          {/* Risk Legend */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Risk Legend</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-sm">High Risk (60-100%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <span className="text-sm">Medium Risk (30-60%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-sm">Low Risk (0-30%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hospital List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Hospital Risk Rankings</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Hospital</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Risk Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Fraud Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Claims</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Avg Amount</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {heatmapData.map((hospital, index) => (
                <tr key={index} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-slate-900">{hospital.hospital_name}</div>
                      <div className="text-sm text-slate-500">{hospital.address}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskColor(hospital.avg_fraud_probability)} text-white`}>
                      {hospital.risk_level}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    {(hospital.avg_fraud_probability * 100).toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    {hospital.claim_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    ${hospital.avg_claim_amount.toLocaleString()}
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