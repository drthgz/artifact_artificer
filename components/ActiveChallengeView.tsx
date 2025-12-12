import React, { useState, useEffect } from 'react';
import { Challenge } from '../types';
import { generateHint, evaluateChallengeSubmission } from '../services/geminiService';

interface ActiveChallengeViewProps {
  challenge: Challenge;
  userTool: string;
  onFinish: (score: number) => void;
  onCancel: () => void;
}

const ActiveChallengeView: React.FC<ActiveChallengeViewProps> = ({ challenge, userTool, onFinish, onCancel }) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [penaltySeconds, setPenaltySeconds] = useState(0);
  const [hints, setHints] = useState<string[]>([]);
  const [loadingHint, setLoadingHint] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{passed: boolean, score: number, feedback: string} | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const totalSeconds = elapsedSeconds + penaltySeconds;

  // Format seconds into MM:SS
  const formatTime = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleRequestHint = async () => {
    if (loadingHint) return;
    setLoadingHint(true);
    setPenaltySeconds(prev => prev + 120);
    
    try {
        const hint = await generateHint(userTool, challenge);
        setHints(prev => [...prev, hint]);
    } catch (e) {
        setHints(prev => [...prev, "Focus on the main silhouette first."]);
    } finally {
        setLoadingHint(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || !e.target.files[0] || !challenge.referenceImageUrl) return;
      
      setUploading(true);
      try {
          const file = e.target.files[0];
          const result = await evaluateChallengeSubmission(challenge.referenceImageUrl, file);
          setSubmissionResult(result);
      } catch (e) {
          alert("Submission failed. Please try again.");
      } finally {
          setUploading(false);
      }
  };

  // Determine current tier
  const currentMinutes = totalSeconds / 60;
  let currentTier = 'GOLD';
  let timeToNext = challenge.goldTime * 60 - totalSeconds;
  
  if (currentMinutes > challenge.goldTime) {
      currentTier = 'SILVER';
      timeToNext = challenge.silverTime * 60 - totalSeconds;
  }
  if (currentMinutes > challenge.silverTime) {
      currentTier = 'BRONZE';
      timeToNext = challenge.bronzeTime * 60 - totalSeconds;
  }
  if (currentMinutes > challenge.bronzeTime) {
      currentTier = 'FAIL';
      timeToNext = 0;
  }

  const getTierColor = (tier: string) => {
      switch(tier) {
          case 'GOLD': return 'text-yellow-400';
          case 'SILVER': return 'text-gray-300';
          case 'BRONZE': return 'text-orange-500';
          default: return 'text-red-500';
      }
  };

  return (
    <div className="fixed inset-0 bg-background dark:bg-dark-background z-[100] flex flex-col md:flex-row">
      
      {/* Left: Reference Image */}
      <div className="w-full md:w-2/3 bg-black flex items-center justify-center relative p-8">
         <div className="absolute top-4 left-4 z-10 bg-black/50 backdrop-blur px-3 py-1 rounded text-white text-xs font-mono">
            REFERENCE
         </div>
         {challenge.referenceImageUrl ? (
            <img 
                src={challenge.referenceImageUrl} 
                alt="Reference" 
                className="max-w-full max-h-full object-contain shadow-2xl"
            />
         ) : (
            <div className="text-gray-500">No Image Available</div>
         )}
      </div>

      {/* Right: Controls & Timer */}
      <div className="w-full md:w-1/3 bg-surface dark:bg-dark-surface border-l border-white/10 flex flex-col p-8">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-12">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">{challenge.title}</h2>
                <p className="text-gray-500 text-sm mt-1">{challenge.theme}</p>
            </div>
            <button 
                onClick={onCancel}
                className="text-gray-400 hover:text-red-500 text-sm font-medium transition-colors"
            >
                Quit
            </button>
        </div>

        {/* Timer Section */}
        <div className="mb-12 text-center">
             <div className="text-sm text-gray-500 uppercase tracking-widest mb-2">Total Time (Adjusted)</div>
             <div className={`text-6xl font-mono font-bold tabular-nums tracking-tighter ${getTierColor(currentTier)}`}>
                 {formatTime(totalSeconds)}
             </div>
             {penaltySeconds > 0 && (
                 <div className="text-red-500 text-sm mt-2 font-mono">
                     + {formatTime(penaltySeconds)} Penalty
                 </div>
             )}
        </div>

        {/* Status Pills */}
        <div className="grid grid-cols-2 gap-4 mb-12">
            <div className="bg-white dark:bg-white/5 p-4 rounded-xl border border-gray-200 dark:border-white/10 text-center">
                <div className="text-xs text-gray-500 uppercase mb-1">Current Pace</div>
                <div className={`text-xl font-bold ${getTierColor(currentTier)}`}>{currentTier}</div>
            </div>
            <div className="bg-white dark:bg-white/5 p-4 rounded-xl border border-gray-200 dark:border-white/10 text-center">
                 <div className="text-xs text-gray-500 uppercase mb-1">Next Cutoff</div>
                 <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {timeToNext > 0 ? formatTime(timeToNext) : '00:00'}
                 </div>
            </div>
        </div>

        {/* Hints Section */}
        <div className="flex-1 overflow-y-auto mb-8 space-y-4">
             {hints.map((hint, idx) => (
                 <div key={idx} className="bg-blue-500/10 border-l-2 border-blue-500 p-3 rounded-r text-sm text-gray-700 dark:text-gray-300 animate-fade-in">
                     <span className="font-bold text-blue-500 block text-xs mb-1">HINT #{idx+1}</span>
                     {hint}
                 </div>
             ))}
        </div>

        {/* Actions */}
        <div className="mt-auto space-y-3">
             <button 
                onClick={handleRequestHint}
                disabled={loadingHint}
                className="w-full py-3 rounded-xl border border-dashed border-gray-400 text-gray-500 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all flex justify-center items-center gap-2"
             >
                {loadingHint ? 'Consulting AI...' : 'Request Hint (+2:00 Penalty)'}
             </button>

             <label className={`w-full bg-primary hover:bg-primaryDark text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all flex justify-center items-center gap-2 cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                {uploading ? (
                     <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Verifying...
                    </>
                ) : "Upload & Verify Work"}
                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
             </label>
        </div>
      </div>
      
      {/* Result Modal Overlay */}
      {submissionResult && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-white dark:bg-dark-surface p-8 rounded-3xl max-w-md w-full text-center border border-gray-200 dark:border-white/10">
                  {submissionResult.passed ? (
                      <>
                        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-4xl shadow-lg shadow-green-500/40">✓</div>
                        <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Challenge Complete!</h3>
                        <p className="text-gray-500 mb-6">Match Score: <span className="text-green-500 font-bold">{submissionResult.score}%</span></p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">{submissionResult.feedback}</p>
                        <button onClick={() => onFinish(submissionResult.score * 10)} className="w-full bg-primary text-white font-bold py-3 rounded-xl">Claim Reward</button>
                      </>
                  ) : (
                      <>
                        <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-4xl shadow-lg shadow-red-500/40">✕</div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Not Quite There</h3>
                        <p className="text-gray-500 mb-6">Match Score: <span className="text-red-500 font-bold">{submissionResult.score}%</span></p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">{submissionResult.feedback}</p>
                        <div className="flex gap-4">
                            <button onClick={() => setSubmissionResult(null)} className="flex-1 border border-gray-300 dark:border-white/20 text-gray-700 dark:text-white font-bold py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5">Try Again</button>
                            <button onClick={onCancel} className="flex-1 text-red-500 font-bold py-3">Give Up</button>
                        </div>
                      </>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};

export default ActiveChallengeView;