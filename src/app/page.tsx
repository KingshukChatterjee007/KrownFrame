"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Cpu, Shield, Terminal, Activity, Zap, Server, User } from "lucide-react";

export default function KrownFrame() {
  const [messages, setMessages] = useState([
    { role: "system", content: "Operator, the Void link is stable. Prime directives loaded." }
  ]);
  const [input, setInput] = useState("");
  const [mr, setMr] = useState(8); 
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check if conversation has started (more than just the system greeting)
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

  return (
    <main className="h-screen w-full flex flex-col relative overflow-hidden bg-[#0c0a09] text-stone-200 font-sans selection:bg-amber-500/30 selection:text-amber-200">
      
      {/* 1. BACKGROUND FX */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#292524_0%,#0c0a09_40%,#000000_100%)] z-0 pointer-events-none"></div>
      <div className="absolute top-[-10%] left-[10%] w-[600px] h-[600px] bg-amber-600/10 blur-[120px] rounded-full pointer-events-none z-0"></div>
      
      {/* 2. HEADER - Minimalist (Only MR on Right) */}
      <header className="h-20 shrink-0 w-full flex items-center justify-end px-10 z-50 relative">
        <div className="flex items-center gap-4 pl-6 border-l border-white/10 h-10">
          <div className="hidden md:block text-right leading-tight">
             <p className="text-[9px] text-stone-500 uppercase tracking-widest font-bold">Operator</p>
             <p className="text-[9px] text-amber-500 uppercase tracking-widest font-bold">Rank Config</p>
          </div>
          <div className="relative group">
            <div className="absolute -inset-1 bg-amber-500/20 blur-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative flex items-center bg-[#1c1917] border border-amber-500/30 px-3 py-1 rounded-md hover:border-amber-400/60 transition-colors">
              <Shield size={14} className="text-white mr-2" />
              <input 
                type="number" 
                value={mr}
                onChange={(e) => setMr(Number(e.target.value))}
                className="bg-transparent w-8 text-lg font-bold text-white outline-none text-center font-mono z-50 relative"
                min="0"
                max="40"
              />
            </div>
          </div>
        </div>
      </header>

      {/* 3. MAIN CONTENT */}
      <div className="flex-1 flex overflow-hidden relative z-30">
        
        {/* LEFT DECORATION (Hidden in Landing Mode for clean look) */}
        <div className={`hidden lg:flex w-20 border-r border-white/5 bg-black/10 flex-col items-center justify-between py-12 shrink-0 backdrop-blur-sm transition-all duration-700 ${!isChatting ? 'opacity-0 -translate-x-full' : 'opacity-100 translate-x-0'}`}>
           <Server className="text-amber-500/30" size={18} />
           <div className="text-[10px] text-amber-500/40 font-mono tracking-[0.6em] uppercase whitespace-nowrap" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
              Void Link Status :: Prime
           </div>
           <div className="w-[1px] h-24 bg-gradient-to-b from-transparent via-amber-500/30 to-transparent"></div>
        </div>

        <div className="flex-1 flex flex-col relative max-w-5xl mx-auto w-full">
          
          {/* --- LANDING MODE: HERO SECTION --- */}
          {!isChatting && (
            <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-1000">
               {/* Center Logo */}
               <div className="mb-8 relative">
                  <div className="absolute -inset-10 bg-amber-500/10 blur-3xl rounded-full animate-pulse"></div>
                  <Cpu size={80} className="text-amber-500 relative z-10 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
               </div>
               
               {/* Main Title */}
               <h1 className="text-6xl md:text-8xl font-bold tracking-[0.1em] text-white uppercase text-center mb-4 font-mono">
                 Krown<span className="text-transparent bg-clip-text bg-gradient-to-b from-amber-300 to-amber-700">Frame</span>
               </h1>
               
               {/* Subtitle / Status */}
               <div className="flex items-center gap-4 opacity-60">
                  <div className="h-[1px] w-12 bg-amber-500/50"></div>
                  <span className="text-xs font-mono tracking-[0.4em] uppercase text-amber-500">System Status :: Normal</span>
                  <div className="h-[1px] w-12 bg-amber-500/50"></div>
               </div>
            </div>
          )}

          {/* --- CHAT MODE: MESSAGES --- */}
          {isChatting && (
            <div className="flex-1 overflow-y-auto no-scrollbar p-4 md:p-8 space-y-6 animate-in slide-in-from-bottom-10 fade-in duration-500">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'system' && (
                    <div className="w-8 h-8 rounded-sm bg-stone-900 border border-amber-500/20 flex items-center justify-center shrink-0 mt-2 shadow-[0_0_10px_rgba(245,158,11,0.1)]">
                      <Terminal size={14} className="text-amber-400" />
                    </div>
                  )}
                  <div className={`max-w-[85%] md:max-w-[75%]`}>
                    <div className={`
                      p-6 text-sm md:text-[15px] leading-relaxed tracking-wide shadow-2xl backdrop-blur-md
                      ${msg.role === 'user' 
                        ? 'bg-gradient-to-br from-stone-800 to-stone-900 border border-white/10 text-stone-100 rounded-2xl rounded-tr-none' 
                        : 'bg-[#1c1917]/80 border-l-2 border-amber-500 text-stone-200 rounded-r-2xl border-y border-r border-white/5'}
                    `}>
                      <p className="whitespace-pre-wrap font-medium">{msg.content}</p>
                    </div>
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-stone-800 border border-white/10 flex items-center justify-center shrink-0 mt-2">
                      <User size={14} className="text-stone-400" />
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                 <div className="flex items-center gap-3 pl-14 opacity-70">
                   <Zap size={14} className="text-amber-400 animate-pulse" />
                   <span className="text-xs text-amber-400 font-mono tracking-[0.2em] uppercase">Processing...</span>
                 </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* INPUT AREA */}
          <div className={`p-6 md:p-10 shrink-0 transition-all duration-700 ${!isChatting ? 'translate-y-0 max-w-2xl mx-auto w-full' : 'translate-y-0 w-full'}`}>
            <div className="relative group">
              <div className={`absolute -inset-0.5 bg-gradient-to-r from-amber-600 to-yellow-600 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500 ${!isChatting ? 'opacity-40' : 'opacity-20'}`}></div>
              <div className="relative flex items-center bg-[#0c0a09]/90 border border-white/10 p-2 rounded-xl focus-within:bg-[#1c1917] transition-all shadow-2xl">
                <div className="pl-4 pr-3 flex items-center border-r border-white/5 mr-2">
                  <span className="text-amber-500/70 font-mono text-xs font-bold">{`>`}_</span>
                </div>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  className="flex-1 bg-transparent px-2 py-4 text-white placeholder-stone-500 outline-none text-sm font-medium tracking-wide"
                  placeholder={!isChatting ? "Initiate Neural Link..." : "Enter command..."}
                  autoComplete="off"
                  autoFocus
                />
                <button
                  onClick={handleSend}
                  className="p-3 bg-white/5 rounded-lg hover:bg-amber-600/20 hover:text-amber-400 text-stone-400 transition-all ml-2"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
            {/* Footer Text (Only visible in landing mode) */}
            {!isChatting && (
               <div className="text-center mt-6 animate-pulse">
                  <p className="text-[9px] text-stone-600 uppercase tracking-[0.4em] font-mono">Gemini 3.0 // Void Link Active</p>
               </div>
            )}
          </div>
        </div>

        {/* RIGHT DECORATION (Hidden in Landing Mode) */}
        <div className={`hidden lg:flex w-20 border-l border-white/5 bg-black/10 flex-col items-center justify-between py-12 shrink-0 backdrop-blur-sm transition-all duration-700 ${!isChatting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}`}>
           <Activity className="text-amber-500/30" size={18} />
           <div className="h-24 w-[1px] bg-gradient-to-b from-transparent via-amber-500/30 to-transparent"></div>
        </div>

      </div>
    </main>
  );
}