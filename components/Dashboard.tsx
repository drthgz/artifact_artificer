import React, { useState } from 'react';
import { UserProfile, LearningPath, Challenge } from '../types';
import { generateDailyChallenge } from '../services/geminiService';

interface DashboardProps {
  user: UserProfile;
  path: LearningPath | null;
  onNavigate: (view: string) => void;
  onStartChallenge: (challenge: Challenge) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, path, onNavigate, onStartChallenge }) => {
  const [loadingChallenge, setLoadingChallenge] = useState(false);

  const handleGenerateChallenge = async () => {
    setLoadingChallenge(true);
    try {
        // Use Gemini to create a challenge
        const challenge = await generateDailyChallenge(user.domain, user.tool);
        onStartChallenge(challenge);
    } catch (e) {
        alert("Failed to generate challenge. Try again.");
    } finally {
        setLoadingChallenge(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-surfaceHighlight to-surface border border-white/5 rounded-2xl p-8 flex justify-between items-end">
        <div>
          <h2 className="text-gray-400 text-sm mb-1 uppercase tracking-wider">Dashboard</h2>
          <h1 className="text-4xl font-bold text-white mb-2">Welcome back, {user.name}</h1>
          <p className="text-gray-400">Current Focus: <span className="text-primary">{user.tool}</span> • Level: <span className="text-secondary">{user.skillLevel}</span></p>
        </div>
        <div className="text-right">
            <div className="text-3xl font-mono font-bold text-accent">{user.xp} XP</div>
            <div className="text-sm text-gray-500">{user.streak} Day Streak</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Learning Path Card */}
        <div className="lg:col-span-2 bg-surface rounded-2xl border border-white/5 p-6 hover:border-white/10 transition-all group cursor-pointer flex flex-col" onClick={() => path && onNavigate('path')}>
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Active Learning Path</h3>
              <p className="text-gray-400 text-sm">{path ? path.title : "No active path selected"}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary/20 group-hover:text-primary transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </div>
          </div>

          {path ? (
            <div className="flex-1 flex flex-col justify-end">
               {/* Node Map Visualization */}
               <div className="relative py-8 px-4 overflow-hidden">
                    {/* Connecting Line */}
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-white/5 -translate-y-1/2"></div>
                    <div 
                        className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-primary to-secondary -translate-y-1/2 transition-all duration-1000"
                        style={{ width: `${(path.steps.filter(s => s.status === 'completed').length / (path.steps.length - 1 || 1)) * 100}%` }}
                    ></div>
                    
                    {/* Nodes */}
                    <div className="relative flex justify-between items-center z-10">
                        {path.steps.map((step, idx) => {
                            const isCompleted = step.status === 'completed';
                            const isActive = step.status === 'active';
                            const isLocked = step.status === 'locked';
                            
                            return (
                                <div key={step.id} className="flex flex-col items-center gap-2 group/node">
                                    <div className={`w-4 h-4 rounded-full border-2 transition-all duration-300 relative ${
                                        isCompleted ? 'bg-secondary border-secondary shadow-[0_0_10px_rgba(168,85,247,0.5)]' :
                                        isActive ? 'bg-primary border-primary scale-125 shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-pulse' :
                                        'bg-surface border-gray-600'
                                    }`}>
                                        {isActive && <div className="absolute -inset-1 rounded-full border border-primary opacity-50 animate-ping"></div>}
                                    </div>
                                    <div className={`text-[10px] font-mono uppercase transition-colors max-w-[60px] text-center truncate ${
                                        isActive ? 'text-white font-bold' : 'text-gray-600'
                                    }`}>
                                        Step {idx + 1}
                                    </div>
                                    
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full mb-2 bg-black text-white text-xs p-2 rounded opacity-0 group-hover/node:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 border border-white/10">
                                        {step.title}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
               </div>
              
              <div className="mt-4 p-4 bg-black/20 rounded-xl border border-white/5 flex justify-between items-center">
                <div>
                    <div className="text-xs text-primary mb-1">CURRENT MODULE</div>
                    <div className="text-white font-medium">
                        {path.steps.find(s => s.status === 'active')?.title || "Path Completed!"}
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-2xl font-bold text-white">
                        {Math.round((path.steps.filter(s => s.status === 'completed').length / path.steps.length) * 100)}%
                    </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
               <p className="text-gray-500 mb-4">You haven't started a learning journey yet.</p>
               <button 
                onClick={(e) => { e.stopPropagation(); onNavigate('onboarding'); }}
                className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
               >
                 Generate New Path
               </button>
            </div>
          )}
        </div>

        {/* Daily Challenge Card */}
        <div className="bg-surface rounded-2xl border border-white/5 p-6 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2 relative z-10">Daily Challenge</h3>
          <p className="text-gray-400 text-sm mb-6 relative z-10">Test your skills against the clock. Earn medals.</p>
          
          <div className="mt-auto relative z-10">
            <button 
                onClick={handleGenerateChallenge}
                disabled={loadingChallenge}
                className="w-full bg-gradient-to-r from-accent to-orange-600 hover:from-orange-400 hover:to-orange-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all transform active:scale-95 disabled:opacity-50 flex justify-center items-center gap-2"
            >
                {loadingChallenge ? (
                    <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating Challenge...
                    </>
                ) : (
                    <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                    Start Challenge
                    </>
                )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;