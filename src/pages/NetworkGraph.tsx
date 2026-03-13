import React, { useEffect, useRef, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { mockNetworkData, mockHospitals, mockClaims } from '../data/mockData';
import { Network, Search, Filter, LayoutTemplate, Sparkles, X, Bot } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { GoogleGenAI } from '@google/genai';

export default function NetworkGraph() {
  const fgRef = useRef<any>();
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [layoutMode, setLayoutMode] = useState<string>('force');
  const [showAIAssist, setShowAIAssist] = useState(false);
  const [aiResponse, setAiResponse] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getNodeColor = (node: any) => {
    switch (node.group) {
      case 1: return '#3b82f6'; // Patient (Blue)
      case 2: return '#10b981'; // Doctor (Green)
      case 3: return '#ef4444'; // Hospital (Red)
      case 4: return '#f59e0b'; // Pharmacy (Yellow)
      default: return '#9ca3af';
    }
  };

  // Data for Bar Chart (Top Connected Entities)
  const barData = mockNetworkData.nodes.map(n => ({
    name: n.label.split(' ')[0] + ' ' + n.id,
    connections: mockNetworkData.links.filter(l => l.source === n.id || l.target === n.id).length
  })).sort((a, b) => b.connections - a.connections).slice(0, 5);

  // Data for Pie Chart (Entity Types)
  const pieData = [
    { name: 'Patients', value: mockNetworkData.nodes.filter(n => n.group === 1).length, color: '#3b82f6' },
    { name: 'Doctors', value: mockNetworkData.nodes.filter(n => n.group === 2).length, color: '#10b981' },
    { name: 'Hospitals', value: mockNetworkData.nodes.filter(n => n.group === 3).length, color: '#ef4444' },
    { name: 'Pharmacies', value: mockNetworkData.nodes.filter(n => n.group === 4).length, color: '#f59e0b' },
  ];

  // Data for Histogram (Hospital Risk Scores)
  const histogramData = [
    { range: '0.0 - 0.2', count: mockHospitals.filter(h => h.fraudRisk <= 0.2).length },
    { range: '0.2 - 0.4', count: mockHospitals.filter(h => h.fraudRisk > 0.2 && h.fraudRisk <= 0.4).length },
    { range: '0.4 - 0.6', count: mockHospitals.filter(h => h.fraudRisk > 0.4 && h.fraudRisk <= 0.6).length },
    { range: '0.6 - 0.8', count: mockHospitals.filter(h => h.fraudRisk > 0.6 && h.fraudRisk <= 0.8).length },
    { range: '0.8 - 1.0', count: mockHospitals.filter(h => h.fraudRisk > 0.8).length },
  ];

  const handleAIAssist = async () => {
    setShowAIAssist(true);
    setIsAnalyzing(true);
    
    try {
      const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        setAiResponse("API Key not found. Please set GEMINI_API_KEY in your environment variables to use AI Assist.");
        setIsAnalyzing(false);
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Analyze this healthcare fraud data and tell me who has done the most fraud. Be concise and point out the top suspicious entities.
      Hospitals: ${JSON.stringify(mockHospitals)}
      Network Nodes: ${JSON.stringify(mockNetworkData.nodes)}
      Network Links: ${JSON.stringify(mockNetworkData.links)}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      setAiResponse(response.text || "Analysis complete, but no response generated.");
    } catch (error) {
      console.error("AI Assist Error:", error);
      setAiResponse("An error occurred while analyzing the data. Please try again later.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderVisualization = () => {
    if (layoutMode === 'bar') {
      return (
        <div className="w-full h-full p-8 bg-white">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Top Connected Entities (Suspicious Activity)</h3>
          <ResponsiveContainer width="100%" height="80%">
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px' }} />
              <Bar dataKey="connections" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    }
    if (layoutMode === 'pie') {
      return (
        <div className="w-full h-full p-8 bg-white flex flex-col items-center">
          <h3 className="text-lg font-semibold text-slate-800 mb-6 w-full text-left">Fraud Network Entity Distribution</h3>
          <ResponsiveContainer width="100%" height="80%">
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={80} outerRadius={140} paddingAngle={5} dataKey="value">
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '8px' }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      );
    }
    if (layoutMode === 'histogram') {
      return (
        <div className="w-full h-full p-8 bg-white">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Hospital Risk Score Distribution</h3>
          <ResponsiveContainer width="100%" height="80%">
            <BarChart data={histogramData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="range" stroke="#64748b" />
              <YAxis stroke="#64748b" allowDecimals={false} />
              <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px' }} />
              <Bar dataKey="count" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    }

    // Default: Network Graph
    return (
      <>
        <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-sm border border-slate-200">
          <h4 className="font-semibold text-slate-800 mb-3 flex items-center space-x-2">
            <Network className="w-4 h-4 text-indigo-500" />
            <span>Legend</span>
          </h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center space-x-2"><span className="w-3 h-3 rounded-full bg-blue-500"></span><span className="text-slate-600">Patient</span></li>
            <li className="flex items-center space-x-2"><span className="w-3 h-3 rounded-full bg-green-500"></span><span className="text-slate-600">Doctor</span></li>
            <li className="flex items-center space-x-2"><span className="w-3 h-3 rounded-full bg-red-500"></span><span className="text-slate-600">Hospital</span></li>
            <li className="flex items-center space-x-2"><span className="w-3 h-3 rounded-full bg-yellow-500"></span><span className="text-slate-600">Pharmacy</span></li>
          </ul>
        </div>
        
        {dimensions.width > 0 && (
          <ForceGraph2D
            ref={fgRef}
            width={dimensions.width}
            height={dimensions.height}
            graphData={mockNetworkData}
            nodeLabel="label"
            nodeColor={getNodeColor}
            nodeRelSize={6}
            linkColor={() => '#cbd5e1'}
            linkWidth={link => (link as any).value || 1}
            d3VelocityDecay={0.3}
            cooldownTicks={100}
            backgroundColor="#f8fafc"
            dagMode={layoutMode === 'force' ? undefined : layoutMode as any}
            dagLevelDistance={layoutMode === 'force' ? undefined : 60}
            onEngineStop={() => fgRef.current?.zoomToFit(400, 50)}
          />
        )}
      </>
    );
  };

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col relative">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Fraud Network Detection</h1>
          <p className="text-slate-500">Visualizing suspicious clusters and highly connected entities.</p>
        </div>
        
        <div className="flex space-x-3">
          <button 
            onClick={handleAIAssist}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center space-x-2 font-medium transition-colors shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Assist</span>
          </button>
          <div className="relative flex items-center bg-white border border-slate-300 rounded-lg px-3">
            <LayoutTemplate className="w-4 h-4 text-slate-500 mr-2" />
            <select 
              value={layoutMode} 
              onChange={(e) => setLayoutMode(e.target.value)}
              className="py-2 bg-transparent text-slate-700 font-medium focus:outline-none appearance-none pr-4"
            >
              <optgroup label="Network Graphs">
                <option value="force">Force Directed</option>
                <option value="td">Hierarchical (Top-Down)</option>
                <option value="bu">Hierarchical (Bottom-Up)</option>
                <option value="radialout">Radial Outward</option>
              </optgroup>
              <optgroup label="Statistical Charts">
                <option value="bar">Bar Chart (Top Entities)</option>
                <option value="pie">Pie Chart (Entity Types)</option>
                <option value="histogram">Histogram (Risk Scores)</option>
              </optgroup>
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-slate-50 rounded-xl shadow-inner border border-slate-200 overflow-hidden relative" ref={containerRef}>
        {renderVisualization()}
      </div>

      {/* AI Assist Panel */}
      {showAIAssist && (
        <div className="absolute top-20 right-4 w-96 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50 flex flex-col max-h-[80%]">
          <div className="p-4 bg-indigo-600 flex justify-between items-center text-white">
            <div className="flex items-center space-x-2">
              <Bot className="w-5 h-5" />
              <h3 className="font-semibold">Fraud Intelligence AI</h3>
            </div>
            <button onClick={() => setShowAIAssist(false)} className="hover:bg-indigo-500 p-1 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-5 overflow-y-auto flex-1 bg-slate-50">
            {isAnalyzing ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="text-sm text-slate-500 font-medium">Analyzing network data...</p>
              </div>
            ) : (
              <div className="prose prose-sm prose-slate">
                <div className="whitespace-pre-wrap text-slate-700">{aiResponse}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
