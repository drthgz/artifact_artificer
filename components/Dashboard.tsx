import React, { useState } from 'react';
import { UserProfile, LearningPath, Challenge } from '../types';
import { generateDailyChallenge } from '../services/geminiService';

interface DashboardProps {
  user: UserProfile;
  paths: LearningPath[];
  onNavigate: (view: string, pathId?: string) => void;
  onStartChallenge: (challenge: Challenge) => void;
  onAddPath: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, paths, onNavigate, onStartChallenge, onAddPath }) => {
  const [loadingChallenge, setLoadingChallenge] = useState(false);
  const [challengesExpanded, setChallengesExpanded] = useState(true);

  const handleGenerateChallenge = async () => {
    setLoadingChallenge(true);
    try {
        const challenge = await generateDailyChallenge(user.domain, user.tool);
        onStartChallenge(challenge);
    } catch (e) {
        alert("Failed to generate challenge. Try again.");
    } finally {
        setLoadingChallenge(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-12">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-end border-b border-gray-200 dark:border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome back, {user.name}</h1>
          <p className="text-gray-500 dark:text-gray-400">
             Level {Math.floor(user.xp / 1000) + 1} {user.domain} • <span className="text-primary font-semibold">{user.xp} XP</span>
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-4">
            <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{user.streak}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Day Streak</div>
            </div>
             <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{paths.length}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Active Paths</div>
            </div>
        </div>
      </div>

      {/* Challenges Section */}
      <section className="space-y-4">
        <div className="flex justify-between items-center cursor-pointer group" onClick={() => setChallengesExpanded(!challengesExpanded)}>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" className="text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                Challenges
                <span className="text-xs font-normal bg-primary/10 text-primary px-2 py-1 rounded ml-2 group-hover:bg-primary/20 transition-colors">
                    {challengesExpanded ? 'Collapse' : 'Expand'}
                </span>
            </h2>
        </div>

        <div className={`transition-all duration-500 overflow-hidden ${challengesExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Daily Challenge - Big Card */}
                <div className="md:col-span-5 bg-white dark:bg-dark-surface rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/5 flex flex-col relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 p-8 opacity-5 dark:opacity-10 transition-transform group-hover:scale-110">
                        <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    </div>
                    <div className="relative z-10">
                        <div className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Expires in 12h</div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Daily Sprint</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">Quick-fire modeling tasks to warm up your creativity.</p>
                        <button 
                            onClick={handleGenerateChallenge}
                            disabled={loadingChallenge}
                            className="bg-primary hover:bg-primaryDark text-white px-6 py-2 rounded-full font-medium transition-colors flex items-center gap-2 w-fit"
                        >
                             {loadingChallenge ? 'Generating...' : 'Start Daily Challenge'}
                        </button>
                    </div>
                </div>

                {/* Weekly Challenge - Big Card */}
                <div className="md:col-span-5 bg-white dark:bg-dark-surface rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/5 flex flex-col relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 p-8 opacity-5 dark:opacity-10 transition-transform group-hover:scale-110">
                         <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg>
                    </div>
                    <div className="relative z-10">
                        <div className="text-xs font-bold text-accent uppercase tracking-wider mb-2">Weekly Theme: Cyberpunk</div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Neon Nights</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">Create a high-fidelity environment asset.</p>
                        <button className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 px-6 py-2 rounded-full font-medium transition-colors w-fit">
                            View Details
                        </button>
                    </div>
                </div>

                {/* Side Challenges - Expandable Icons */}
                <div className="md:col-span-2 flex flex-row md:flex-col gap-4">
                    {[
                        { label: 'Monthly', icon: 'M', color: 'bg-purple-500', desc: 'Marathon' },
                        { label: 'Seasonal', icon: 'S', color: 'bg-green-500', desc: 'Winter Jam' },
                        { label: 'Sponsored', icon: '$', color: 'bg-yellow-500', desc: 'NVIDIA' }
                    ].map((c) => (
                        <div key={c.label} className="flex-1 bg-white dark:bg-dark-surface rounded-xl p-4 shadow-sm border border-gray-100 dark:border-white/5 flex items-center gap-3 group cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-all overflow-hidden relative">
                            <div className={`w-10 h-10 rounded-full ${c.color} text-white flex items-center justify-center font-bold text-lg shadow-lg`}>{c.icon}</div>
                            <div className="w-0 opacity-0 group-hover:w-auto group-hover:opacity-100 transition-all duration-300 whitespace-nowrap">
                                <div className="font-bold text-gray-900 dark:text-white text-sm">{c.label}</div>
                                <div className="text-[10px] text-gray-500">{c.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </section>

      {/* Learning Section */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" className="text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
            My Learning
        </h2>

        {paths.length === 0 ? (
            <div className="bg-white dark:bg-dark-surface rounded-2xl p-12 text-center border-2 border-dashed border-gray-200 dark:border-gray-700">
                <div className="w-24 h-24 bg-gray-100 dark:bg-white/5 rounded-full mx-auto flex items-center justify-center mb-6">
                     <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Start Your Journey</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8">
                    You don't have any active learning paths. Create a personalized curriculum powered by AI to master your tools.
                </p>
                <button 
                    onClick={onAddPath}
                    className="bg-primary hover:bg-primaryDark text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-primary/30 transition-all hover:scale-105"
                >
                    Begin Learning Path
                </button>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Active Paths */}
                {paths.map((path) => {
                    const progress = Math.round((path.steps.filter(s => s.status === 'completed').length / path.steps.length) * 100);
                    return (
                        <div 
                            key={path.id} 
                            onClick={() => onNavigate('path', path.id)}
                            className="bg-white dark:bg-dark-surface rounded-2xl border border-gray-100 dark:border-white/5 p-6 hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-primary/10 rounded-lg text-primary">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                                </div>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">{progress}%</div>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-1">{path.title}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 line-clamp-2 min-h-[40px]">{path.description}</p>
                            
                            {/* Progress Bar */}
                            <div className="w-full h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }}></div>
                            </div>
                            <div className="mt-4 flex justify-between items-center text-xs text-gray-500">
                                <span>{path.steps.length} Modules</span>
                                <span className="group-hover:text-primary transition-colors">Continue &rarr;</span>
                            </div>
                        </div>
                    );
                })}

                {/* Add New Path Card */}
                <button 
                    onClick={onAddPath}
                    className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/10 p-6 flex flex-col items-center justify-center gap-4 text-gray-400 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all min-h-[250px]"
                >
                    <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    </div>
                    <span className="font-medium">Create New Path</span>
                </button>
            </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;