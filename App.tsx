import React, { useState, useEffect } from 'react';
import { UserProfile, LearningPath, Challenge, Domain, SkillLevel } from './types';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import PathView from './components/PathView';
import AIChat from './components/AIChat';
import ChallengeModal from './components/ChallengeModal';
import ActiveChallengeView from './components/ActiveChallengeView';

const App = () => {
  const [view, setView] = useState<'onboarding' | 'dashboard' | 'path'>('onboarding');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [activePathId, setActivePathId] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const [isChallengeStarted, setIsChallengeStarted] = useState(false); // New state for active challenge session
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Handle Theme Toggle
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleOnboardingComplete = (
    userData: { domain: Domain; tool: string; skill: SkillLevel; name: string }, 
    pathData: LearningPath
  ) => {
    if (!user) {
        // Initial setup
        setUser({
            name: userData.name,
            domain: userData.domain,
            tool: userData.tool,
            skillLevel: userData.skill,
            xp: 0,
            streak: 1
        });
    }
    
    // Add the new path
    setPaths(prev => [...prev, pathData]);
    
    // If it's the first path or user specifically added it, set as active?
    // Let's just go to dashboard and let them see it
    setView('dashboard');
    
    // Auto open chat to welcome if first time
    if (paths.length === 0) {
        setTimeout(() => setIsChatOpen(true), 1500);
    }
  };

  const handleStepComplete = (stepId: string) => {
    if (!activePathId || !user) return;
    
    setPaths(prevPaths => prevPaths.map(path => {
        if (path.id !== activePathId) return path;

        const updatedSteps = path.steps.map(step => {
            if (step.id === stepId) return { ...step, status: 'completed' as const };
            return step;
        });

        // Unlock next step
        const completedIndex = updatedSteps.findIndex(s => s.id === stepId);
        if (completedIndex < updatedSteps.length - 1) {
            updatedSteps[completedIndex + 1].status = 'active';
        }

        // Add XP
        setUser(prevUser => prevUser ? ({ ...prevUser, xp: prevUser.xp + (updatedSteps.find(s => s.id === stepId)?.xpReward || 50) }) : null);

        return { ...path, steps: updatedSteps };
    }));
  };

  const handleChallengeFinish = () => {
      // Logic for finishing challenge (e.g., show summary, award XP)
      // For now, just close and return to dashboard
      setIsChallengeStarted(false);
      setActiveChallenge(null);
      alert("Challenge Completed! Stats saved.");
  };

  // Navigation handlers
  const navigateToPath = (pathId?: string) => {
      if (pathId) {
          setActivePathId(pathId);
          setView('path');
      }
  };

  // Derive active path object
  const activePath = paths.find(p => p.id === activePathId) || null;

  // Derive context for Copilot
  const activeStep = activePath?.steps.find(s => s.status === 'active') || activePath?.steps.find(s => s.status === 'completed');
  const chatContext = {
      tool: user?.tool || 'General',
      stepTitle: view === 'path' ? activeStep?.title : undefined,
      stepDesc: view === 'path' ? activeStep?.description : undefined
  };

  // Initial Onboarding View
  if (!user && view === 'onboarding') {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }
  
  // Secondary Onboarding View (Adding a path)
  if (user && view === 'onboarding') {
       return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  // Active Challenge View (Overrides everything)
  if (isChallengeStarted && activeChallenge && user) {
      return (
          <ActiveChallengeView 
            challenge={activeChallenge} 
            userTool={user.tool}
            onFinish={handleChallengeFinish}
            onCancel={() => {
                if(confirm("Are you sure you want to quit?")) {
                    setIsChallengeStarted(false);
                    setActiveChallenge(null);
                }
            }}
          />
      );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-dark-background text-textMain dark:text-gray-200 font-sans selection:bg-primary/30 flex">
      
      {/* Sidebar / Navigation (Desktop) */}
      <div className="fixed left-0 top-0 h-full w-20 bg-surface dark:bg-dark-surface border-r border-gray-200 dark:border-white/5 hidden lg:flex flex-col items-center py-8 z-40 shadow-sm">
        <div className="w-10 h-10 bg-primary rounded-xl mb-8 flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-primary/30">A</div>
        
        <nav className="space-y-6 flex-1 w-full flex flex-col items-center">
            <button 
                onClick={() => setView('dashboard')}
                title="Dashboard"
                className={`p-3 rounded-xl transition-all duration-300 ${view === 'dashboard' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-gray-400 hover:text-primary hover:bg-primary/10'}`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            </button>
            <button 
                onClick={() => activePathId && setView('path')}
                disabled={!activePathId}
                title="Current Path"
                className={`p-3 rounded-xl transition-all duration-300 ${view === 'path' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-gray-400 hover:text-primary hover:bg-primary/10 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400'}`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
            </button>
        </nav>

        {/* Theme Toggle */}
        <button 
            onClick={toggleTheme}
            className="mb-6 p-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            title="Toggle Theme"
        >
            {theme === 'light' ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
            )}
        </button>
      </div>

      {/* Main Content Area */}
      <main className={`flex-1 lg:ml-20 transition-all duration-300 ${isChatOpen ? 'mr-96' : ''} bg-background dark:bg-dark-background`}>
        {view === 'dashboard' && user && (
            <Dashboard 
                user={user} 
                paths={paths} 
                onNavigate={(v, pid) => {
                    if (v === 'path' && pid) {
                        navigateToPath(pid);
                    } else {
                        setView(v as any);
                    }
                }} 
                onStartChallenge={setActiveChallenge}
                onAddPath={() => setView('onboarding')}
            />
        )}
        {view === 'path' && activePath && (
            <PathView 
                path={activePath} 
                onBack={() => setView('dashboard')}
                onCompleteStep={handleStepComplete}
            />
        )}
      </main>

      {/* AI Copilot - Disabled during active challenge */}
      {!isChallengeStarted && (
          <AIChat 
            isOpen={isChatOpen} 
            onToggle={() => setIsChatOpen(!isChatOpen)} 
            context={chatContext}
          />
      )}

      {/* Modals */}
      {/* Show Preview Modal if activeChallenge exists BUT NOT started yet */}
      {activeChallenge && !isChallengeStarted && (
        <ChallengeModal 
            challenge={activeChallenge} 
            onClose={() => setActiveChallenge(null)}
            onStart={() => setIsChallengeStarted(true)}
        />
      )}
    </div>
  );
};

export default App;