import React, { useState, useEffect } from 'react';
import { AlertTriangle, Bell, Mail, MessageSquare, Settings, Play, Square, Clock, CheckCircle, XCircle } from 'lucide-react';

interface FraudAlert {
  alert_id: string;
  claim_id: string;
  hospital_name: string;
  fraud_score: number;
  risk_level: string;
  timestamp: string;
  suspicious_indicators: string[];
  status: string;
  escalation_level?: string;
}

export default function RealTimeFraudAlerts() {
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [monitoringActive, setMonitoringActive] = useState(false);
  const [threshold, setThreshold] = useState(50);
  const [selectedAlert, setSelectedAlert] = useState<FraudAlert | null>(null);
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    sms: false,
    dashboard: true
  });

  useEffect(() => {
    const fetchMonitoringStatus = async () => {
      try {
        const response = await fetch('/api/alerts/monitoring/status');
        const data = await response.json();
        setMonitoringActive(Boolean(data.monitoring_active));
      } catch (error) {
        console.error('Failed to fetch monitoring status:', error);
      }
    };

    fetchMonitoringStatus();

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [threshold]);

  const fetchAlerts = async () => {
    try {
      const response = await fetch(`/api/alerts?threshold=${threshold}&limit=50&status=`);
      const data = await response.json();
      setAlerts(data.alerts || []);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const startMonitoring = async () => {
    try {
      const response = await fetch('/api/alerts/monitoring/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threshold: threshold })
      });
      const result = await response.json();
      setMonitoringActive(true);
      console.log('Monitoring started:', result);
    } catch (error) {
      console.error('Failed to start monitoring:', error);
    }
  };

  const stopMonitoring = async () => {
    try {
      const response = await fetch('/api/alerts/monitoring/stop', {
        method: 'POST'
      });
      const result = await response.json();
      setMonitoringActive(false);
      console.log('Monitoring stopped:', result);
    } catch (error) {
      console.error('Failed to stop monitoring:', error);
    }
  };

  const updateAlertStatus = async (alertId: string, status: string) => {
    try {
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes: 'Updated via dashboard' })
      });
      const result = await response.json();
      if (result.status === 'updated') {
        setAlerts(alerts.map(alert =>
          alert.alert_id === alertId ? { ...alert, status } : alert
        ));
      }
    } catch (error) {
      console.error('Failed to update alert:', error);
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 0.8) return 'text-red-600 bg-red-50 border-red-200';
    if (score >= 0.6) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-red-600 bg-red-100';
      case 'acknowledged': return 'text-yellow-600 bg-yellow-100';
      case 'resolved': return 'text-green-600 bg-green-100';
      case 'dismissed': return 'text-slate-600 bg-slate-100';
      default: return 'text-slate-600 bg-slate-100';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffMs = now.getTime() - alertTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Real-Time Fraud Alert System</h1>
          <p className="text-slate-500 mt-2">Continuous monitoring and instant notifications for high-risk claims</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${monitoringActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm font-medium text-slate-600">
              {monitoringActive ? 'Monitoring Active' : 'Monitoring Inactive'}
            </span>
          </div>
          <button
            onClick={monitoringActive ? stopMonitoring : startMonitoring}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
              monitoringActive
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {monitoringActive ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {monitoringActive ? 'Stop Monitoring' : 'Start Monitoring'}
          </button>
        </div>
      </div>

      {/* Monitoring Controls */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Monitoring Configuration</h3>
          <Settings className="w-5 h-5 text-slate-400" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Alert Threshold</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="95"
                step="5"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm font-medium text-slate-900 w-12">
                {threshold}%
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Notification Channels</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={notificationSettings.email}
                  onChange={(e) => setNotificationSettings(prev => ({ ...prev, email: e.target.checked }))}
                />
                <Mail className="w-4 h-4" />
                <span className="text-sm">Email</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={notificationSettings.sms}
                  onChange={(e) => setNotificationSettings(prev => ({ ...prev, sms: e.target.checked }))}
                />
                <MessageSquare className="w-4 h-4" />
                <span className="text-sm">SMS</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Active Alerts</label>
            <div className="text-2xl font-bold text-slate-900">{alerts.filter(a => a.status === 'active').length}</div>
            <div className="text-sm text-slate-500">requiring attention</div>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Recent Alerts</h3>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Clock className="w-4 h-4" />
              Auto-refresh every 30 seconds
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-200">
          {alerts.length === 0 ? (
            <div className="p-12 text-center">
              <Bell className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No alerts found</h3>
              <p className="text-slate-500">
                {monitoringActive
                  ? 'Monitoring is active. Alerts will appear here when high-risk claims are detected.'
                  : 'Start monitoring to receive real-time fraud alerts.'
                }
              </p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.alert_id}
                className={`p-6 hover:bg-slate-50 transition-colors cursor-pointer ${
                  selectedAlert?.alert_id === alert.alert_id ? 'bg-indigo-50' : ''
                }`}
                onClick={() => setSelectedAlert(alert)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className={`w-5 h-5 mt-0.5 ${
                      alert.fraud_score >= 0.8 ? 'text-red-500' : 'text-orange-500'
                    }`} />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-slate-900">{alert.alert_id}</span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(alert.status)}`}>
                          {alert.status}
                        </span>
                        {alert.escalation_level === 'high' && (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">
                            HIGH PRIORITY
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-slate-600 mb-1">
                        {alert.claim_id} • {alert.hospital_name}
                      </div>
                      <div className="text-sm text-slate-500">
                        {getTimeAgo(alert.timestamp)} • Fraud Score: {alert.fraud_score.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateAlertStatus(alert.alert_id, 'acknowledged');
                      }}
                      className="px-3 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                      disabled={alert.status !== 'active'}
                    >
                      Acknowledge
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateAlertStatus(alert.alert_id, 'resolved');
                      }}
                      className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                      disabled={alert.status === 'resolved'}
                    >
                      Resolve
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {alert.suspicious_indicators.slice(0, 3).map((indicator, index) => (
                    <span key={index} className="px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded">
                      {indicator}
                    </span>
                  ))}
                  {alert.suspicious_indicators.length > 3 && (
                    <span className="px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded">
                      +{alert.suspicious_indicators.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Alert Details Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Alert Details</h3>
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Alert ID</label>
                  <div className="mt-1 text-sm text-slate-900">{selectedAlert.alert_id}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Claim ID</label>
                  <div className="mt-1 text-sm text-slate-900">{selectedAlert.claim_id}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Hospital</label>
                  <div className="mt-1 text-sm text-slate-900">{selectedAlert.hospital_name}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Fraud Score</label>
                  <div className={`mt-1 text-sm font-semibold ${getRiskColor(selectedAlert.fraud_score)}`}>
                    {(selectedAlert.fraud_score).toFixed(1)}%
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Status</label>
                  <div className="mt-1">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedAlert.status)}`}>
                      {selectedAlert.status}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Timestamp</label>
                  <div className="mt-1 text-sm text-slate-900">{formatTimestamp(selectedAlert.timestamp)}</div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Suspicious Indicators</label>
                <div className="space-y-2">
                  {selectedAlert.suspicious_indicators.map((indicator, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-slate-700">{indicator}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  onClick={() => updateAlertStatus(selectedAlert.alert_id, 'acknowledged')}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
                  disabled={selectedAlert.status !== 'active'}
                >
                  Acknowledge
                </button>
                <button
                  onClick={() => updateAlertStatus(selectedAlert.alert_id, 'resolved')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  disabled={selectedAlert.status === 'resolved'}
                >
                  Mark as Resolved
                </button>
                <button
                  onClick={() => updateAlertStatus(selectedAlert.alert_id, 'dismissed')}
                  className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}