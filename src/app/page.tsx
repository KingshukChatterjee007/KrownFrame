"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Cpu, Shield, Terminal, Zap, User, Trash2, Plus, MessageSquare, Settings, Menu, X, Lock, Activity, ChevronRight } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function KrownFrame() {
  const defaultState = [{ role: "system", content: "Operator, the Void link is stable. Awaiting your command." }];
  const [messages, setMessages] = useState(defaultState);
  const [input, setInput] = useState("");
  const [mr, setMr] = useState(8); 
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Closed by default on mobile
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Determine if we are on desktop to keep sidebar open by default there
    if (window.innerWidth >= 768) {
      setSidebarOpen(true);
    }

    const saved = localStorage.getItem("krownframe-history");
    const savedMr = localStorage.getItem("krownframe-mr");
    if (saved) { try { setMessages(JSON.parse(saved)); } catch (e) { console.error(e); } }
    if (savedMr) setMr(Number(savedMr));
  }, []);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem("krownframe-history", JSON.stringify(messages));
      localStorage.setItem("krownframe-mr", String(mr));
    }
  }, [messages, mr, isClient]);

  const clearHistory = () => {
    if (confirm("Sever Void Link? This will wipe your memory.")) {
      setMessages(defaultState);
      localStorage.removeItem("krownframe-history");
      if (window.innerWidth < 768) setSidebarOpen(false); // Close sidebar on mobile after action
    }
  };

  const isChatting = messages.length > 1;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages]);

  const handleSend = async (text = input) => {
    if (!text.trim()) return;
    const userText = text;
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

  if (!isClient) return null;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-black text-cyan-50 font-sans selection:bg-cyan-500/30 selection:text-cyan-200 p-0 md:p-4 gap-0 md:gap-4 relative">
      
      {/* --- CUSTOM ANIMATION STYLES --- */}
      <style jsx>{`
        @keyframes gradient-x {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-text {
          background-size: 200% auto;
          animation: gradient-x 3s ease infinite;
        }
      `}</style>

      {/* --- MOBILE OVERLAY (Darken background when menu is open) --- */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* --- SIDEBAR (Slide-over on Mobile / Floating on Desktop) --- */}
      <aside className={`
        fixed md:relative inset-y-0 left-0 z-50 w-[85%] max-w-[300px] md:w-72 h-full
        bg-zinc-950/95 backdrop-blur-xl border-r border-white/10 md:border-none
        transform transition-transform duration-300 ease-in-out shadow-2xl
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 md:flex flex-col
        md:bg-zinc-950/90 md:rounded-3xl md:border md:shadow-2xl
      `}>
        {/* Header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent md:rounded-t-3xl">
          <div className="flex items-center gap-3 group cursor-default">
             <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.05)] group-hover:border-zinc-500 transition-colors">
                <Cpu className="text-white group-hover:animate-pulse" size={18} />
             </div>
             <div>
                <span className="block text-base font-bold tracking-[0.15em] uppercase font-mono text-white">
                    KrownFrame
                </span>
                <span className="block text-[9px] text-zinc-500 tracking-widest">SYSTEM V1.0</span>
             </div>
          </div>
          {/* Close Button (Mobile Only) */}
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-zinc-500 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-8">
           
           {/* New Chat Button */}
           <button 
             onClick={() => {
               clearHistory();
               if(window.innerWidth < 768) setSidebarOpen(false);
             }}
             className="w-full flex items-center justify-between px-5 py-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-2xl transition-all group active:scale-[0.98]"
           >
             <div className="flex items-center gap-3">
               <Plus size={18} className="text-zinc-400 group-hover:text-white transition-colors" />
               <span className="text-sm font-medium text-zinc-300 group-hover:text-white tracking-wide">New Session</span>
             </div>
             <ChevronRight size={14} className="text-zinc-600 group-hover:translate-x-1 transition-transform" />
           </button>

           {/* Navigation Links */}
           <div className="space-y-3">
              <p className="px-2 text-[9px] uppercase tracking-[0.2em] text-zinc-600 font-bold mb-2">Navigation</p>
              
              {/* Active Tab */}
              <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 rounded-xl border border-white/10 shadow-lg relative overflow-hidden group">
                 <div className="absolute left-0 top-0 bottom-0 w-1 bg-white"></div>
                 <div className="flex items-center gap-3 z-10">
                    <MessageSquare size={16} className="text-white" />
                    <span className="text-sm font-medium text-white">Active Link</span>
                 </div>
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse"></div>
              </div>

              {/* Inactive Tab */}
              <div className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl border border-transparent hover:border-white/5 text-sm text-zinc-500 transition-colors cursor-not-allowed opacity-60">
                 <Settings size={16} />
                 <span>Archives (Locked)</span>
              </div>
           </div>

           {/* MR Config */}
           <div className="mt-auto">
              <p className="px-2 text-[9px] uppercase tracking-[0.2em] text-zinc-600 font-bold mb-3">Operator Config</p>
              <div className="bg-gradient-to-b from-zinc-900 to-black rounded-2xl p-5 border border-white/10 relative overflow-hidden group shadow-2xl">
                 <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-[40px] group-hover:bg-white/10 transition-all duration-700"></div>
                 <div className="flex justify-between items-start mb-6 relative z-10">
                    <div className="flex flex-col">
                       <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Mastery Rank</span>
                       <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold text-white font-mono tracking-tighter">{mr}</span>
                          <span className="text-3xl font-bold text-white/20 font-mono">/</span>
                          <span className="text-[10px] text-zinc-600">LVL</span>
                       </div>
                    </div>
                    <Shield size={20} className="text-zinc-600 group-hover:text-white transition-colors" />
                 </div>
                 <div className="flex items-center gap-2 relative z-10">
                    <button 
                       onClick={() => setMr(m => Math.max(0, m - 1))} 
                       className="flex-1 h-9 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-zinc-400 hover:text-white transition active:scale-95"
                    >
                       -
                    </button>
                    <button 
                       onClick={() => setMr(m => Math.min(40, m + 1))} 
                       className="flex-1 h-9 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-zinc-400 hover:text-white transition active:scale-95"
                    >
                       +
                    </button>
                 </div>
              </div>
           </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 bg-black/20 md:rounded-b-3xl">
           <button 
             onClick={() => {
                clearHistory();
                if(window.innerWidth < 768) setSidebarOpen(false);
             }}
             className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest text-zinc-600 hover:text-red-400 transition-colors w-full group"
           >
             <Trash2 size={12} className="group-hover:animate-bounce" />
             <span>Sever Connection</span>
           </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT (Full Screen Mobile / Floating Desktop) --- */}
      <main className="flex-1 flex flex-col relative bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black md:rounded-3xl md:border md:border-white/5 overflow-hidden shadow-2xl">
         
         {/* Mobile Header (Only visible on small screens) */}
         <div className="md:hidden h-16 flex items-center justify-between px-4 border-b border-white/5 bg-black/90 backdrop-blur-md shrink-0">
            <button onClick={() => setSidebarOpen(true)} className="text-white p-2">
               <Menu />
            </button>
            <span className="font-bold text-white tracking-widest text-sm">KROWNFRAME</span>
            <div className="w-8"></div> {/* Spacer for balance */}
         </div>

         {/* 1. LANDING MODE */}
         {!isChatting && (
            <div className="flex-1 flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in duration-700">
               <div className="relative mb-6 md:mb-8 group cursor-default scale-75 md:scale-100">
                  <div className="absolute -inset-10 bg-white/5 blur-[60px] rounded-full group-hover:bg-white/10 transition-all duration-1000"></div>
                  <Cpu size={80} className="text-white relative z-10 drop-shadow-[0_0_30px_rgba(255,255,255,0.15)]" />
               </div>
               
               <h1 className="text-3xl md:text-6xl font-bold text-white mb-3 text-center tracking-tight leading-tight">
                  How can I assist you, <br className="md:hidden"/>
                  <span className="md:ml-3 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-cyan-400 animate-gradient-text drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">
                     Operator?
                  </span>
               </h1>
               
               <p className="text-zinc-500 text-xs md:text-sm tracking-widest max-w-lg text-center mb-8 md:mb-12 opacity-70 font-mono">
                  VOID LINK ACTIVE & MR {mr} CONFIGURATION LOADED
               </p>

               {/* SYSTEM STATUS DISPLAY */}
               <div className="flex flex-wrap justify-center gap-3 md:gap-6 animate-in slide-in-from-bottom-4 fade-in duration-1000 delay-200">
                  <div className="flex items-center gap-2 md:gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-full">
                     <div className="relative">
                        <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        <div className="absolute inset-0 w-1.5 h-1.5 md:w-2 md:h-2 bg-emerald-500 rounded-full animate-ping opacity-20"></div>
                     </div>
                     <div className="text-[10px] md:text-xs font-mono text-emerald-200/80 tracking-widest uppercase">Signal: Strong</div>
                  </div>

                  <div className="flex items-center gap-2 md:gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-full">
                     <Activity size={12} className="text-zinc-400" />
                     <div className="text-[10px] md:text-xs font-mono text-zinc-400 tracking-widest uppercase">Core: Stable</div>
                  </div>

                  <div className="flex items-center gap-2 md:gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-full hidden sm:flex">
                     <Lock size={12} className="text-zinc-400" />
                     <div className="text-[10px] md:text-xs font-mono text-zinc-400 tracking-widest uppercase">Protocol: Secure</div>
                  </div>
               </div>
            </div>
         )}

         {/* 2. CHAT MODE */}
         {isChatting && (
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8 scroll-smooth">
               {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-3 md:gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-500`}>
                     {msg.role === 'system' && (
                        <div className="w-8 h-8 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center shrink-0 mt-1">
                           <Terminal size={14} className="text-zinc-400" />
                        </div>
                     )}
                     
                     <div className={`
                        max-w-[85%] md:max-w-[70%] p-4 md:p-5 rounded-2xl text-sm md:text-[15px] leading-relaxed shadow-xl backdrop-blur-md
                        ${msg.role === 'user' 
                           ? 'bg-white text-black rounded-tr-sm border border-white/20' 
                           : 'bg-zinc-900/80 border border-white/10 text-zinc-300 rounded-tl-sm'}
                     `}>
                        <div className="prose prose-invert prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:p-2 prose-pre:rounded-lg max-w-none">
                           <ReactMarkdown 
                              components={{
                                 strong: ({node, ...props}: any) => <span className="font-bold text-white" {...props} />,
                                 ul: ({node, ...props}: any) => <ul className="list-disc pl-4 space-y-1" {...props} />,
                                 li: ({node, ...props}: any) => <li className="marker:text-zinc-500" {...props} />
                              }}
                           >
                              {msg.content || ""}
                           </ReactMarkdown>
                        </div>
                     </div>

                     {msg.role === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 mt-1 shadow-lg">
                           <User size={14} className="text-black" />
                        </div>
                     )}
                  </div>
               ))}
               {loading && (
                  <div className="flex items-center gap-3 pl-12 opacity-60">
                     <div className="flex space-x-1">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></div>
                     </div>
                     <span className="text-xs text-zinc-500 font-mono tracking-widest uppercase">Computing</span>
                  </div>
               )}
               <div ref={messagesEndRef} />
            </div>
         )}

         {/* 3. INPUT AREA (Tactical Glass Console) */}
         <div className="p-4 md:p-8 shrink-0 z-20 pb-6 md:pb-8">
            <div className="max-w-4xl mx-auto relative group">
               {/* Outer Glow */}
               <div className="absolute -inset-1 bg-gradient-to-r from-zinc-700/30 to-zinc-800/30 rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition duration-700"></div>
               
               {/* Main Input Console */}
               <div className="relative flex items-center bg-zinc-900/60 border border-white/10 p-2 md:p-4 rounded-[1.5rem] md:rounded-[2rem] focus-within:border-white/40 focus-within:bg-zinc-900/80 transition-all shadow-[0_0_30px_rgba(0,0,0,0.5)] backdrop-blur-3xl">
                  <input
                     value={input}
                     onChange={(e) => setInput(e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                     className="flex-1 bg-transparent px-3 md:px-4 py-2 text-white placeholder-zinc-500 outline-none text-base md:text-lg font-medium tracking-wide"
                     placeholder={!isChatting ? "KrownFrame is ready..." : "Ask..."}
                     autoComplete="off"
                  />
                  <button
                     onClick={() => handleSend()}
                     disabled={!input.trim()}
                     className={`p-3 md:p-4 rounded-xl md:rounded-2xl transition-all shadow-lg shrink-0 ${input.trim() ? 'bg-white hover:bg-zinc-200 text-black scale-105' : 'bg-white/5 text-zinc-600 cursor-not-allowed'}`}
                  >
                     <Send size={18} className="md:w-5 md:h-5" />
                  </button>
               </div>
               
               <div className="text-center mt-3 md:mt-4">
                  <p className="text-[9px] md:text-[10px] text-zinc-700 font-mono tracking-[0.2em] uppercase opacity-60">
                     KrownFrame v1.0 // System Online
                  </p>
               </div>
            </div>
         </div>

      </main>
    </div>
  );
}