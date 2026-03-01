import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Send, Key, Sparkles, MessageSquare, Trash2, Cpu, 
  Info, Zap, Settings, PlusCircle, X, Sliders, 
  BarChart3, Target, Activity, Play, Pause, 
  ChevronLeft, ChevronRight, Eye 
} from 'lucide-react';

/**
 * MERCURY 2 DIFFUSION CHAT - PROFESSIONAL REFINERY
 * * Features:
 * - Dynamic Diffusion Animation (Character-swapping refinement)
 * - Manual Step Scrubber (View resolution history)
 * - +1 Final Rendering Step (Raw Monospace -> Beautiful UI)
 * - Advanced Parameter Suite (Effort, Guidance, Sampling, Penalties)
 * - CDN-based Markdown & LaTeX (KaTeX) rendering
 */

// Hook to load Markdown and LaTeX rendering engines via CDN for environment compatibility
const useExternalScripts = () => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const scripts = [
      { id: 'katex-css', type: 'link', href: 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css' },
      { id: 'katex-js', type: 'script', src: 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js' },
      { id: 'marked-js', type: 'script', src: 'https://cdn.jsdelivr.net/npm/marked/marked.min.js' }
    ];

    let loadedCount = 0;
    const onScriptLoad = () => {
      loadedCount++;
      if (loadedCount === scripts.length) setLoaded(true);
    };

    scripts.forEach(item => {
      if (document.getElementById(item.id)) {
        loadedCount++;
        return;
      }

      if (item.type === 'link') {
        const link = document.createElement('link');
        link.id = item.id;
        link.rel = 'stylesheet';
        link.href = item.href;
        link.onload = onScriptLoad;
        document.head.appendChild(link);
      } else {
        const script = document.createElement('script');
        script.id = item.id;
        script.src = item.src;
        script.async = true;
        script.onload = onScriptLoad;
        document.head.appendChild(script);
      }
    });

    if (loadedCount === scripts.length) setLoaded(true);
  }, []);

  return loaded;
};

