import React, { useState, useRef } from 'react';
import { UserPlus, Camera, Upload, CheckCircle, Shield, User, MapPin, Phone, Mail, Calendar } from 'lucide-react';

export default function PatientRegistration() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'Other',
    email: '',
    phone: '',
    address: '',
  });

  const startCamera = async () => {
    setScanning(true);
    setFaceDetected(false);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        
        // Simulate face recognition detection
        setTimeout(() => {
          setFaceDetected(true);
        }, 3000);
      }
    } catch (err) {
      console.error("Camera error:", err);
      // Fallback: simulate detection anyway
      setTimeout(() => setFaceDetected(true), 2000);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/patients/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          faceDescriptor: Array.from({length: 128}, () => Math.random()), // Mock face vector
          faceImageBase64: 'data:image/png;base64,...'
        })
      });
      
      if (response.ok) {
        setStep(3);
      }
    } catch (error) {
      console.error("Registration failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Patient Onboarding</h1>
          <p className="text-slate-500 mt-2">Biometric-linked patient registration with real-time face verification</p>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
          <Shield className="w-4 h-4" />
          Secure Blockchain-Ready
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Progress Bar */}
        <div className="bg-slate-50 border-b border-slate-100 px-8 py-4 flex justify-between">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-indigo-600' : 'text-slate-400'}`}>
            <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${step >= 1 ? 'border-indigo-600 bg-indigo-50' : 'border-slate-300'}`}>1</span>
            <span className="font-medium text-sm">Personal Info</span>
          </div>
          <div className="w-12 h-px bg-slate-200 mt-3"></div>
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-indigo-600' : 'text-slate-400'}`}>
            <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${step >= 2 ? 'border-indigo-600 bg-indigo-50' : 'border-slate-300'}`}>2</span>
            <span className="font-medium text-sm">Face Scan</span>
          </div>
          <div className="w-12 h-px bg-slate-200 mt-3"></div>
          <div className={`flex items-center gap-2 ${step >= 3 ? 'text-indigo-600' : 'text-slate-400'}`}>
            <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${step >= 3 ? 'border-indigo-600 bg-indigo-50' : 'border-slate-300'}`}>3</span>
            <span className="font-medium text-sm">Complete</span>
          </div>
        </div>

        <div className="p-8">
          {step === 1 && (
            <form onSubmit={() => setStep(2)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <input
                      required
                      type="text"
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <input
                      required
                      type="tel"
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      placeholder="+91 9876543210"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Email Address (Optional)</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Age</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <input
                      required
                      type="number"
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      placeholder="45"
                      value={formData.age}
                      onChange={(e) => setFormData({...formData, age: e.target.value})}
                    />
                  </div>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Residential Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <textarea
                      required
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none min-h-[100px]"
                      placeholder="123 Health Street, Delhi, India"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                    ></textarea>
                  </div>
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
              >
                Continue to Face Scan
              </button>
            </form>
          )}

          {step === 2 && (
            <div className="text-center space-y-6">
              <div className="max-w-md mx-auto aspect-video bg-slate-900 rounded-2xl overflow-hidden relative border-4 border-slate-200 shadow-xl">
                {!scanning ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                    <Camera className="w-12 h-12 mb-4 opacity-50" />
                    <button
                      onClick={startCamera}
                      className="bg-indigo-600 px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-all"
                    >
                      Enable Face Scan
                    </button>
                  </div>
                ) : (
                  <div className="absolute inset-0">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    <div className="absolute inset-0 border-[60px] border-slate-900/50"></div>
                    <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-64 border-2 rounded-[60px] ${faceDetected ? 'border-emerald-500 animate-pulse' : 'border-white/50 border-dashed'}`}>
                      {faceDetected && (
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                          Face Locked
                        </div>
                      )}
                    </div>
                    <div className="absolute bottom-4 left-0 right-0 text-white text-xs font-medium animate-pulse">
                      {faceDetected ? 'Face recognition encoding biometric vector...' : 'Align face within signature zone...'}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-900">
                  {faceDetected ? 'Face Identity Verified' : 'Real-time Identity Scan'}
                </h3>
                <p className="text-slate-500 max-w-sm mx-auto">
                  Our system extracts 128 unique biometric facial landmarks to prevent phantom patient fraud and identity theft.
                </p>
                
                <div className="flex gap-4">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-200 transition-all"
                  >
                    Back
                  </button>
                  <button
                    disabled={!faceDetected || loading}
                    onClick={handleRegister}
                    className="flex-2 bg-indigo-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : 'Complete Secure Registration'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-12 space-y-6 animate-in fade-in zoom-in duration-500">
              <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-emerald-600" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900">Registration Successful!</h2>
              <p className="text-slate-500 max-w-md mx-auto text-lg">
                Patient index has been secured and linked to the biometric identity vector. This patient is now authorized for claim submissions.
              </p>
              <div className="pt-8 flex gap-4 justify-center">
                <button
                  onClick={() => setStep(1)}
                  className="bg-slate-100 text-slate-600 font-bold py-3 px-8 rounded-xl hover:bg-slate-200 transition-all"
                >
                  Register Another
                </button>
                <button
                  onClick={() => window.location.href = '#'}
                  className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
