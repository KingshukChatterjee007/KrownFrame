"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Cpu, User, Shield, Terminal, Activity, Zap, Server } from "lucide-react";

export default function KrownFrame() {
  const [messages, setMessages] = useState([
    { role: "system", content: "Operator, the Void link is stable. Awaiting your command." }
  ]);
  const [input, setInput] = useState("");
  const [mr, setMr] = useState(8); 
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    <main className="h-screen w-full flex flex-col relative overflow-hidden bg-[#020617] text-gray-200 font-sans">
      
      {/* 1. BACKGROUND FX */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#1e3a8a_0%,#0f172a_40%,#000000_100%)] z-0 pointer-events-none"></div>
      <div className="absolute top-[-10%] left-[10%] w-[600px] h-[600px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none z-0"></div>
      
      {/* 2. HEADER */}
      <header className="h-20 shrink-0 w-full border-b border-white/10 bg-black/40 backdrop-blur-xl flex items-center justify-between px-6 z-50 shadow-lg relative">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-700 flex items-center justify-center border border-white/10 shadow-[0_0_15px_rgba(8,145,178,0.5)]">
            <Cpu className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-[0.2em] text-white uppercase drop-shadow-md">
              Krown<span className="text-cyan-400">Frame</span>
            </h1>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              <p className="text-[10px] text-cyan-500/80 tracking-[0.3em] uppercase font-bold">System Online</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 pl-6 border-l border-white/10 h-12">
          <div className="hidden md:block text-right leading-tight">
             <p className="text-[9px] text-blue-300/50 uppercase tracking-widest font-bold">Operator</p>
             <p className="text-[9px] text-cyan-400 uppercase tracking-widest font-bold">Rank Config</p>
          </div>
          <div className="relative group">
            <div className="absolute -inset-1 bg-cyan-500/20 blur-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative flex items-center bg-[#0B1120] border border-blue-500/30 px-3 py-1 rounded-md hover:border-cyan-400/60 transition-colors">
              <Shield size={16} className="text-amber-400 mr-2" />
              <input 
                type="number" 
                value={mr}
                onChange={(e) => setMr(Number(e.target.value))}
                className="bg-transparent w-8 text-xl font-bold text-white outline-none text-center font-mono z-50 relative"
                min="0"
                max="40"
              />
            </div>
          </div>
        </div>
      </header>

      {/* 3. MAIN CONTENT */}
      <div className="flex-1 flex overflow-hidden relative z-30">
        <div className="hidden lg:flex w-20 border-r border-white/5 bg-black/10 flex-col items-center justify-between py-12 shrink-0 backdrop-blur-sm">
           <Server className="text-blue-500/30" size={18} />
           <div className="text-[10px] text-blue-500/40 font-mono tracking-[0.6em] uppercase whitespace-nowrap" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
              Void Link Status :: Normal
           </div>
           <div className="w-[1px] h-24 bg-gradient-to-b from-transparent via-blue-500/30 to-transparent"></div>
        </div>

        <div className="flex-1 flex flex-col relative max-w-6xl mx-auto w-full">
          
          {/* CHAT AREA - HIDDEN SCROLLBAR */}
          <div className="flex-1 overflow-y-auto no-scrollbar p-4 md:p-8 space-y-6">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                {msg.role === 'system' && (
                  <div className="w-8 h-8 rounded-sm bg-cyan-950/40 border border-cyan-500/20 flex items-center justify-center shrink-0 mt-2 shadow-[0_0_10px_rgba(8,145,178,0.2)]">
                    <Terminal size={14} className="text-cyan-400" />
                  </div>
                )}
                <div className={`max-w-[85%] md:max-w-[75%]`}>
                  <div className={`
                    p-6 text-sm md:text-[15px] leading-relaxed tracking-wide shadow-2xl backdrop-blur-md
                    ${msg.role === 'user' 
                      ? 'bg-gradient-to-br from-[#1e1b4b]/80 to-[#312e81]/50 border border-indigo-500/30 text-indigo-50 rounded-2xl rounded-tr-none' 
                      : 'bg-[#0f172a]/70 border-l-2 border-cyan-500 text-slate-200 rounded-r-2xl border-y border-r border-white/5'}
                  `}>
                    <p className="whitespace-pre-wrap font-medium">{msg.content}</p>
                  </div>
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-indigo-900/40 border border-indigo-500/20 flex items-center justify-center shrink-0 mt-2">
                    <User size={14} className="text-indigo-300" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
               <div className="flex items-center gap-3 pl-14 opacity-70">
                 <Zap size={14} className="text-cyan-400 animate-pulse" />
                 <span className="text-xs text-cyan-400 font-mono tracking-[0.2em] uppercase">Accessing Arsenal DB...</span>
               </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-6 md:p-8 shrink-0">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
              <div className="relative flex items-center bg-[#0a0f1e]/90 border border-white/10 p-2 rounded-xl focus-within:bg-[#0f172a] transition-all">
                <div className="pl-4 pr-3 flex items-center border-r border-white/5 mr-2">
                  <span className="text-cyan-500/70 font-mono text-xs font-bold">{`>`}_</span>
                </div>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  className="flex-1 bg-transparent px-2 py-4 text-white placeholder-slate-500 outline-none text-sm font-medium tracking-wide"
                  placeholder="Enter command (e.g., 'Arcane Concentration stats', 'Uriel build')..."
                  autoComplete="off"
                />
                <button
                  onClick={handleSend}
                  className="p-3 bg-white/5 rounded-lg hover:bg-white/10 text-white transition-all ml-2"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden lg:flex w-20 border-l border-white/5 bg-black/10 flex-col items-center justify-between py-12 shrink-0 backdrop-blur-sm">
           <Activity className="text-blue-500/30" size={18} />
           <div className="h-24 w-[1px] bg-gradient-to-b from-transparent via-cyan-500/30 to-transparent"></div>
        </div>

      </div>
    </main>
  );
}