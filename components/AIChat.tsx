import React, { useState, useEffect, useRef } from 'react';
import { createChatSession, editImage } from '../services/geminiService';
import { ChatMessage } from '../types';
import { Chat, GenerateContentResponse, Part } from "@google/genai";
import { marked } from 'marked';

interface AIChatProps {
  isOpen: boolean;
  onToggle: () => void;
  context: {
    tool: string;
    stepTitle?: string;
    stepDesc?: string;
  };
}

const AIChat: React.FC<AIChatProps> = ({ isOpen, onToggle, context }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      role: 'model',
      text: "Hi! I'm Artifex. I see what you're working on. How can I help you with this step?",
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [pastedImage, setPastedImage] = useState<string | null>(null);
  const [mode, setMode] = useState<'chat' | 'edit'>('chat'); // Toggle for image mode
  
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Chat
  useEffect(() => {
    chatSessionRef.current = createChatSession();
  }, []);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen, isTyping]);

  // Reset mode when image cleared
  useEffect(() => {
    if (!pastedImage) setMode('chat');
  }, [pastedImage]);

  // Handle Paste (Images)
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const blob = items[i].getAsFile();
        if (blob) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    // Get base64 string without prefix for API, but keep full for preview
                    setPastedImage(event.target.result as string);
                    setMode('chat'); // Default to chat
                }
            };
            reader.readAsDataURL(blob);
        }
      }
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !pastedImage) || isTyping) return;

    // Display user message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input, 
      imageUrl: pastedImage || undefined,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    const currentImage = pastedImage;
    const currentMode = mode;
    
    setInput('');
    setPastedImage(null);
    setIsTyping(true);

    try {
      if (currentMode === 'edit' && currentImage) {
        // Image Editing Flow (Nano Banana)
        try {
            const editedImageBase64 = await editImage(currentImage, currentInput || "Enhance this image");
            
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'model',
                text: "Here is the edited version:",
                imageUrl: editedImageBase64,
                timestamp: Date.now()
            }]);
        } catch (err) {
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'model',
                text: "Sorry, I couldn't process the image edit request.",
                timestamp: Date.now()
            }]);
        }
      } else {
        // Standard Chat Flow (Gemini Flash)
        if (!chatSessionRef.current) return;

        // Construct parts for the model
        // We prepend context to the text part so the model knows what's up without user seeing it in bubble
        const contextPrompt = `
        [SYSTEM CONTEXT]
        User Tool: ${context.tool}
        Current Module: ${context.stepTitle || 'General'}
        Task Description: ${context.stepDesc || 'N/A'}
        
        Please provide specific advice for ${context.tool}. Do NOT include markdown code blocks or HTML tags in your response unless absolutely necessary for code snippets. Keep the response clean and readable.
        [END CONTEXT]
        
        ${currentInput}
        `;

        const parts: (string | Part)[] = [{ text: contextPrompt }];
        
        if (currentImage) {
            // Remove data url prefix for API
            const base64Data = currentImage.split(',')[1];
            parts.unshift({
                inlineData: {
                    mimeType: 'image/png', // Assuming png or jpeg, simple handling
                    data: base64Data
                }
            });
        }

        const result = await chatSessionRef.current.sendMessageStream({ 
            message: parts.length === 1 ? parts[0] as string : parts 
        });
        
        let fullResponse = '';
        const botMsgId = (Date.now() + 1).toString();
        
        // Add placeholder for bot message
        setMessages(prev => [...prev, {
            id: botMsgId,
            role: 'model',
            text: '',
            timestamp: Date.now()
        }]);

        for await (const chunk of result) {
            const c = chunk as GenerateContentResponse;
            const textChunk = c.text || '';
            fullResponse += textChunk;
            
            setMessages(prev => prev.map(msg => 
            msg.id === botMsgId ? { ...msg, text: fullResponse } : msg
            ));
        }
      }
    } catch (error) {
      console.error("Chat error", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "I encountered an error connecting to the neural network. Please try again.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Render markdown safely
  const renderMessageText = (text: string) => {
      const html = marked.parse(text) as string;
      return <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: html }} />;
  };

  if (!isOpen) {
    return (
      <button 
        onClick={onToggle}
        className="fixed bottom-6 right-6 bg-primary hover:bg-blue-600 text-white p-4 rounded-full shadow-lg z-50 transition-all transform hover:scale-105"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2-2z"></path></svg>
      </button>
    );
  }

  return (
    <div className="fixed top-0 right-0 h-full w-96 bg-white dark:bg-dark-surface border-l border-gray-200 dark:border-white/10 shadow-2xl z-50 flex flex-col transform transition-transform duration-300">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-white/10 flex justify-between items-center bg-gray-100 dark:bg-dark-surfaceHighlight">
        <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <div>
                <h3 className="font-semibold text-gray-900 dark:text-white leading-none">Artifex Copilot</h3>
                <span className="text-[10px] text-gray-500">{context.tool} • {context.stepTitle ? 'Module Active' : 'Idle'}</span>
            </div>
        </div>
        <button onClick={onToggle} className="text-gray-400 hover:text-gray-900 dark:hover:text-white">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white dark:bg-dark-surface">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[90%] rounded-lg overflow-hidden border ${
              msg.role === 'user' 
                ? 'bg-primary text-white border-primary' 
                : 'bg-gray-200 dark:bg-white/5 border-gray-300 dark:border-white/10 text-gray-900 dark:text-gray-200'
            }`}>
              {/* Image Content */}
              {msg.imageUrl && (
                  <div className="w-full">
                      <img src={msg.imageUrl} alt="Content" className="w-full h-auto object-cover max-h-60" />
                  </div>
              )}
              {/* Text Content */}
              {(msg.text || !msg.imageUrl) && (
                <div className="p-3 text-sm">
                    {msg.role === 'model' ? renderMessageText(msg.text) : msg.text}
                </div>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
           <div className="flex justify-start">
             <div className="bg-gray-100 dark:bg-white/5 rounded-lg p-3 text-sm text-gray-400 italic flex gap-1">
                 <span className="animate-bounce">●</span>
                 <span className="animate-bounce delay-100">●</span>
                 <span className="animate-bounce delay-200">●</span>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-dark-surfaceHighlight">
        {pastedImage && (
            <div className="mb-2 space-y-2">
                <div className="relative inline-block">
                    <img src={pastedImage} alt="Paste" className="h-16 rounded border border-gray-300 dark:border-white/20" />
                    <button 
                        onClick={() => setPastedImage(null)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 w-5 h-5 flex items-center justify-center text-xs"
                    >
                        ×
                    </button>
                </div>
                {/* Mode Toggle */}
                <div className="flex gap-1 bg-gray-200 dark:bg-black/20 p-1 rounded-lg w-fit">
                    <button 
                        onClick={() => setMode('chat')}
                        className={`px-3 py-1 text-xs rounded-md transition-all ${mode === 'chat' ? 'bg-primary text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                    >
                        Analyze
                    </button>
                    <button 
                        onClick={() => setMode('edit')}
                        className={`px-3 py-1 text-xs rounded-md transition-all ${mode === 'edit' ? 'bg-accent text-black font-bold' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                    >
                        Magic Edit
                    </button>
                </div>
            </div>
        )}
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          onPaste={handlePaste}
          placeholder={pastedImage && mode === 'edit' ? "Describe changes (e.g. 'Add a neon glow')..." : `Ask about ${context.stepTitle || context.tool}...`}
          className="w-full bg-white dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded-lg p-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary resize-none h-20"
        />
        <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
          <span>Shift+Enter for new line</span>
          <button 
            onClick={handleSend}
            disabled={(!input.trim() && !pastedImage) || isTyping}
            className={`px-3 py-1 rounded transition-colors text-white disabled:opacity-50 ${mode === 'edit' && pastedImage ? 'bg-accent text-black font-bold hover:bg-yellow-300' : 'bg-primary hover:bg-blue-600'}`}
          >
            {mode === 'edit' && pastedImage ? 'Generate' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChat;