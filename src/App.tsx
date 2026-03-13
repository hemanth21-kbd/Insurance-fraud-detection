import React, { useState, useEffect } from 'react';
import { Activity, ShieldAlert, Network, Building2, Menu, X, FileCode2, Server, Key } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import ClaimDetector from './pages/ClaimDetector';
import NetworkGraph from './pages/NetworkGraph';
import HospitalRanking from './pages/HospitalRanking';
import Architecture from './pages/Architecture';
import { cn } from './lib/utils';

// Declare window.aistudio for TypeScript
declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState('detector');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [hasApiKey, setHasApiKey] = useState(true);

  useEffect(() => {
    const checkApiKey = async () => {
      if (window.aistudio?.hasSelectedApiKey) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      }
    };
    checkApiKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      // Assume success to mitigate race condition
      setHasApiKey(true);
    }
  };

  if (!hasApiKey) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-slate-100">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Key className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-3">API Key Required</h1>
          <p className="text-slate-600 mb-8">
            To use the advanced AI features of the Fraud Intelligence system, please select your Gemini API key.
            <br/><br/>
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline text-sm">
              Learn more about billing and API keys
            </a>
          </p>
          <button
            onClick={handleSelectKey}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors shadow-sm flex items-center justify-center space-x-2"
          >
            <Key className="w-5 h-5" />
            <span>Select API Key</span>
          </button>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: 'detector', label: 'Real-Time Claim Submission', icon: <ShieldAlert className="w-5 h-5" /> },
    { id: 'dashboard', label: 'Fraud Analytics', icon: <Activity className="w-5 h-5" /> },
    { id: 'network', label: 'Fraud Network Graph', icon: <Network className="w-5 h-5" /> },
    { id: 'ranking', label: 'Hospital Risk Ranking', icon: <Building2 className="w-5 h-5" /> },
    { id: 'architecture', label: 'System Architecture', icon: <Server className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      {/* Sidebar */}
      <aside className={cn(
        "bg-white border-r border-slate-200 w-64 flex-shrink-0 transition-all duration-300 ease-in-out flex flex-col",
        !isSidebarOpen && "-ml-64"
      )}>
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <ShieldAlert className="w-8 h-8 text-indigo-600 mr-3" />
          <span className="font-bold text-lg text-slate-900 leading-tight">Fraud<br/>Intelligence</span>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                activeTab === item.id 
                  ? "bg-indigo-50 text-indigo-700" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100/50">
            <div className="flex items-center space-x-2 text-indigo-700 mb-2">
              <FileCode2 className="w-5 h-5" />
              <span className="font-semibold text-sm">Python Backend</span>
            </div>
            <p className="text-xs text-slate-600 mb-3">
              The complete FastAPI, NetworkX, and ML codebase is available in the <code className="bg-white text-indigo-600 px-1 py-0.5 rounded font-mono border border-indigo-100">python-backend</code> folder.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 sm:px-6 lg:px-8 flex-shrink-0">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="ml-4 flex-1">
            <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider font-mono">
              {navItems.find(i => i.id === activeTab)?.label}
            </h2>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
              <span className="text-sm font-medium text-slate-600">System Active</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-sm">
              AI
            </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'detector' && <ClaimDetector />}
            {activeTab === 'network' && <NetworkGraph />}
            {activeTab === 'ranking' && <HospitalRanking />}
            {activeTab === 'architecture' && <Architecture />}
          </div>
        </div>
      </main>
    </div>
  );
}
