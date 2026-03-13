import React, { useState, useRef } from 'react';
import { mockShapData } from '../data/mockData';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { AlertCircle, CheckCircle2, UploadCloud, FileText, Sparkles, AlertTriangle } from 'lucide-react';

export default function ClaimDetector() {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) {
      setError("Please upload a medical bill image first.");
      return;
    }

    setAnalyzing(true);
    setError(null);
    
    try {
      // Extract base64 data and mime type
      const base64Data = selectedImage.split(',')[1];
      const mimeType = selectedImage.split(';')[0].split(':')[1];

      const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
      
      const response = await fetch('/api/claims/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey || ''
        },
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType: mimeType
        })
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}...`);
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to analyze claim");
      }

      const jsonResponse = await response.json();
      
      setResult({
        probability: jsonResponse.fraudScore / 100,
        isFraud: jsonResponse.fraudScore > 70,
        riskLevel: jsonResponse.riskLevel,
        reasons: jsonResponse.reasons,
        extractedData: jsonResponse.extractedData,
        networkAnalysis: jsonResponse.networkAnalysis
      });

    } catch (err: any) {
      console.error("Analysis Error:", err);
      setError(err.message || "An error occurred during analysis.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Real-Time Claim Submission</h1>
          <p className="text-slate-500 mt-2">Upload hospital bills for instant OCR extraction, cross-verification, and fraud scoring.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Upload & Extracted Data */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-4 mb-4 flex items-center">
              <UploadCloud className="w-5 h-5 mr-2 text-indigo-500" />
              Upload Medical Bill
            </h3>
            
            <div 
              className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                accept="image/*" 
                className="hidden" 
              />
              {selectedImage ? (
                <div className="relative h-48 w-full">
                  <img src={selectedImage} alt="Uploaded Bill" className="h-full w-full object-contain rounded-lg" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                    <span className="text-white font-medium">Click to change image</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48">
                  <FileText className="w-12 h-12 text-slate-400 mb-3" />
                  <p className="text-slate-600 font-medium">Click to upload bill image</p>
                  <p className="text-slate-400 text-sm mt-1">PNG, JPG up to 10MB</p>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm flex items-start">
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button 
              onClick={handleAnalyze}
              disabled={analyzing || !selectedImage}
              className="w-full mt-6 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors disabled:opacity-70 flex justify-center items-center shadow-sm"
            >
              {analyzing ? (
                <span className="flex items-center space-x-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  <span>Running OCR & ML Models...</span>
                </span>
              ) : (
                <span className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5" />
                  <span>Analyze Claim</span>
                </span>
              )}
            </button>
          </div>

          {result && result.extractedData && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-4 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-emerald-500" />
                Extracted Data (OCR)
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500 mb-1">Hospital Name</p>
                  <p className="font-medium text-slate-900">{result.extractedData.hospitalName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-1">Patient ID</p>
                  <p className="font-medium text-slate-900 font-mono">{result.extractedData.patientId || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-slate-500 mb-1">Diagnosis</p>
                  <p className="font-medium text-slate-900">{result.extractedData.diagnosis || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-1">Total Amount</p>
                  <p className="font-medium text-slate-900 text-lg">${result.extractedData.totalAmount?.toLocaleString() || '0.00'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-slate-500 mb-1">Medicines/Procedures</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {result.extractedData.medicines?.map((med: string, i: number) => (
                      <span key={i} className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-xs border border-slate-200">
                        {med}
                      </span>
                    )) || <span className="text-slate-400 italic">None detected</span>}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Explainable AI Dashboard */}
        <div className="space-y-6">
          {result ? (
            <>
              <div className={`p-6 rounded-xl border animate-in fade-in slide-in-from-right-4 duration-500 ${
                result.riskLevel === 'High Risk' ? 'bg-rose-50 border-rose-200' : 
                result.riskLevel === 'Medium Risk' ? 'bg-amber-50 border-amber-200' : 
                'bg-emerald-50 border-emerald-200'
              }`}>
                <div className="flex items-start space-x-4">
                  {result.riskLevel === 'High Risk' ? <AlertCircle className="w-10 h-10 text-rose-600 mt-1" /> : 
                   result.riskLevel === 'Medium Risk' ? <AlertTriangle className="w-10 h-10 text-amber-600 mt-1" /> :
                   <CheckCircle2 className="w-10 h-10 text-emerald-600 mt-1" />}
                  <div>
                    <h3 className={`text-xl font-bold ${
                      result.riskLevel === 'High Risk' ? 'text-rose-900' : 
                      result.riskLevel === 'Medium Risk' ? 'text-amber-900' : 
                      'text-emerald-900'
                    }`}>
                      {result.riskLevel} Detected
                    </h3>
                    <div className="flex items-baseline space-x-2 mt-1">
                      <p className={`text-4xl font-black font-mono ${
                        result.riskLevel === 'High Risk' ? 'text-rose-600' : 
                        result.riskLevel === 'Medium Risk' ? 'text-amber-600' : 
                        'text-emerald-600'
                      }`}>
                        {(result.probability * 100).toFixed(1)}%
                      </p>
                      <span className={`text-sm font-medium ${
                        result.riskLevel === 'High Risk' ? 'text-rose-700/70' : 
                        result.riskLevel === 'Medium Risk' ? 'text-amber-700/70' : 
                        'text-emerald-700/70'
                      }`}>Fraud Probability Score</span>
                    </div>
                  </div>
                </div>
                
                {result.reasons && result.reasons.length > 0 && (
                  <div className={`mt-6 pt-6 border-t ${
                    result.riskLevel === 'High Risk' ? 'border-rose-200/50' : 
                    result.riskLevel === 'Medium Risk' ? 'border-amber-200/50' : 
                    'border-emerald-200/50'
                  }`}>
                    <h4 className={`font-semibold mb-3 ${
                      result.riskLevel === 'High Risk' ? 'text-rose-900' : 
                      result.riskLevel === 'Medium Risk' ? 'text-amber-900' : 
                      'text-emerald-900'
                    }`}>Explainable AI Reasoning:</h4>
                    <ul className="space-y-3">
                      {result.reasons.map((r: string, i: number) => (
                        <li key={i} className={`flex items-start space-x-3 text-sm ${
                          result.riskLevel === 'High Risk' ? 'text-rose-800' : 
                          result.riskLevel === 'Medium Risk' ? 'text-amber-800' : 
                          'text-emerald-800'
                        }`}>
                          <span className={`flex-shrink-0 mt-0.5 ${
                            result.riskLevel === 'High Risk' ? 'text-rose-500' : 
                            result.riskLevel === 'Medium Risk' ? 'text-amber-500' : 
                            'text-emerald-500'
                          }`}>
                            {result.riskLevel === 'High Risk' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                          </span>
                          <span className="leading-relaxed">{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Anomaly Feature Importance</h3>
                <p className="text-sm text-slate-500 mb-6">Isolation Forest / Autoencoder feature contributions to the final score.</p>
                
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mockShapData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="feature" type="category" width={150} tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a', borderRadius: '8px' }} />
                      <Bar dataKey="contribution" radius={[0, 4, 4, 0]}>
                        {mockShapData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={
                            result.riskLevel === 'High Risk' ? '#f43f5e' : 
                            result.riskLevel === 'Medium Risk' ? '#f59e0b' : 
                            '#10b981'
                          } />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-200 mb-4">
                <Sparkles className="w-8 h-8 text-indigo-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900">Explainable AI Dashboard</h3>
              <p className="text-slate-500 mt-2 max-w-sm">Upload a medical bill and click analyze. The AI will extract data, run anomaly detection, and explain the fraud risk score here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
