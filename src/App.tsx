import React, { useState, useEffect } from 'react';
import { Activity, ShieldAlert, Network, Building2, Menu, X, FileCode2, Server, Key, UserPlus, LogOut, UserCheck } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import ClaimDetector from './pages/ClaimDetector';
import NetworkGraph from './pages/NetworkGraph';
import HospitalRanking from './pages/HospitalRanking';
import Architecture from './pages/Architecture';
import FraudRiskHeatmap from './pages/FraudRiskHeatmap';
import AIClaimExplanation from './pages/AIClaimExplanation';
import RealTimeFraudAlerts from './pages/RealTimeFraudAlerts';
import FraudRiskSimulator from './pages/FraudRiskSimulator';
import PatientRegistration from './pages/PatientRegistration';
import LoginPage from './pages/LoginPage';
import { useAuth } from './context/AuthContext';
import { cn } from './lib/utils';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { isAuthenticated, user, logout } = useAuth();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const navItems = [
    { id: 'dashboard', label: 'Fraud Intelligence', icon: <Activity className="w-5 h-5" /> },
    { id: 'registration', label: 'Patient Onboarding', icon: <UserPlus className="w-5 h-5" /> },
    { id: 'detector', label: 'Submit Medical Claim', icon: <ShieldAlert className="w-5 h-5" /> },
    { id: 'heatmap', label: 'Network Risk Heatmap', icon: <Network className="w-5 h-5" /> },
    { id: 'explanation', label: 'AI Risk Factors', icon: <FileCode2 className="w-5 h-5" /> },
    { id: 'alerts', label: 'Live Fraud Alerts', icon: <Server className="w-5 h-5" /> },
    { id: 'simulator', label: 'Simulation Lab', icon: <Building2 className="w-5 h-5" /> },
    { id: 'architecture', label: 'System Logic', icon: <Server className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      {/* Sidebar */}
      <aside className={cn(
        "bg-slate-900 text-slate-300 w-72 flex-shrink-0 transition-all duration-300 ease-in-out flex flex-col z-20",
        !isSidebarOpen && "-ml-72"
      )}>
        <div className="h-20 flex items-center px-6 border-b border-slate-800">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center mr-3 shadow-lg shadow-indigo-900/20">
            <ShieldAlert className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white leading-tight">FRAUD INTEL</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Health Intelligence</p>
          </div>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          <div className="px-4 mb-4">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Main Operations</p>
          </div>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group",
                activeTab === item.id 
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/40" 
                  : "hover:bg-slate-800 hover:text-white"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-lg transition-colors",
                activeTab === item.id ? "bg-indigo-500/50" : "bg-slate-800 group-hover:bg-slate-700"
              )}>
                {item.icon}
              </div>
              <span className="flex-1 text-left">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-indigo-400 border border-slate-600">
                {user?.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{user?.name}</p>
                <div className="flex items-center gap-1">
                  <UserCheck className="w-3 h-3 text-emerald-400" />
                  <p className="text-[10px] text-slate-500 capitalize">{user?.authMethod} ID Verified</p>
                </div>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 py-2 bg-slate-700 hover:bg-rose-500/10 hover:text-rose-500 text-slate-300 text-xs font-bold rounded-lg transition-all border border-slate-600"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out System
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 sm:px-6 lg:px-8 flex-shrink-0 z-10 shadow-sm">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all border border-transparent hover:border-indigo-100"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          
          <div className="ml-4 flex-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-bold uppercase tracking-wider border border-slate-200">
                Active Node: Node-01
              </span>
              <div className="h-4 w-px bg-slate-200 mx-2"></div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                {navItems.find(i => i.id === activeTab)?.label}
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <div className="hidden md:flex flex-col items-end">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[11px] font-bold text-slate-800 tracking-tight">AI SURVEILLANCE ACTIVE</span>
              </div>
              <span className="text-[9px] text-slate-400 font-mono">SECURE LINK ESTABLISHED</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-indigo-100 border-2 border-indigo-200">
              AI
            </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 bg-slate-50/50">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'registration' && <PatientRegistration />}
            {activeTab === 'detector' && <ClaimDetector />}
            {activeTab === 'heatmap' && <FraudRiskHeatmap />}
            {activeTab === 'explanation' && <AIClaimExplanation />}
            {activeTab === 'alerts' && <RealTimeFraudAlerts />}
            {activeTab === 'simulator' && <FraudRiskSimulator />}
            {activeTab === 'architecture' && <Architecture />}
          </div>
        </div>
      </main>
    </div>
  );
}
