"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Cpu, Shield, Terminal, Activity, Zap, Server, User, ChevronRight, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function KrownFrame() {
  // 1. Initialize with default system message
  const defaultState = [{ role: "system", content: "Operator, the Void link is stable. Awaiting your command." }];
  const [messages, setMessages] = useState(defaultState);
  
  const [input, setInput] = useState("");
  const [mr, setMr] = useState(8); 
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false); // Fix for Next.js Hydration

  // 2. LOAD HISTORY (Run once on startup)
  useEffect(() => {
    setIsClient(true); // We are on the client now
    const saved = localStorage.getItem("krownframe-history");
    const savedMr = localStorage.getItem("krownframe-mr");
    
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history");
      }
    }
    if (savedMr) {
      setMr(Number(savedMr));
    }
  }, []);

  // 3. SAVE HISTORY (Run whenever messages or MR change)
  useEffect(() => {
    if (isClient) {
      localStorage.setItem("krownframe-history", JSON.stringify(messages));
      localStorage.setItem("krownframe-mr", String(mr));
    }
  }, [messages, mr, isClient]);

  // 4. CLEAR HISTORY FUNCTION
  const clearHistory = () => {
    if (confirm("Sever Void Link? This will wipe your memory.")) {
      setMessages(defaultState);
      localStorage.removeItem("krownframe-history");
      window.location.reload(); // Hard refresh to clear visuals
    }
  };
  
  const isChatting = messages.length > 1;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userText = input;
    setInput("");
    setLoading(true);

    const newHistory = [...messages, { role: "user", content: userText }];
    setMessages(newHistory);
    setMessages((prev) => [...prev, { role: "system", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newHistory, userMR: mr }),
      });

      if (!res.body) throw new Error("No response body");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let streamedResponse = "";

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value, { stream: true });
        streamedResponse += chunkValue;
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1].content = streamedResponse;
          return updated;
        });
      }
    } catch (error) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1].content = "Error: Void Link Severed.";
        return updated;
      });
    }
    setLoading(false);
  };

  // Prevent hydration mismatch by returning null until client loads
  if (!isClient) return null;

  return (
    <main className="h-screen w-full flex flex-col relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0f172a] via-[#020617] to-black text-cyan-50 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* 1. LIGHTING FX */}
      <div className="absolute top-[-20%] left-[50%] -translate-x-1/2 w-[800px] h-[400px] bg-blue-900/20 blur-[120px] rounded-full pointer-events-none z-0 mix-blend-screen opacity-50"></div>
      
      {/* 2. HEADER */}
      <header className="h-20 shrink-0 w-full flex items-center justify-between px-6 md:px-10 z-50 relative transition-all duration-500">
        
        {/* LEFT: LOGO */}
        <div className={`flex items-center gap-3 transition-all duration-700 ${isChatting ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10 pointer-events-none'}`}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                <Cpu className="text-white" size={16} />
            </div>
            <span className="text-lg font-bold tracking-[0.1em] uppercase font-mono text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">
                KrownFrame
            </span>
        </div>

        {/* RIGHT: CONTROLS (MR + RESET) */}
        <div className={`flex items-center gap-4 pl-6 border-l border-white/5 h-10 transition-all duration-500 ${isChatting ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[-20px] pointer-events-none'}`}>
          
          {/* RESET BUTTON (New) */}
          <button 
             onClick={clearHistory}
             className="group relative flex items-center justify-center w-8 h-8 rounded-md bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/50 transition-all"
             title="Clear Memory"
          >
             <Trash2 size={14} className="text-red-400 group-hover:text-red-200" />
          </button>

          <div className="hidden md:block text-right leading-tight">
             <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Operator</p>
             <p className="text-[9px] text-cyan-500/80 uppercase tracking-widest font-bold">Rank Config</p>
          </div>
          <div className="relative group">
            <div className="absolute -inset-1 bg-cyan-500/10 blur-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative flex items-center bg-white/5 border border-white/10 px-3 py-1 rounded-md hover:border-cyan-500/30 transition-colors backdrop-blur-md">
              <Shield size={14} className="text-cyan-200/70 mr-2" />
              <input 
                type="number" 
                value={mr}
                onChange={(e) => setMr(Number(e.target.value))}
                className="bg-transparent w-8 text-lg font-bold text-white/90 outline-none text-center font-mono z-50 relative"
                min="0"
                max="40"
              />
            </div>
          </div>
        </div>
      </header>

      {/* 3. MAIN CONTENT */}
      <div className="flex-1 flex overflow-hidden relative z-30">
        
        {/* LEFT DECORATION */}
        <div className={`hidden lg:flex w-20 border-r border-white/5 bg-transparent flex-col items-center justify-between py-12 shrink-0 backdrop-blur-[2px] transition-all duration-700 ${!isChatting ? 'opacity-0 -translate-x-full' : 'opacity-100 translate-x-0'}`}>
           <Server className="text-slate-600" size={18} />
           <div className="text-[10px] text-slate-700 font-mono tracking-[0.6em] uppercase whitespace-nowrap" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
              Void Link Status :: Normal
           </div>
           <div className="w-[1px] h-24 bg-gradient-to-b from-transparent via-slate-800 to-transparent"></div>
        </div>

        <div className="flex-1 flex flex-col relative max-w-5xl mx-auto w-full">
          
          {/* --- LANDING MODE --- */}
          {!isChatting && (
            <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-1000">
               
               {/* Center Logo */}
               <div className="mb-6 relative">
                  <div className="absolute -inset-10 bg-blue-500/10 blur-3xl rounded-full animate-pulse"></div>
                  <Cpu size={80} className="text-white/80 relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" />
               </div>
               
               {/* Title */}
               <h1 className="text-6xl md:text-8xl font-bold tracking-[0.1em] uppercase text-center mb-8 font-mono">
                 <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-white/80 to-white/20 drop-shadow-xl">
                   KrownFrame
                 </span>
               </h1>

               {/* --- BIG MR SELECTOR --- */}
               <div className="mb-12 relative group animate-in slide-in-from-bottom-5 duration-700 delay-200">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/30 to-blue-600/30 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                  <div className="relative flex flex-col items-center bg-black/40 border border-white/10 p-6 rounded-xl backdrop-blur-md w-[320px]">
                      <div className="flex items-center gap-2 mb-4 opacity-70">
                        <Shield size={16} className="text-cyan-400" />
                        <span className="text-xs font-mono tracking-[0.2em] uppercase text-cyan-200">Operator Mastery Rank</span>
                      </div>
                      
                      <div className="flex items-center justify-center w-full relative">
                        <button 
                          onClick={() => setMr(prev => Math.max(0, prev - 1))}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-white"
                        >
                          <ChevronRight size={24} className="rotate-180" />
                        </button>
                        
                        <input 
                          type="number" 
                          value={mr}
                          onChange={(e) => setMr(Number(e.target.value))}
                          className="bg-transparent w-24 text-5xl font-bold text-white outline-none text-center font-mono z-50 relative"
                          min="0"
                          max="40"
                        />
                        
                        <button 
                           onClick={() => setMr(prev => Math.min(40, prev + 1))}
                           className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-white"
                        >
                          <ChevronRight size={24} />
                        </button>
                      </div>
                      <div className="mt-4 h-[1px] w-full bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"></div>
                      <p className="text-[10px] text-white/30 mt-2 tracking-widest uppercase">Calibrating Response Logic</p>
                  </div>
               </div>
               
            </div>
          )}

          {/* --- CHAT MODE --- */}
          {isChatting && (
            <div className="flex-1 overflow-y-auto no-scrollbar p-4 md:p-8 space-y-6 animate-in slide-in-from-bottom-10 fade-in duration-500">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'system' && (
                    <div className="w-8 h-8 rounded-sm bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-2">
                      <Terminal size={14} className="text-cyan-200/80" />
                    </div>
                  )}
                  <div className={`max-w-[85%] md:max-w-[75%]`}>
                    <div className={`
                      p-6 text-sm md:text-[15px] leading-relaxed tracking-wide shadow-2xl backdrop-blur-xl
                      ${msg.role === 'user' 
                        ? 'bg-white/10 border border-white/10 text-white rounded-2xl rounded-tr-none' 
                        : 'bg-black/40 border-l-2 border-cyan-500/50 text-slate-200 rounded-r-2xl border-y border-r border-white/5'}
                    `}>
                      
                      {/* --- MARKDOWN WRAPPER --- */}
                      <div className="prose prose-invert prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:p-2 prose-pre:rounded-lg max-w-none">
                        <ReactMarkdown 
                          components={{
                            strong: ({node, ...props}: any) => <span className="font-bold text-cyan-300" {...props} />,
                            ul: ({node, ...props}: any) => <ul className="list-disc pl-4 space-y-1" {...props} />,
                            li: ({node, ...props}: any) => <li className="marker:text-cyan-500" {...props} />
                          }}
                        >
                          {msg.content || ""}
                        </ReactMarkdown>
                      </div>

                    </div>
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center shrink-0 mt-2">
                      <User size={14} className="text-white/70" />
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                 <div className="flex items-center gap-3 pl-14 opacity-50">
                   <Zap size={14} className="text-cyan-200 animate-pulse" />
                   <span className="text-xs text-cyan-200 font-mono tracking-[0.2em] uppercase">Thinking...</span>
                 </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* INPUT AREA */}
          <div className={`p-6 md:p-10 shrink-0 transition-all duration-700 ${!isChatting ? 'translate-y-0 max-w-3xl mx-auto w-full' : 'translate-y-0 w-full'}`}>
            <div className="relative group">
              <div className={`absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500 ${!isChatting ? 'opacity-30' : 'opacity-10'}`}></div>
              <div className="relative flex items-center bg-white/5 border border-white/10 p-3 rounded-2xl focus-within:bg-white/10 transition-all shadow-2xl backdrop-blur-xl">
                <div className="pl-5 pr-4 flex items-center border-r border-white/10 mr-2">
                  <span className="text-white/50 font-mono text-sm font-bold">{`>`}_</span>
                </div>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  className="flex-1 bg-transparent px-4 py-6 text-white placeholder-white/30 outline-none text-lg font-medium tracking-wide"
                  placeholder={!isChatting ? "Initiate Neural Link..." : "Enter command..."}
                  autoComplete="off"
                  autoFocus
                />
                <button
                  onClick={handleSend}
                  className="p-4 bg-white/5 rounded-xl hover:bg-white/20 text-white/60 transition-all ml-2"
                >
                  <Send size={24} />
                </button>
              </div>
            </div>
            {!isChatting && (
               <div className="text-center mt-8 animate-pulse">
                  <p className="text-[9px] text-white/20 uppercase tracking-[0.4em] font-mono">Gemini 3.0 // Void Link Active</p>
               </div>
            )}
          </div>
        </div>

        {/* RIGHT DECORATION */}
        <div className={`hidden lg:flex w-20 border-l border-white/5 bg-transparent flex-col items-center justify-between py-12 shrink-0 backdrop-blur-[2px] transition-all duration-700 ${!isChatting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}`}>
           <Activity className="text-slate-600" size={18} />
           <div className="h-24 w-[1px] bg-gradient-to-b from-transparent via-slate-800 to-transparent"></div>
        </div>

      </div>
    </main>
  );
}