// Component that handles the unique "Diffusion" text animation
const DiffusionText = ({ content, isFinal, speedSetting = 70 }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isManualMode, setIsManualMode] = useState(false);
  const contentRef = useRef(null);

  // Animation calculation logic
  const totalRefinementSteps = useMemo(() => Math.max(5, Math.floor(40 - (speedSetting / 3))), [speedSetting]);
  const renderStep = totalRefinementSteps + 1;
  const intervalTime = useMemo(() => Math.max(20, 120 - speedSetting), [speedSetting]);

  // Noise Generation: Swaps non-structural characters for random symbols based on progress
  const generateNoise = (text, step, total) => {
    if (!text) return "";
    const progress = step / total;
    if (progress >= 1) return text; 

    return text.split('').map(char => {
      const preserved = ['\n', ' ', '\t', '#', '$', '\\', '[', ']', '(', ')', '{', '}', '*', '_', '|', '=', '+', '-'];
      if (preserved.includes(char)) return char;
      
      if (Math.random() > progress) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@%^&';
        return chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return char;
    }).join('');
  };

  // Automatic resolution animation
  useEffect(() => {
    if (!isFinal) {
      setCurrentStep(Math.floor(totalRefinementSteps * 0.1)); 
      return;
    }

    if (isManualMode) return;

    let step = currentStep;
    const interval = setInterval(() => {
      step++;
      setCurrentStep(step);
      if (step >= renderStep) clearInterval(interval);
    }, intervalTime);

    return () => clearInterval(interval);
  }, [content, isFinal, totalRefinementSteps, renderStep, intervalTime, isManualMode]);

  // Final rendering step: converts raw text to HTML/LaTeX
  useEffect(() => {
    if (currentStep === renderStep && contentRef.current && window.marked && window.katex) {
      let html = content
        .replace(/\$\$\s*([\s\S]*?)\s*\$\$/g, (match, tex) => {
          try { return `<div class="my-4 overflow-x-auto text-center">${window.katex.renderToString(tex, { displayMode: true, throwOnError: false })}</div>`; } catch (e) { return match; }
        })
        .replace(/\\\[\s*([\s\S]*?)\s*\\\]/g, (match, tex) => {
          try { return `<div class="my-4 overflow-x-auto text-center">${window.katex.renderToString(tex, { displayMode: true, throwOnError: false })}</div>`; } catch (e) { return match; }
        })
        .replace(/\$([^\$]+)\$/g, (match, tex) => {
          try { return window.katex.renderToString(tex, { displayMode: false, throwOnError: false }); } catch (e) { return match; }
        })
        .replace(/\\\(([\s\S]*?)\\\)/g, (match, tex) => {
          try { return window.katex.renderToString(tex, { displayMode: false, throwOnError: false }); } catch (e) { return match; }
        });

      contentRef.current.innerHTML = window.marked.parse(html);
    }
  }, [content, currentStep, renderStep]);

  const refinedText = useMemo(() => generateNoise(content, currentStep, totalRefinementSteps), [content, currentStep, totalRefinementSteps]);
  const isRendered = currentStep >= renderStep;
  const isRawClean = currentStep === totalRefinementSteps;

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="relative group">
        {!isRendered ? (
          <div className="relative">
            <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-cyan-100 opacity-90 break-words">
              {refinedText || content}
            </pre>
            {isRawClean && (
              <div className="absolute top-0 right-0 px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 rounded text-[9px] font-bold text-cyan-400 animate-pulse">
                RAW VIEW
              </div>
            )}
          </div>
        ) : (
          <div 
            ref={contentRef} 
            className="prose prose-invert prose-cyan max-w-none text-slate-100 prose-p:leading-relaxed prose-pre:bg-slate-800/50 prose-table:border prose-table:border-slate-800 prose-th:border prose-th:border-slate-800 prose-td:border prose-td:border-slate-800 prose-th:px-2 prose-td:px-2 animate-in fade-in duration-500"
          />
        )}
      </div>

      {isFinal && (
        <div className="flex flex-col gap-3 pt-3 border-t border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border transition-colors ${isRendered ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-800/50 border-slate-700'}`}>
                {isRendered ? <Eye className="w-3 h-3" /> : <BarChart3 className="w-3 h-3 text-cyan-400" />}
                {currentStep <= totalRefinementSteps ? `Refining: ${currentStep}/${totalRefinementSteps}` : "Fully Rendered"}
              </span>
            </div>

            <button 
              onClick={() => setIsManualMode(!isManualMode)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-black uppercase transition-all ${isManualMode ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              <Sliders className="w-3 h-3" />
              {isManualMode ? 'Close Scrubber' : 'Manual Scrubber'}
            </button>
          </div>

          {isManualMode && (
            <div className="flex flex-col gap-3 bg-slate-950/50 p-3 rounded-xl border border-slate-800 animate-in slide-in-from-top-2">
              <div className="flex items-center gap-3">
                <button 
                  disabled={currentStep === 0}
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  className="p-1 hover:bg-slate-800 rounded disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <input 
                  type="range" min="0" max={renderStep} value={currentStep}
                  onChange={(e) => setCurrentStep(parseInt(e.target.value))}
                  className="flex-1 accent-cyan-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
                <button 
                  disabled={isRendered}
                  onClick={() => setCurrentStep(Math.min(renderStep, currentStep + 1))}
                  className="p-1 hover:bg-slate-800 rounded disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="flex justify-between px-1 text-[8px] font-bold text-slate-500 uppercase tracking-tighter">
                <span>Noise</span>
                <span className={currentStep === totalRefinementSteps ? 'text-cyan-400' : ''}>Refined Raw</span>
                <span className={currentStep === renderStep ? 'text-emerald-400' : ''}>Rendered UI</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [apiKey, setApiKey] = useState('');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  
  // Model Parameters
  const [diffusionSpeed, setDiffusionSpeed] = useState(70);
  const [reasoningEffort, setReasoningEffort] = useState('medium');
  const [selectedModel, setSelectedModel] = useState('mercury-2');
  
  // Advanced Sampling Parameters
  const [temperature, setTemperature] = useState(0.75);
  const [topP, setTopP] = useState(1.0);
  const [maxTokens, setMaxTokens] = useState(8192);

  // Diffusion Specific Parameters
  const [guidanceScale, setGuidanceScale] = useState(1.5);
  const [denoisingSteps, setDenoisingSteps] = useState(50);

  // Systematic Parameters
  const [presencePenalty, setPresencePenalty] = useState(0.0);
  const [frequencyPenalty, setFrequencyPenalty] = useState(0.0);

  const messagesEndRef = useRef(null);
  const scriptsLoaded = useExternalScripts();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startNewChat = () => {
    setMessages([]);
    setInput('');
    setIsLoading(false);
  };

  const resetToDefaults = () => {
    setTemperature(0.75);
    setTopP(1.0);
    setMaxTokens(8192);
    setGuidanceScale(1.5);
    setDenoisingSteps(50);
    setPresencePenalty(0.0);
    setFrequencyPenalty(0.0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const query = input;
    const userMessage = { role: 'user', content: query };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const aiMessageId = Date.now();
    setMessages(prev => [...prev, { role: 'assistant', content: '', id: aiMessageId, isFinal: false }]);

    try {
      const response = await fetch('https://api.inceptionlabs.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
          stream: true,
          reasoning_effort: reasoningEffort,
          temperature: temperature,
          top_p: topP,
          max_tokens: maxTokens,
          guidance_scale: guidanceScale,
          denoising_steps: denoisingSteps,
          presence_penalty: presencePenalty,
          frequency_penalty: frequencyPenalty
        })
      });

      if (!response.ok) throw new Error('API request failed');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          const cleanLine = line.trim();
          if (!cleanLine || cleanLine === 'data: [DONE]') continue;
          if (cleanLine.startsWith('data: ')) {
            try {
              const data = JSON.parse(cleanLine.substring(6));
              const content = data.choices[0]?.delta?.content || "";
              accumulatedContent += content;
              setMessages(prev => prev.map(m => 
                m.id === aiMessageId ? { ...m, content: accumulatedContent } : m
              ));
            } catch (e) { }
          }
        }
      }

      setMessages(prev => prev.map(m => 
        m.id === aiMessageId ? { ...m, isFinal: true } : m
      ));

    } catch (error) {
      setMessages(prev => prev.map(m => 
        m.id === aiMessageId ? { 
          ...m, 
          content: "### Error\nConnection failed. Please check your API token.", 
          isFinal: true,
          isError: true
        } : m
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const SettingRow = ({ label, value, min, max, step, onChange, description }) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</label>
        <span className="text-xs font-mono text-cyan-400">{typeof value === 'number' && value % 1 !== 0 ? value.toFixed(2) : value}</span>
      </div>
      <input 
        type="range" min={min} max={max} step={step} value={value} 
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-cyan-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
      />
      {description && <p className="text-[9px] text-slate-500 leading-tight italic">{description}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 overflow-hidden">
      {/* Dynamic Header */}
      <header className="border-b border-slate-800 p-4 bg-slate-900/40 backdrop-blur-xl sticky top-0 z-20 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-cyan-500 p-2 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.5)]">
              <Cpu className="w-5 h-5 text-slate-950" />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-bold text-lg tracking-tight leading-none">Mercury 2</h1>
              <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest">Diffusion Engine</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
             <div className="flex bg-slate-800 rounded-lg p-1 text-[10px] font-bold">
              <button 
                onClick={() => setSelectedModel('mercury-2')}
                className={`px-3 py-1 rounded-md transition-all ${selectedModel === 'mercury-2' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                M2 General
              </button>
              <button 
                onClick={() => setSelectedModel('mercury-edit')}
                className={`px-3 py-1 rounded-md transition-all ${selectedModel === 'mercury-edit' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                M-Edit
              </button>
            </div>

            <div className="h-6 w-px bg-slate-800 mx-1 hidden sm:block"></div>
            
            <button 
              onClick={startNewChat}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-100 bg-slate-800 hover:bg-slate-700 transition-all border border-slate-700 shadow-sm"
            >
              <PlusCircle className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">New Chat</span>
            </button>

            <button 
              onClick={() => setShowSettings(true)}
              className={`p-2 transition-colors ${showSettings ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-400 hover:text-cyan-400'} rounded-lg`}
            >
              <Sliders className="w-4 h-4" />
            </button>
            
            <button 
              onClick={() => setShowKeyInput(true)}
              className="p-2 text-slate-400 hover:text-cyan-400 transition-colors"
            >
              <Key className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 border-t border-slate-800 pt-3">
          <div className="flex items-center gap-3 bg-slate-950/40 px-3 py-1.5 rounded-xl border border-slate-800/50 flex-1 min-w-[200px]">
            <Zap className={`w-3.5 h-3.5 ${diffusionSpeed > 80 ? 'text-yellow-400' : 'text-cyan-400'}`} />
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">Refine Speed</span>
            <input 
              type="range" min="1" max="100" value={diffusionSpeed} 
              onChange={(e) => setDiffusionSpeed(parseInt(e.target.value))}
              className="flex-1 accent-cyan-500 h-1 bg-slate-800 rounded-lg cursor-pointer appearance-none"
            />
          </div>

          <div className="flex items-center gap-3 bg-slate-950/40 px-3 py-1.5 rounded-xl border border-slate-800/50">
            <Settings className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Reasoning</span>
            <div className="flex gap-1">
              {['low', 'medium', 'high'].map(level => (
                <button
                  key={level}
                  onClick={() => setReasoningEffort(level)}
                  className={`px-2 py-0.5 rounded text-[9px] font-black uppercase transition-all ${reasoningEffort === level ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Advanced Settings Drawer */}
      <div className={`fixed inset-y-0 right-0 z-50 w-80 bg-slate-900 border-l border-slate-800 shadow-2xl transition-transform duration-300 transform ${showSettings ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 h-full flex flex-col overflow-y-auto">
          <div className="flex items-center justify-between mb-8 sticky top-0 bg-slate-900 py-1 z-10">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Sliders className="w-5 h-5 text-cyan-400" />
              Parameters
            </h2>
            <button onClick={() => setShowSettings(false)} className="p-1 hover:bg-slate-800 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-10 pb-8">
            <section className="space-y-5">
              <div className="flex items-center gap-2 text-cyan-400 mb-2">
                <Target className="w-4 h-4" />
                <h3 className="text-xs font-bold uppercase tracking-widest">Sampling</h3>
              </div>
              <SettingRow label="Temperature" value={temperature} min={0} max={2} step={0.05} onChange={setTemperature} />
              <SettingRow label="Top P" value={topP} min={0} max={1} step={0.05} onChange={setTopP} />
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Max Tokens</label>
                  <input type="number" value={maxTokens} onChange={(e) => setMaxTokens(parseInt(e.target.value) || 0)} className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-cyan-400" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {[2048, 8192, 32768].map(val => (
                    <button key={val} onClick={() => setMaxTokens(val)} className={`px-2 py-1 rounded text-[9px] font-bold border ${maxTokens === val ? 'bg-cyan-600 border-cyan-500 text-white' : 'border-slate-800 text-slate-500'}`}>{val > 1000 ? `${val/1024}k` : val}</button>
                  ))}
                </div>
              </div>
            </section>
            <section className="space-y-5">
              <div className="flex items-center gap-2 text-purple-400 mb-2"><Activity className="w-4 h-4" /><h3 className="text-xs font-bold uppercase tracking-widest">Diffusion Dynamics</h3></div>
              <SettingRow label="Guidance Scale" value={guidanceScale} min={0.5} max={5} step={0.1} onChange={setGuidanceScale} />
              <SettingRow label="Denoising Steps" value={denoisingSteps} min={10} max={150} step={1} onChange={setDenoisingSteps} />
            </section>
          </div>
          <button onClick={resetToDefaults} className="mt-auto py-3 border border-slate-800 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-white hover:bg-slate-800 transition-all rounded-xl">Reset All Defaults</button>
        </div>
      </div>

      {showKeyInput && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-center mb-6">Inception Labs Login</h2>
            <input type="password" placeholder="sk-..." value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-4 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 mb-6 font-mono" />
            <button onClick={() => setShowKeyInput(false)} disabled={!apiKey} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg">Start Session</button>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 relative">
        {showSettings && <div className="absolute inset-0 bg-black/20 z-40" onClick={() => setShowSettings(false)}></div>}
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-10 animate-in fade-in duration-700">
            <Sparkles className="w-20 h-20 text-cyan-400" />
            <div className="space-y-2"><h3 className="text-4xl font-black tracking-tight">Mercury 2 Refinery</h3><p className="text-slate-400 text-lg">Tunable diffusion-based reasoning at extreme scale.</p></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              {[{ title: 'Complex Logic', prompt: 'If 3 people take 2 hours to paint a wall, how long would it take 6 people?' }, { title: 'LaTeX Table', prompt: 'Create a detailed table of 4D geometric properties.' }, { title: 'Code Review', prompt: 'Refactor this async/await loop for better performance.' }, { title: 'Architecture', prompt: 'Explain how diffusion LLMs differ from autoregressive models.' }].map((item, i) => (
                <button key={i} onClick={() => setInput(item.prompt)} className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl text-left hover:border-cyan-500/50 hover:bg-slate-800 transition-all group">
                  <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-1">{item.title}</div>
                  <div className="text-sm text-slate-400 line-clamp-1">{item.prompt}</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, idx) => (
            <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[95%] md:max-w-[85%] rounded-3xl p-5 md:p-7 ${m.role === 'user' ? 'bg-slate-800/80 border border-slate-700 shadow-sm' : 'bg-slate-900/30 border border-slate-800/50 shadow-inner'}`}>
                {m.role === 'assistant' ? <DiffusionText content={m.content} isFinal={m.isFinal} speedSetting={diffusionSpeed} /> : <p className="whitespace-pre-wrap text-slate-100 font-medium">{m.content}</p>}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} className="h-4" />
      </main>

      <footer className="p-4 md:p-8 bg-gradient-to-t from-slate-950 to-transparent relative z-30">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative group">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl pl-6 pr-14 py-5 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-slate-100 placeholder:text-slate-600 shadow-2xl backdrop-blur-md" placeholder={apiKey ? `Message ${selectedModel}...` : "Set API token to begin"} disabled={!apiKey || isLoading || !scriptsLoaded} />
          <button type="submit" disabled={!apiKey || !input.trim() || isLoading} className="absolute right-3 top-3 bottom-3 px-5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 transition-all shadow-lg flex items-center justify-center">
            {isLoading ? <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div> : <Send className="w-5 h-5 stroke-[3px]" />}
          </button>
        </form>
        <div className="mt-4 flex justify-center gap-6 text-[9px] text-slate-600 uppercase font-black tracking-widest">
           <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-cyan-500"></div> Effort: {reasoningEffort}</span>
           <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div> Guidance: {guidanceScale}</span>
           <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div> Penalty: {presencePenalty > 0 || frequencyPenalty > 0 ? 'ON' : 'OFF'}</span>
        </div>
      </footer>
    </div>
  );
}