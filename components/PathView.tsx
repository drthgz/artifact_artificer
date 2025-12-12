import React, { useState, useEffect, useRef } from 'react';
import { LearningPath, Step } from '../types';
import { reviewSubmission } from '../services/geminiService';

interface PathViewProps {
  path: LearningPath;
  onBack: () => void;
  onCompleteStep: (stepId: string) => void;
}

// Simple particle system for confetti
class Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    size: number;
    life: number;
    
    constructor(x: number, y: number, color: string) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = (Math.random() - 1) * 10 - 5;
        this.color = color;
        this.size = Math.random() * 8 + 4;
        this.life = 100;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.5; // Gravity
        this.life--;
    }
    
    draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.life / 100;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

const PathView: React.FC<PathViewProps> = ({ path, onBack, onCompleteStep }) => {
  const [selectedStep, setSelectedStep] = useState<Step | null>(
    path.steps.find(s => s.status === 'active') || path.steps[0]
  );
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState<{passed: boolean, text: string} | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showHint, setShowHint] = useState(false); // State for hint toggle
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Sync selected step if path updates
  useEffect(() => {
     if (selectedStep) {
         const updatedStep = path.steps.find(s => s.id === selectedStep.id);
         if (updatedStep) setSelectedStep(updatedStep);
         setShowHint(false); // Reset hint visibility on step change
     }
  }, [path, selectedStep?.id]);

  // Audio effect
  const playCelebrationSound = () => {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const t = ctx.currentTime;
    
    // Victory fanfare (C Major arpeggio)
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; 
    
    notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'triangle';
        osc.frequency.value = freq;
        
        const startTime = t + i * 0.1;
        osc.start(startTime);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.1, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);
        osc.stop(startTime + 0.4);
    });
  };

  useEffect(() => {
    if (showConfetti && canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;
        
        let particles: Particle[] = [];
        const colors = ['#20BEFF', '#a855f7', '#FACC15', '#10b981', '#ef4444'];
        
        // Spawn particles
        for (let i = 0; i < 100; i++) {
            particles.push(new Particle(
                window.innerWidth / 2, 
                window.innerHeight / 2, 
                colors[Math.floor(Math.random() * colors.length)]
            ));
        }
        
        const animate = () => {
            if (!ctx) return;
            ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
            
            particles.forEach((p, i) => {
                p.update();
                p.draw(ctx);
                if (p.life <= 0) particles.splice(i, 1);
            });
            
            if (particles.length > 0) {
                requestAnimationFrame(animate);
            } else {
                setShowConfetti(false);
            }
        };
        
        animate();
    }
  }, [showConfetti]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !selectedStep) return;
    
    setUploading(true);
    setFeedback(null);
    const file = e.target.files[0];

    try {
        const result = await reviewSubmission(file, selectedStep.description, selectedStep.criteria);
        setFeedback({ passed: result.passed, text: result.feedback });
        
        if (result.passed) {
             playCelebrationSound();
             setShowConfetti(true);
        }
    } catch (err) {
        setFeedback({ passed: false, text: "Error submitting file. Please try again." });
    } finally {
        setUploading(false);
    }
  };

  const handleAdvance = () => {
      if (!selectedStep) return;
      onCompleteStep(selectedStep.id);
      
      // Find next step index
      const idx = path.steps.findIndex(s => s.id === selectedStep.id);
      if (idx !== -1 && idx < path.steps.length - 1) {
          const nextStep = path.steps[idx + 1];
          setSelectedStep(nextStep);
          setFeedback(null); 
      } else {
          setFeedback(null); 
      }
  };

  return (
    <div className="h-screen flex flex-col md:flex-row bg-surface dark:bg-dark-background relative overflow-hidden">
      {/* Confetti Canvas */}
      <canvas 
        ref={canvasRef} 
        width={window.innerWidth} 
        height={window.innerHeight} 
        className={`absolute inset-0 pointer-events-none z-50 ${showConfetti ? 'block' : 'hidden'}`}
      />

      {/* Sidebar List (Flowchart Style) */}
      <div className="w-full md:w-80 border-r border-gray-200 dark:border-white/10 bg-white dark:bg-dark-surface overflow-y-auto flex flex-col z-10 transition-colors">
        <div className="p-4 border-b border-gray-200 dark:border-white/10 flex items-center gap-2 bg-gray-50 dark:bg-dark-surfaceHighlight sticky top-0 z-20">
            <button onClick={onBack} className="p-2 hover:bg-gray-200 dark:hover:bg-white/5 rounded-lg text-gray-500 dark:text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </button>
            <h2 className="font-bold text-gray-900 dark:text-white truncate text-sm">{path.title}</h2>
        </div>
        
        <div className="flex-1 p-6 relative">
            {/* Vertical Connector Line */}
            <div className="absolute left-[38px] top-6 bottom-6 w-0.5 bg-gray-200 dark:bg-white/10"></div>

            <div className="space-y-8">
                {path.steps.map((step, idx) => {
                    const isActive = step.id === selectedStep?.id;
                    const isCompleted = step.status === 'completed';
                    const isLocked = step.status === 'locked';

                    return (
                        <button
                        key={step.id}
                        onClick={() => !isLocked && setSelectedStep(step)}
                        disabled={isLocked}
                        className={`relative w-full text-left flex gap-4 group ${isLocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                        >
                            {/* Node Icon */}
                            <div className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                                isActive 
                                    ? 'bg-primary border-primary shadow-[0_0_15px_rgba(32,190,255,0.6)] scale-110' 
                                    : isCompleted 
                                        ? 'bg-green-500 border-green-500' 
                                        : 'bg-white dark:bg-dark-surface border-gray-300 dark:border-gray-600 group-hover:border-primary'
                            }`}>
                                {isCompleted ? (
                                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                ) : (
                                    <span className={`text-xs font-mono font-bold ${isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>{idx + 1}</span>
                                )}
                            </div>

                            {/* Content */}
                            <div className={`flex-1 pt-1 transition-all ${isActive ? 'translate-x-1' : ''}`}>
                                <h3 className={`font-semibold text-sm ${isActive ? 'text-primary' : 'text-gray-600 dark:text-gray-400 group-hover:text-primary'}`}>
                                    {step.title}
                                </h3>
                                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-mono">
                                    {isCompleted ? 'COMPLETED' : isActive ? 'IN PROGRESS' : 'LOCKED'}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8 relative bg-white dark:bg-dark-background text-gray-900 dark:text-gray-200 transition-colors">
        {selectedStep && (
          <div className="max-w-3xl mx-auto space-y-8 pb-20">
            <div className="space-y-4">
                <div className="inline-block px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-mono text-primary font-bold">
                    MODULE {path.steps.findIndex(s => s.id === selectedStep.id) + 1}
                </div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{selectedStep.title}</h1>
                <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">{selectedStep.description}</p>
            </div>

            {/* Hint / Step Breakdown Section */}
            {selectedStep.detailedSteps && selectedStep.detailedSteps.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-2xl overflow-hidden transition-all">
                    <button 
                        onClick={() => setShowHint(!showHint)}
                        className="w-full flex justify-between items-center p-4 bg-blue-100/50 dark:bg-blue-800/20 text-blue-700 dark:text-blue-300 font-bold hover:bg-blue-200/50 dark:hover:bg-blue-800/30 transition-colors"
                    >
                        <span className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                            Stuck? Reveal Step-by-Step Guide
                        </span>
                        <svg className={`w-5 h-5 transition-transform ${showHint ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    
                    {showHint && (
                        <div className="p-6 bg-white dark:bg-dark-surface/50">
                            <ol className="list-decimal pl-5 space-y-3 text-gray-700 dark:text-gray-300">
                                {selectedStep.detailedSteps.map((step, idx) => (
                                    <li key={idx} className="pl-2">
                                        {step}
                                    </li>
                                ))}
                            </ol>
                        </div>
                    )}
                </div>
            )}

            <div className="bg-gray-50 dark:bg-dark-surface rounded-2xl border border-gray-100 dark:border-white/5 p-6 shadow-sm">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Success Criteria</h3>
                <ul className="space-y-3">
                    {selectedStep.criteria.map((c, i) => (
                        <li key={i} className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></div>
                            <span>{c}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Submission Area */}
            <div className="bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-200 dark:border-white/10 p-8 text-center transition-all">
                {selectedStep.status === 'completed' && !feedback ? (
                     // State: Completed before this session
                    <div className="text-green-500 flex flex-col items-center gap-2">
                        <svg className="w-16 h-16 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span className="text-xl font-bold">Module Completed</span>
                    </div>
                ) : feedback && feedback.passed ? (
                    // State: Just passed
                    <div className="space-y-6 animate-fade-in">
                        <div className="p-6 rounded-xl bg-green-500/10 border border-green-500/30 text-left">
                            <h4 className="font-bold text-green-600 dark:text-green-400 text-lg mb-2 flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                Excellent Work!
                            </h4>
                            <p className="text-gray-700 dark:text-gray-300">{feedback.text}</p>
                        </div>
                        
                        <button 
                            onClick={handleAdvance}
                            className="bg-green-600 hover:bg-green-500 text-white font-bold py-4 px-8 rounded-xl shadow-lg shadow-green-900/20 transform hover:scale-105 transition-all flex items-center justify-center gap-2 mx-auto"
                        >
                            Continue to Next Module
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                        </button>
                    </div>
                ) : (
                    // State: Needs submission or failed
                    <>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Ready to Submit?</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">Upload a screenshot or render of your work. The AI will review it against the criteria above.</p>
                        
                        <div className="flex justify-center">
                             <label className={`cursor-pointer bg-primary hover:bg-primaryDark text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center gap-2 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                {uploading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        Analyzing Work...
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                                        Upload Image
                                    </>
                                )}
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
                             </label>
                        </div>

                        {feedback && !feedback.passed && (
                            <div className="mt-6 p-4 rounded-xl text-left bg-red-500/10 border border-red-500/30">
                                <h4 className="font-bold text-red-500 mb-1 flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                    Revision Needed
                                </h4>
                                <p className="text-gray-600 dark:text-gray-300 text-sm whitespace-pre-wrap">{feedback.text}</p>
                            </div>
                        )}
                    </>
                )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PathView;