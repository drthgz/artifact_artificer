import React, { useState, useEffect } from 'react';
import { Domain, SkillLevel } from '../types';
import { generateLearningPath } from '../services/geminiService';

interface OnboardingProps {
  initialName?: string;
  onCancel?: () => void;
  onComplete: (
    data: { domain: Domain; tool: string; skill: SkillLevel; name: string },
    pathData: any
  ) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete, initialName, onCancel }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState(initialName || '');
  const [domain, setDomain] = useState<Domain>('Digital Art');
  const [tool, setTool] = useState('');
  const [skill, setSkill] = useState<SkillLevel>('Beginner');
  const [goal, setGoal] = useState('');
  const [loading, setLoading] = useState(false);

  // Skip name step if already provided
  useEffect(() => {
    if (initialName) {
        // We stay on step 1 but it only shows domain
    }
  }, [initialName]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
        const path = await generateLearningPath(domain, tool, goal, skill);
        onComplete({ domain, tool, skill, name }, path);
    } catch (error) {
        alert("Failed to create personalized path. Please try again.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background dark:bg-dark-background p-4 relative overflow-hidden transition-colors duration-300">
        {/* Background blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-secondary/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-lg bg-white dark:bg-dark-surface border border-gray-200 dark:border-white/10 rounded-3xl p-8 shadow-2xl z-10 relative">
        
        {/* Cancel Button */}
        {onCancel && (
            <button 
                onClick={onCancel}
                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
                title="Cancel"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        )}

        <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{initialName ? 'New Path' : 'Artifex Setup'}</h1>
            <div className="h-1 w-full bg-gray-200 dark:bg-white/10 rounded-full">
                <div className="h-full bg-primary transition-all duration-500 rounded-full" style={{ width: `${(step / 3) * 100}%`}}></div>
            </div>
        </div>

        {step === 1 && (
          <div className="space-y-6">
            {!initialName && (
                <div>
                    <label className="block text-gray-600 dark:text-gray-400 text-sm mb-2">What should we call you?</label>
                    <input 
                        type="text" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl p-4 text-gray-900 dark:text-white focus:border-primary focus:outline-none transition-colors"
                        placeholder="Enter your name"
                    />
                </div>
            )}
            <div>
                <label className="block text-gray-600 dark:text-gray-400 text-sm mb-2">Choose your discipline</label>
                <div className="grid grid-cols-1 gap-3">
                    {['Digital Art', 'Engineering', 'Architecture'].map((d) => (
                        <button 
                            key={d}
                            onClick={() => setDomain(d as Domain)}
                            className={`p-4 rounded-xl text-left border transition-all font-medium ${domain === d ? 'bg-primary/20 border-primary text-primary dark:text-white' : 'bg-gray-50 dark:bg-black/20 border-gray-200 dark:border-white/5 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'}`}
                        >
                            {d}
                        </button>
                    ))}
                </div>
            </div>
            <button 
                onClick={() => { if(name) setStep(2) }}
                disabled={!name}
                className="w-full bg-primary text-white font-bold py-4 rounded-xl hover:bg-primaryDark disabled:opacity-50 transition-colors shadow-lg shadow-primary/20"
            >
                Next Step
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
             <div>
                <label className="block text-gray-600 dark:text-gray-400 text-sm mb-2">Which tool are you learning?</label>
                <input 
                    type="text" 
                    value={tool} 
                    onChange={(e) => setTool(e.target.value)} 
                    className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl p-4 text-gray-900 dark:text-white focus:border-primary focus:outline-none transition-colors"
                    placeholder="e.g. Blender, SolidWorks, AutoCAD"
                />
            </div>
            <div>
                <label className="block text-gray-600 dark:text-gray-400 text-sm mb-2">Current Skill Level</label>
                <div className="grid grid-cols-2 gap-3">
                    {['Beginner', 'Novice', 'Intermediate', 'Advanced'].map((s) => (
                        <button 
                            key={s}
                            onClick={() => setSkill(s as SkillLevel)}
                            className={`p-3 rounded-xl text-center border transition-all text-sm font-medium ${skill === s ? 'bg-secondary/10 dark:bg-secondary/50 border-secondary text-secondary dark:text-white' : 'bg-gray-50 dark:bg-black/20 border-gray-200 dark:border-white/5 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'}`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex gap-4">
                 <button 
                    onClick={() => setStep(1)}
                    className="flex-1 bg-transparent border border-gray-200 dark:border-white/10 text-gray-500 hover:text-gray-900 dark:hover:text-white font-bold py-4 rounded-xl transition-colors"
                >
                    Back
                </button>
                 <button 
                    onClick={() => { if(tool) setStep(3) }}
                    disabled={!tool}
                    className="flex-[2] bg-primary text-white font-bold py-4 rounded-xl hover:bg-primaryDark disabled:opacity-50 transition-colors shadow-lg shadow-primary/20"
                >
                    Next Step
                </button>
            </div>
          </div>
        )}

        {step === 3 && (
            <div className="space-y-6">
                <div>
                    <label className="block text-gray-600 dark:text-gray-400 text-sm mb-2">What is your specific goal?</label>
                    <textarea 
                        value={goal} 
                        onChange={(e) => setGoal(e.target.value)} 
                        className="w-full h-32 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl p-4 text-gray-900 dark:text-white focus:border-primary focus:outline-none resize-none transition-colors"
                        placeholder="e.g. I want to sculpt a realistic character for a game mod..."
                    />
                    <p className="text-xs text-gray-500 mt-2">Gemini will use its <span className="text-primary font-mono">thinking</span> mode to design a custom curriculum for you.</p>
                </div>
                <div className="flex gap-4">
                     <button 
                        onClick={() => setStep(2)}
                        disabled={loading}
                        className="flex-1 bg-transparent border border-gray-200 dark:border-white/10 text-gray-500 hover:text-gray-900 dark:hover:text-white font-bold py-4 rounded-xl transition-colors"
                    >
                        Back
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={loading || !goal}
                        className="flex-[2] bg-gradient-to-r from-primary to-primaryDark text-white font-bold py-4 rounded-xl hover:opacity-90 disabled:opacity-50 transition-all flex justify-center items-center gap-2 shadow-lg shadow-primary/20"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Generating...
                            </>
                        ) : (
                            "Start Journey"
                        )}
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;