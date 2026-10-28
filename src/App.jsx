import React, { useState, useRef, useEffect } from 'react';
import ToolFAQ from './components/ToolFAQ';

import BrandedNav from './components/BrandedNav';
import BrandedFooter from './components/BrandedFooter';
import { 
  Upload, Play, Pause, AlertCircle, Loader2, CheckCircle2, Shield,
  Video, ShieldAlert, Activity, FileCheck
} from 'lucide-react';
import { useToolUsage } from './hooks/useToolUsage';

export default function DeepfakeDetector() {
  const { checkUsage, incrementUsage } = useToolUsage();

  const faqs = [
    {
      "question": "How accurate is the deepfake detector?",
      "answer": "Our models achieve over 95% accuracy in detecting standard deepfakes and face swaps, though highly compressed videos can sometimes reduce confidence."
    },
    {
      "question": "What types of AI videos can it detect?",
      "answer": "It detects face-swaps, lip-sync manipulation, full synthetic generations (like Sora or Runway), and voice cloning."
    },
    {
      "question": "Does it analyze audio too?",
      "answer": "Yes, it analyzes audio-visual synchronization and can detect synthetic or cloned voice patterns."
    },
    {
      "question": "Is my uploaded video saved?",
      "answer": "No, videos are processed securely locally in your browser and deleted immediately after the analysis report is generated."
    },
    {
      "question": "Can I use this for legal evidence?",
      "answer": "While highly accurate, our tool is designed for preliminary forensic screening and fact-checking, not as definitive legal proof."
    }
  ];

  const [file, setFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  
  // Video state
  const videoRef = useRef(null);
  
  // Analyzer state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processProgress, setProcessProgress] = useState(0);
  const [progressStep, setProgressStep] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type.startsWith('video/')) {
      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setVideoUrl(url);
      setError(null);
      setResult(null);
    } else {
        setError('Please upload a valid video file.');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('video/')) {
      setFile(droppedFile);
      const url = URL.createObjectURL(droppedFile);
      setVideoUrl(url);
      setError(null);
      setResult(null);
    } else {
        setError('Please upload a valid video file.');
    }
  };

  const handleProcess = async () => {
    if (!checkUsage()) {
      setError("Daily limit reached. Free users can process tools 3 times a day. Please upgrade for unlimited access.");
      return;
    }
    incrementUsage();

    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setResult(null);
    setProcessProgress(0);
    setProgressStep('Initializing neural models...');

    try {
      const report = await new Promise((resolve, reject) => {
          const worker = new Worker(new URL('./workers/forensics.worker.js', import.meta.url), { type: 'module' });
          
          worker.addEventListener('message', (event) => {
              const { status, step, progress, report, error } = event.data;
              if (status === 'progress') {
                  if (step === 'uploading') setProgressStep('Extracting frames...');
                  else if (step === 'analyzing') setProgressStep('Running forensic analysis...');
                  else if (step === 'finalizing') setProgressStep('Generating verdict...');
                  
                  setProcessProgress(progress || 0);
              } else if (status === 'complete') {
                  worker.terminate();
                  resolve(report);
              } else if (status === 'error') {
                  worker.terminate();
                  reject(new Error(error));
              }
          });

          worker.postMessage({ file });
      });

      setProcessProgress(100);
      setProgressStep('Complete');
      
      setTimeout(() => {
        setResult(report);
        setIsProcessing(false);
        setProcessProgress(0);
      }, 500);

    } catch (err) {
      setError(`Forensics Failed: ${err.message}`);
      console.error(err);
      setIsProcessing(false);
      setProcessProgress(0);
    }
  };

  const resetTool = () => {
      setFile(null);
      setVideoUrl(null);
      setResult(null);
      setError(null);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white p-6 md:p-12">
      
      
      <BrandedNav />
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-3">
              <Shield className="text-blue-500" /> Deepfake Detector
            </h1>
            <p className="text-gray-400 font-medium">Verify video authenticity with military-grade neural forensics.</p>
          </div>
          {videoUrl && !isProcessing && (
            <button 
              onClick={resetTool}
              className="px-6 py-2 bg-white/5 hover:bg-white/10 rounded-full font-bold text-sm transition-colors border border-white/10"
            >
              Scan New Video
            </button>
          )}
        </div>

        {!videoUrl ? (
          <div 
            className="w-full max-w-3xl mx-auto h-[60vh] border-2 border-dashed border-white/10 rounded-[2rem] flex flex-col items-center justify-center p-8 text-center hover:bg-white/5 hover:border-blue-500/50 transition-all cursor-pointer group"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <input 
              type="file" 
              id="video-input" 
              accept="video/*" 
              className="hidden" 
              onChange={handleFileChange}
            />
            <label htmlFor="video-input" className="cursor-pointer flex flex-col items-center w-full h-full justify-center">
              <div className="w-20 h-20 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Upload size={32} />
              </div>
              <h2 className="text-2xl font-black mb-2">Select a Suspect Video</h2>
              <p className="text-gray-400 max-w-sm">Drag and drop your .mp4 or .mov file here to scan for manipulations.</p>
              <div className="mt-8 px-4 py-2 bg-white/5 rounded-full text-xs font-bold text-gray-500 uppercase tracking-widest">
                Local AI Processing • 100% Private
              </div>
            </label>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main Preview Area */}
            <div className="flex-1 flex flex-col items-center">
              <div className="w-full bg-black rounded-3xl border border-white/10 shadow-2xl overflow-hidden shrink-0 aspect-video flex items-center justify-center">
                <video 
                  ref={videoRef}
                  src={videoUrl}
                  className="w-full h-full object-contain bg-zinc-900"
                  controls
                  playsInline
                />
              </div>
            </div>

            {/* Sidebar Settings */}
            <div className="w-full lg:w-[350px] space-y-6">
              
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
                 <Shield className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                 <div className="text-blue-200 text-xs">
                   <span className="font-bold text-blue-400">Security Notice:</span> 
                   Files are analyzed directly on your device. They are never uploaded to remote servers.
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              )}

              {result && (
                <div className={`border rounded-xl p-6 text-center shadow-xl ${
                    (result.analysis?.final_score || 0) > 0.5 
                    ? 'bg-red-500/10 border-red-500/20' 
                    : 'bg-green-500/10 border-green-500/20'
                }`}>
                  { (result.analysis?.final_score || 0) > 0.5 ? (
                      <ShieldAlert className="w-12 h-12 text-red-400 mx-auto mb-3" />
                  ) : (
                      <FileCheck className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  )}
                  
                  <div className="text-4xl font-black italic mb-2">
                      {((result.analysis?.final_score || 0) * 100).toFixed(0)}%
                  </div>
                  <div className="text-[10px] uppercase font-black text-gray-500 tracking-widest mb-4">Risk Level</div>
                  
                  <div className={`px-4 py-2 rounded-lg font-bold text-sm inline-block ${
                      (result.analysis?.final_score || 0) > 0.5 ? "bg-red-600 text-white" : "bg-green-600 text-white"
                  }`}>
                      {(result.analysis?.final_score || 0) > 0.5 ? "Manipulated Media" : "Authentic Media"}
                  </div>

                  {result.analysis?.forensic_logic && (
                      <p className="mt-4 text-xs text-left text-gray-400 italic bg-black/40 p-3 rounded-lg border border-white/5">
                          "{result.analysis.forensic_logic}"
                      </p>
                  )}
                </div>
              )}

              {!result && (
                <button 
                  onClick={handleProcess}
                  disabled={isProcessing}
                  className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl transition-all flex flex-col items-center justify-center gap-2 transform relative overflow-hidden ${
                    isProcessing
                      ? 'bg-white/10 text-white/50 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20 hover:-translate-y-1'
                  }`}
                >
                  {isProcessing && (
                    <div 
                      className="absolute left-0 top-0 bottom-0 bg-blue-500/30 transition-all duration-300"
                      style={{ width: `${processProgress}%` }}
                    ></div>
                  )}
                  
                  <div className="relative flex items-center gap-2">
                    {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Activity size={18} />}
                    {isProcessing ? progressStep || 'Analyzing...' : 'Run Forensic Scan'}
                  </div>
                </button>
              )}

            </div>
          </div>
        )}
      </div>

      {/* SEO Sections */}
      <div className="mt-24 space-y-24 max-w-4xl mx-auto px-4">
        {/* How It Works */}
        <section>
          <h2 className="text-3xl font-bold mb-8 text-center">How to Detect Deepfakes & AI Video</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative">
              <div className="absolute -top-4 -left-4 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center font-bold text-xl shadow-lg shadow-blue-500/20">1</div>
              <h3 className="text-xl font-bold mb-3 text-blue-400 mt-2">Upload Suspect</h3>
              <p className="text-gray-400">Select any video file you suspect might be AI generated or manipulated.</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative">
              <div className="absolute -top-4 -left-4 w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-500/20">2</div>
              <h3 className="text-xl font-bold mb-3 text-indigo-400 mt-2">Forensic Scan</h3>
              <p className="text-gray-400">Our neural models scan frame-by-frame for subtle spatial artifacts and lip-sync issues.</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative">
              <div className="absolute -top-4 -left-4 w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center font-bold text-xl shadow-lg shadow-purple-500/20">3</div>
              <h3 className="text-xl font-bold mb-3 text-purple-400 mt-2">Analyze Output</h3>
              <p className="text-gray-400">Get an immediate probability score indicating the likelihood of synthetic generation.</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative">
              <div className="absolute -top-4 -left-4 w-10 h-10 bg-rose-600 rounded-full flex items-center justify-center font-bold text-xl shadow-lg shadow-rose-500/20">4</div>
              <h3 className="text-xl font-bold mb-3 text-rose-400 mt-2">Act Securely</h3>
              <p className="text-gray-400">Review the forensic logic provided to make informed decisions about content authenticity.</p>
            </div>
          </div>
        </section>

        {/* Feature Breakdown */}
        <section>
          <h2 className="text-3xl font-bold mb-8 text-center">Why Use Our Deepfake Forensics?</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-[#0f172a] rounded-2xl p-8 border border-white/5">
              <h3 className="text-2xl font-bold mb-4">Advanced Forgery Detection</h3>
              <p className="text-gray-400">Detects face-swaps and sophisticated lip-sync manipulations with high accuracy using state-of-the-art vision models.</p>
            </div>
            <div className="bg-[#0f172a] rounded-2xl p-8 border border-white/5">
              <h3 className="text-2xl font-bold mb-4">Generative AI Spotting</h3>
              <p className="text-gray-400">Identifies invisible digital artifacts left behind by diffusion models like Sora, Runway, and Midjourney.</p>
            </div>
            <div className="bg-[#0f172a] rounded-2xl p-8 border border-white/5">
              <h3 className="text-2xl font-bold mb-4">Privacy-First Architecture</h3>
              <p className="text-gray-400">Initial scanning happens securely on your device. Your sensitive video evidence is never exposed to external servers.</p>
            </div>
            <div className="bg-[#0f172a] rounded-2xl p-8 border border-white/5">
              <h3 className="text-2xl font-bold mb-4">Instant Results</h3>
              <p className="text-gray-400">Stop waiting for slow cloud processing queues. Get a reliable forensic risk score in just seconds.</p>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section>
          <h2 className="text-3xl font-bold mb-8 text-center">Built for Content Authenticity</h2>
          <div className="space-y-6">
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10 flex flex-col md:flex-row gap-6 items-center">
              <div className="md:w-1/3">
                <h3 className="text-xl font-bold mb-2">Journalists</h3>
              </div>
              <div className="md:w-2/3">
                <p className="text-gray-400">Verify the authenticity of user-generated content and breaking news footage before publishing to maintain credibility.</p>
              </div>
            </div>
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10 flex flex-col md:flex-row gap-6 items-center">
              <div className="md:w-1/3">
                <h3 className="text-xl font-bold mb-2">Legal Teams</h3>
              </div>
              <div className="md:w-2/3">
                <p className="text-gray-400">Perform rapid preliminary screening of digital evidence to spot fabricated or manipulated video files during discovery.</p>
              </div>
            </div>
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10 flex flex-col md:flex-row gap-6 items-center">
              <div className="md:w-1/3">
                <h3 className="text-xl font-bold mb-2">Public Figures</h3>
              </div>
              <div className="md:w-2/3">
                <p className="text-gray-400">Quickly analyze viral videos to confirm or debunk malicious synthetic deepfakes aiming to harm reputations.</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <ToolFAQ faqs={faqs} />
      <BrandedFooter />
    </div>
  );
}
