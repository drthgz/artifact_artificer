import React, { useState } from 'react';
import { UserProfile, LearningPath, Challenge, Domain, SkillLevel } from './types';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import PathView from './components/PathView';
import AIChat from './components/AIChat';
import ChallengeModal from './components/ChallengeModal';

const App = () => {
  const [view, setView] = useState<'onboarding' | 'dashboard' | 'path'>('onboarding');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentPath, setCurrentPath] = useState<LearningPath | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);

  const handleOnboardingComplete = (
    userData: { domain: Domain; tool: string; skill: SkillLevel; name: string }, 
    pathData: LearningPath
  ) => {
    setUser({
      name: userData.name,
      domain: userData.domain,
      tool: userData.tool,
      skillLevel: userData.skill,
      xp: 0,
      streak: 1
    });
    setCurrentPath(pathData);
    setView('dashboard');
    // Auto open chat to welcome
    setTimeout(() => setIsChatOpen(true), 1500);
  };

  const handleStepComplete = (stepId: string) => {
    if (!currentPath || !user) return;
    
    // Update path status locally
    const updatedSteps = currentPath.steps.map(step => {
        if (step.id === stepId) return { ...step, status: 'completed' as const };
        return step;
    });

    // Unlock next step
    const completedIndex = updatedSteps.findIndex(s => s.id === stepId);
    if (completedIndex < updatedSteps.length - 1) {
        updatedSteps[completedIndex + 1].status = 'active';
    }

    setCurrentPath({ ...currentPath, steps: updatedSteps });
    setUser({ ...user, xp: user.xp + (updatedSteps.find(s => s.id === stepId)?.xpReward || 50) });
  };

  // Derive context for Copilot
  const activeStep = currentPath?.steps.find(s => s.status === 'active') || currentPath?.steps.find(s => s.status === 'completed'); // fallback
  const chatContext = {
      tool: user?.tool || 'General',
      stepTitle: view === 'path' ? activeStep?.title : undefined,
      stepDesc: view === 'path' ? activeStep?.description : undefined
  };

  if (!user || view === 'onboarding') {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen bg-background text-gray-200 font-sans selection:bg-primary/30">
      
      {/* Sidebar / Navigation (Desktop) */}
      <div className="fixed left-0 top-0 h-full w-20 bg-surface border-r border-white/5 hidden lg:flex flex-col items-center py-8 z-40">
        <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl mb-8 flex items-center justify-center font-bold text-white text-xl">A</div>
        
        <nav className="space-y-6">
            <button 
                onClick={() => setView('dashboard')}
                className={`p-3 rounded-xl transition-colors ${view === 'dashboard' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            </button>
            <button 
                onClick={() => setView('path')}
                className={`p-3 rounded-xl transition-colors ${view === 'path' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
            </button>
        </nav>
      </div>

      {/* Main Content Area */}
      <main className={`lg:ml-20 transition-all duration-300 ${isChatOpen ? 'mr-96' : ''}`}>
        {view === 'dashboard' && (
            <Dashboard 
                user={user} 
                path={currentPath} 
                onNavigate={(v: any) => setView(v)} 
                onStartChallenge={setActiveChallenge}
            />
        )}
        {view === 'path' && currentPath && (
            <PathView 
                path={currentPath} 
                onBack={() => setView('dashboard')}
                onCompleteStep={handleStepComplete}
            />
        )}
      </main>

      {/* AI Copilot */}
      <AIChat 
        isOpen={isChatOpen} 
        onToggle={() => setIsChatOpen(!isChatOpen)} 
        context={chatContext}
      />

      {/* Modals */}
      {activeChallenge && (
        <ChallengeModal challenge={activeChallenge} onClose={() => setActiveChallenge(null)} />
      )}
    </div>
  );
};

export default App;