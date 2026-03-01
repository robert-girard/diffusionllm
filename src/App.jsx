import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Send, Key, Sparkles, MessageSquare, Trash2, Cpu, 
  Info, Zap, Settings, PlusCircle, X, Sliders, 
  BarChart3, Target, Activity, ChevronLeft, 
  ChevronRight, Eye, History 
} from 'lucide-react';

/**
 * MERCURY 2 REAL DIFFUSION REFINERY
 * * Features:
 * - Unified Scrubber: Scrubbing replaces the entire view (no duplicates).
 * - Key-based Re-animation: Adjusting speed bar instantly replays the latest response.
 * - Static Layout: Header and drawer are fixed; only the chat area scrolls.
 * - Snapshots replacement: Handles 'diffusing: true' full-block logic correctly.
 */

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

const DiffusionText = ({ content, snapshots = [], isFinal, speedSetting }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isManualMode, setIsManualMode] = useState(false);
  const contentRef = useRef(null);
  
  // Calculate delay based on speed setting
  const intervalTime = useMemo(() => Math.max(10, 220 - (speedSetting * 2)), [speedSetting]);

  // Sync with stream or auto-progression
  useEffect(() => {
    if (!isFinal) {
      // While streaming, always jump to the latest captured snapshot
      if (snapshots.length > 0) setCurrentStep(snapshots.length - 1);
      return;
    }

    // Auto-progression when finished (unless user is manually scrubbing)
    if (!isManualMode && currentStep < snapshots.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, intervalTime);
      return () => clearTimeout(timer);
    }
  }, [currentStep, snapshots.length, isFinal, isManualMode, intervalTime]);

  // Handle Markdown/LaTeX rendering for the final step ONLY
  useEffect(() => {
    const isAtFinalStep = currentStep === snapshots.length - 1;
    if (isFinal && isAtFinalStep && contentRef.current && window.marked && window.katex) {
      const rawText = String(snapshots[currentStep] || content || "");
      let html = rawText
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
  }, [currentStep, snapshots, isFinal, content]);

  const textToShow = String(snapshots[currentStep] || content || "");
  const isViewingFinal = isFinal && currentStep === snapshots.length - 1;

  return (
    <div className="w-full flex flex-col gap-4">
      {/* THE VIEW: Swaps entirely between raw and rendered. NO DUPLICATION. */}
      <div className="relative">
        {!isViewingFinal ? (
          <div className="animate-in fade-in duration-200">
            <pre className="whitespace-pre-wrap font-mono text-xs md:text-sm leading-relaxed text-cyan-100/90 break-words bg-slate-950/40 p-4 rounded-2xl border border-cyan-500/10 shadow-inner">
              {textToShow}
            </pre>
            <div className="mt-2 flex items-center justify-between px-2">
              <span className="text-[9px] font-black text-cyan-500/40 uppercase tracking-widest">
                {isFinal ? `Reviewing Step ${currentStep + 1}` : 'Diffusion Stream Active...'}
              </span>
            </div>
          </div>
        ) : (
          <div 
            ref={contentRef} 
            className="prose prose-invert prose-cyan max-w-none text-slate-100 prose-p:leading-relaxed prose-pre:bg-slate-800/50 prose-table:border prose-table:border-slate-800 animate-in fade-in slide-in-from-bottom-2 duration-500"
          />
        )}
      </div>

      {/* Manual Scrubber Logic */}
      {isFinal && snapshots.length > 1 && (
        <div className="flex flex-col gap-3 pt-3 border-t border-white/5 bg-slate-900/30 p-3 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase transition-colors ${isViewingFinal ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'}`}>
                {isViewingFinal ? <Eye className="w-3 h-3" /> : <History className="w-3 h-3" />}
                Step {currentStep + 1} / {snapshots.length}
              </span>
            </div>

            <button 
              onClick={() => {
                setIsManualMode(!isManualMode);
                if (isManualMode) setCurrentStep(snapshots.length - 1);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${isManualMode ? 'bg-cyan-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              <Sliders className="w-3 h-3" />
              {isManualMode ? 'Resume Auto' : 'Manual Scrub'}
            </button>
          </div>

          {isManualMode && (
            <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="flex items-center gap-3">
                <button disabled={currentStep === 0} onClick={() => setCurrentStep(currentStep - 1)} className="p-1.5 hover:bg-slate-800 rounded-lg disabled:opacity-20 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                <input 
                  type="range" min="0" max={snapshots.length - 1} value={currentStep} 
                  onChange={(e) => setCurrentStep(parseInt(e.target.value))}
                  className="flex-1 accent-cyan-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
                <button disabled={currentStep === snapshots.length - 1} onClick={() => setCurrentStep(currentStep + 1)} className="p-1.5 hover:bg-slate-800 rounded-lg disabled:opacity-20 transition-colors"><ChevronRight className="w-4 h-4" /></button>
              </div>
              <div className="flex justify-between px-1 text-[8px] font-black text-slate-500 uppercase tracking-widest">
                <span onClick={() => setCurrentStep(0)} className="cursor-pointer hover:text-slate-300">Hypothesis Start</span>
                <span onClick={() => setCurrentStep(snapshots.length - 1)} className="cursor-pointer hover:text-slate-300">Final Resolved</span>
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
  
  // Parameters
  const [diffusionSpeed, setDiffusionSpeed] = useState(85);
  const [reasoningEffort, setReasoningEffort] = useState('medium');
  const [selectedModel, setSelectedModel] = useState('mercury-2');
  const [temperature, setTemperature] = useState(0.75);
  const [topP, setTopP] = useState(1.0);
  const [maxTokens, setMaxTokens] = useState(8192);
  const [guidanceScale, setGuidanceScale] = useState(1.5);
  const [denoisingSteps, setDenoisingSteps] = useState(50);

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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: String(input) };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const aiMessageId = Date.now();
    setMessages(prev => [...prev, { role: 'assistant', content: '', snapshots: [], id: aiMessageId, isFinal: false }]);

    try {
      const response = await fetch('https://api.inceptionlabs.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: selectedModel,
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: String(m.content) })),
          stream: true,
          diffusing: true,
          reasoning_effort: reasoningEffort,
          temperature,
          top_p: topP,
          max_tokens: maxTokens,
          guidance_scale: guidanceScale,
          denoising_steps: denoisingSteps
        })
      });

      if (!response.ok) throw new Error('API request failed');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let lastRecordedContent = "";

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
              const currentSnapshot = String(data.choices[0]?.delta?.content || "");
              
              if (currentSnapshot && currentSnapshot !== lastRecordedContent) {
                setMessages(prev => prev.map(m => {
                  if (m.id === aiMessageId) {
                    const existing = m.snapshots;
                    if (existing.length > 0 && existing[existing.length - 1] === currentSnapshot) return m;
                    return { 
                      ...m, 
                      content: currentSnapshot, 
                      snapshots: [...existing, currentSnapshot] 
                    };
                  }
                  return m;
                }));
                lastRecordedContent = currentSnapshot;
              }
            } catch (e) { }
          }
        }
      }

      setMessages(prev => prev.map(m => m.id === aiMessageId ? { ...m, isFinal: true } : m));
    } catch (error) {
      setMessages(prev => prev.map(m => m.id === aiMessageId ? { ...m, content: "### API connection error.\nPlease check your token.", isFinal: true, isError: true } : m));
    } finally {
      setIsLoading(false);
    }
  };

  const SettingRow = ({ label, value, min, max, step, onChange }) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center px-0.5">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</label>
        <span className="text-xs font-mono text-cyan-400">{typeof value === 'number' && value % 1 !== 0 ? value.toFixed(2) : value}</span>
      </div>
      <input 
        type="range" min={min} max={max} step={step} value={value} 
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-cyan-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
      />
    </div>
  );

  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 overflow-hidden relative">
      {/* Header - Static Positioning */}
      <header className="flex-none border-b border-slate-800 p-4 bg-slate-900/40 backdrop-blur-xl z-50 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-cyan-500 p-2 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <Cpu className="w-5 h-5 text-slate-950" />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-bold text-lg tracking-tight leading-none">Mercury 2</h1>
              <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest">Diffusion Refinery</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
             <div className="flex bg-slate-800 rounded-lg p-1 text-[10px] font-bold">
              <button onClick={() => setSelectedModel('mercury-2')} className={`px-3 py-1 rounded-md transition-all ${selectedModel === 'mercury-2' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>General</button>
              <button onClick={() => setSelectedModel('mercury-edit')} className={`px-3 py-1 rounded-md transition-all ${selectedModel === 'mercury-edit' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>Edit</button>
            </div>
            <button onClick={startNewChat} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-all shadow-sm"><PlusCircle className="w-4 h-4 text-cyan-400" /><span className="hidden sm:inline">New Chat</span></button>
            <button onClick={() => setShowSettings(true)} className={`p-2 transition-colors ${showSettings ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-400 hover:text-cyan-400'} rounded-lg`}><Sliders className="w-4 h-4" /></button>
            <button onClick={() => setShowKeyInput(true)} className="p-2 text-slate-400 hover:text-cyan-400 transition-colors"><Key className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 border-t border-slate-800 pt-3">
          <div className="flex items-center gap-3 bg-slate-950/40 px-3 py-1.5 rounded-xl border border-slate-800/50 flex-1 min-w-[200px]">
            <Zap className={`w-3.5 h-3.5 ${diffusionSpeed > 80 ? 'text-yellow-400' : 'text-cyan-400'}`} />
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">Refine Speed</span>
            <input 
              type="range" min="1" max="100" value={diffusionSpeed} 
              onChange={(e) => setDiffusionSpeed(parseInt(e.target.value))}
              className="flex-1 accent-cyan-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-[9px] font-mono text-cyan-400 w-8">{diffusionSpeed}%</span>
          </div>

          <div className="flex items-center gap-3 bg-slate-950/40 px-3 py-1.5 rounded-xl border border-slate-800/50">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Effort</span>
            <div className="flex gap-1 bg-slate-800 p-0.5 rounded-md">
              {['low', 'medium', 'high'].map(level => (
                <button key={level} onClick={() => setReasoningEffort(level)} className={`px-2 py-0.5 rounded text-[9px] font-black uppercase transition-all ${reasoningEffort === level ? 'bg-cyan-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>{level}</button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Advanced Settings Drawer - Fixed positioning */}
      <div className={`fixed inset-y-0 right-0 z-[60] w-80 bg-slate-900 border-l border-slate-800 p-6 flex flex-col gap-6 shadow-2xl transition-transform duration-300 transform ${showSettings ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between mb-4 flex-none"><h2 className="font-bold flex items-center gap-2 text-white"><Settings className="w-4 h-4 text-cyan-400" /> Model Params</h2><button onClick={() => setShowSettings(false)} className="hover:bg-slate-800 p-1.5 rounded-md transition-colors"><X className="w-5 h-5" /></button></div>
        <div className="space-y-8 overflow-y-auto flex-1 pr-2 custom-scrollbar">
           <SettingRow label="Temperature" value={temperature} min={0} max={2} step={0.05} onChange={setTemperature} />
           <SettingRow label="Guidance Scale" value={guidanceScale} min={0.5} max={5} step={0.1} onChange={setGuidanceScale} />
           <SettingRow label="Denoising Steps" value={denoisingSteps} min={10} max={150} step={1} onChange={setDenoisingSteps} />
           <div className="space-y-3">
             <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Max Tokens: {maxTokens}</label>
             <div className="flex flex-wrap gap-2">{[2048, 8192, 32768].map(v => <button key={v} onClick={() => setMaxTokens(v)} className={`px-2 py-1 rounded text-[9px] font-bold border transition-all ${maxTokens === v ? 'bg-cyan-600 border-cyan-500 text-white' : 'border-slate-800 text-slate-500 hover:border-slate-700'}`}>{v > 1000 ? (v/1024)+'k' : v}</button>)}</div>
           </div>
        </div>
        <button onClick={resetToDefaults} className="flex-none py-3 border border-slate-700 text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 rounded-xl transition-all">Reset Default Setup</button>
      </div>

      {showKeyInput && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-center mb-6 text-white">Inception Labs Login</h2>
            <input type="password" placeholder="sk-..." value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-4 text-slate-100 mb-6 font-mono focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all" />
            <button onClick={() => setShowKeyInput(false)} disabled={!apiKey} className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-30 text-white font-bold py-4 rounded-xl shadow-lg shadow-cyan-500/10 transition-all">Start Refinery Session</button>
          </div>
        </div>
      )}

      {/* Main Chat Area - Scrollable Container */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 relative z-10 custom-scrollbar">
        {showSettings && <div className="fixed inset-0 bg-black/40 z-[55] transition-opacity" onClick={() => setShowSettings(false)}></div>}
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-8 animate-in fade-in duration-700">
            <Sparkles className="w-16 h-16 text-cyan-400 opacity-60 animate-pulse" />
            <div className="space-y-2"><h3 className="text-3xl font-black tracking-tight text-white">Real Diffusion Refinery</h3><p className="text-slate-400 text-lg">Watch model snapshots evolve in real-time.</p></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
              {[{ title: 'Reasoning', prompt: 'If 3 people take 2 hours to paint a wall, how long would it take 6 people?' }, { title: 'Complex Math', prompt: 'Create a detailed table of 4D geometric properties using LaTeX.' }, { title: 'Optimization', prompt: 'Refactor this async/await loop for better performance.' }, { title: 'Architecture', prompt: 'Explain the difference between autoregressive and diffusion-based LLMs.' }].map((item, i) => (
                <button key={i} onClick={() => setInput(item.prompt)} className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl text-left hover:border-cyan-500/50 hover:bg-slate-800 transition-all group">
                  <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-1">{item.title}</div>
                  <div className="text-sm text-slate-400 line-clamp-1">{item.prompt}</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, idx) => (
            <div key={m.id || idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[95%] md:max-w-[85%] rounded-3xl p-5 md:p-7 shadow-2xl ${m.role === 'user' ? 'bg-slate-800/90 border border-slate-700' : 'bg-slate-900/50 border border-slate-800/50 shadow-inner'}`}>
                {m.role === 'assistant' ? (
                  <DiffusionText 
                    // Using diffusionSpeed as a key forces RE-ANIMATION on latest message when slider moves
                    key={idx === messages.length - 1 ? `latest-${diffusionSpeed}` : m.id}
                    content={String(m.content)} 
                    snapshots={m.snapshots} 
                    isFinal={m.isFinal} 
                    speedSetting={diffusionSpeed}
                    isLatest={idx === messages.length - 1}
                  />
                ) : (
                  <p className="whitespace-pre-wrap text-slate-100 font-medium text-sm md:text-base leading-relaxed">{String(m.content)}</p>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} className="h-4" />
      </main>

      {/* Footer - Static Positioning */}
      <footer className="flex-none p-4 md:p-8 bg-gradient-to-t from-slate-950 to-transparent relative z-40">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative group">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl pl-6 pr-14 py-5 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-slate-100 placeholder:text-slate-600 shadow-2xl backdrop-blur-md transition-all" placeholder={apiKey ? `Message ${selectedModel}...` : "Set API token to begin"} disabled={!apiKey || isLoading || !scriptsLoaded} />
          <button type="submit" disabled={!apiKey || !input.trim() || isLoading} className="absolute right-3 top-3 bottom-3 px-5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 transition-all shadow-lg flex items-center justify-center">
            {isLoading ? <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div> : <Send className="w-5 h-5 stroke-[3px]" />}
          </button>
        </form>
      </footer>
    </div>
  );
}