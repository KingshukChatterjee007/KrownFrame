"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Cpu, Shield, Terminal, Zap, User, Trash2, Plus, MessageSquare, Settings, Menu, X, Wifi, Lock, Activity } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function KrownFrame() {
  const defaultState = [{ role: "system", content: "Operator, the Void link is stable. Awaiting your command." }];
  const [messages, setMessages] = useState(defaultState);
  const [input, setInput] = useState("");
  const [mr, setMr] = useState(8); 
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
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
    <div className="flex h-screen w-full overflow-hidden bg-[#020617] text-cyan-50 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* --- SIDEBAR --- */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-[#050b14]/90 backdrop-blur-2xl border-r border-white/5 transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 flex flex-col shadow-2xl
      `}>
        {/* Header */}
        <div className="h-20 flex items-center px-6 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.3)] border border-white/10">
                <Cpu className="text-white" size={16} />
             </div>
             <span className="text-lg font-bold tracking-widest uppercase font-mono text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                KrownFrame
             </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-8">
           
           {/* New Chat */}
           <button 
             onClick={clearHistory}
             className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-cyan-500/10 to-transparent hover:from-cyan-500/20 border border-cyan-500/20 rounded-xl transition-all group active:scale-95"
           >
             <Plus size={18} className="text-cyan-400 group-hover:text-cyan-200 group-hover:rotate-90 transition-transform" />
             <span className="text-sm font-medium text-cyan-100 tracking-wide">New Session</span>
           </button>

           {/* Navigation */}
           <div className="space-y-2">
              <p className="px-4 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-2">Systems</p>
              
              {/* Active Tab */}
              <div className="flex items-center justify-between px-4 py-2 bg-white/5 rounded-lg border-l-2 border-cyan-400 text-sm text-white shadow-[0_0_10px_rgba(34,211,238,0.1)]">
                 <div className="flex items-center gap-3">
                    <MessageSquare size={16} className="text-cyan-400" />
                    <span>Active Link</span>
                 </div>
                 <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></div>
              </div>

              {/* Inactive Tab */}
              <div className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 rounded-lg border-l-2 border-transparent text-sm text-slate-500 transition-colors cursor-not-allowed">
                 <Settings size={16} />
                 <span>Archives (Locked)</span>
              </div>
           </div>

           {/* MR Config */}
           <div className="bg-[#0a0f1a] rounded-xl p-5 border border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-40 transition-opacity">
                  <Shield size={40} />
              </div>
              <div className="flex items-center gap-2 mb-4 text-slate-400 relative z-10">
                 <Shield size={14} className="text-cyan-500" />
                 <span className="text-xs font-bold uppercase tracking-wider">Mastery Rank</span>
              </div>
              <div className="flex items-center justify-between bg-black/40 rounded-lg p-1.5 border border-white/10 relative z-10">
                 <button onClick={() => setMr(m => Math.max(0, m - 1))} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-md text-slate-400 hover:text-white transition active:scale-90">-</button>
                 <span className="font-mono text-xl font-bold text-cyan-100">{mr}</span>
                 <button onClick={() => setMr(m => Math.min(40, m + 1))} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-md text-slate-400 hover:text-white transition active:scale-90">+</button>
              </div>
           </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5">
           <button 
             onClick={clearHistory}
             className="flex items-center gap-2 text-xs text-red-400/60 hover:text-red-400 transition-colors w-full justify-center hover:bg-red-500/5 py-2 rounded-lg"
           >
             <Trash2 size={12} />
             <span>Sever Connection</span>
           </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex flex-col relative bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0f172a] via-[#020617] to-black">
         
         {/* Mobile Header */}
         <div className="md:hidden h-16 flex items-center justify-between px-4 border-b border-white/5 bg-[#020617]">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white">
               {sidebarOpen ? <X /> : <Menu />}
            </button>
            <span className="font-bold text-white tracking-widest">KROWNFRAME</span>
            <div className="w-6"></div>
         </div>

         {/* 1. LANDING MODE */}
         {!isChatting && (
            <div className="flex-1 flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in duration-700">
               <div className="relative mb-8 group cursor-default">
                  <div className="absolute -inset-10 bg-cyan-500/20 blur-[60px] rounded-full group-hover:bg-cyan-500/30 transition-all duration-1000"></div>
                  <Cpu size={80} className="text-white relative z-10 drop-shadow-[0_0_25px_rgba(255,255,255,0.3)]" />
               </div>
               
               <h1 className="text-4xl md:text-6xl font-bold text-white mb-3 text-center tracking-tight">
                  How can I assist you, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-500">Operator?</span>
               </h1>
               
               <p className="text-slate-400 text-sm tracking-widest max-w-lg text-center mb-12 opacity-70 font-mono">
                  VOID LINK ACTIVE & MR {mr} CONFIGURATION LOADED
               </p>

               {/* NEW: SYSTEM STATUS DISPLAY (Non-interactive visuals) */}
               <div className="flex flex-wrap justify-center gap-6 animate-in slide-in-from-bottom-4 fade-in duration-1000 delay-200">
                  
                  {/* Status Module 1 */}
                  <div className="flex items-center gap-3 px-5 py-2 bg-white/5 border border-white/10 rounded-full">
                     <div className="relative">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                        <div className="absolute inset-0 w-2 h-2 bg-emerald-400 rounded-full animate-ping opacity-20"></div>
                     </div>
                     <div className="text-xs font-mono text-emerald-200/80 tracking-widest uppercase">
                        Signal: Strong
                     </div>
                  </div>

                  {/* Status Module 2 */}
                  <div className="flex items-center gap-3 px-5 py-2 bg-white/5 border border-white/10 rounded-full">
                     <Activity size={12} className="text-cyan-400" />
                     <div className="text-xs font-mono text-cyan-200/80 tracking-widest uppercase">
                        Core: Stable
                     </div>
                  </div>

                  {/* Status Module 3 */}
                  <div className="flex items-center gap-3 px-5 py-2 bg-white/5 border border-white/10 rounded-full">
                     <Lock size={12} className="text-indigo-400" />
                     <div className="text-xs font-mono text-indigo-200/80 tracking-widest uppercase">
                        Protocol: Encrypted
                     </div>
                  </div>

               </div>
            </div>
         )}

         {/* 2. CHAT MODE */}
         {isChatting && (
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth">
               {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-500`}>
                     {msg.role === 'system' && (
                        <div className="w-8 h-8 rounded-full bg-[#0f172a] border border-cyan-500/20 flex items-center justify-center shrink-0 mt-1 shadow-[0_0_10px_rgba(6,182,212,0.1)]">
                           <Terminal size={14} className="text-cyan-400" />
                        </div>
                     )}
                     
                     <div className={`
                        max-w-[85%] md:max-w-[70%] p-5 rounded-2xl text-sm md:text-[15px] leading-relaxed shadow-xl backdrop-blur-md
                        ${msg.role === 'user' 
                           ? 'bg-blue-600/90 text-white rounded-tr-sm border border-blue-400/20' 
                           : 'bg-[#111827]/80 border border-white/10 text-slate-200 rounded-tl-sm'}
                     `}>
                        <div className="prose prose-invert prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:p-2 prose-pre:rounded-lg max-w-none">
                           <ReactMarkdown 
                              components={{
                                 strong: ({node, ...props}: any) => <span className="font-bold text-cyan-200" {...props} />,
                                 ul: ({node, ...props}: any) => <ul className="list-disc pl-4 space-y-1" {...props} />,
                                 li: ({node, ...props}: any) => <li className="marker:text-cyan-500" {...props} />
                              }}
                           >
                              {msg.content || ""}
                           </ReactMarkdown>
                        </div>
                     </div>

                     {msg.role === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mt-1 shadow-lg">
                           <User size={14} className="text-white" />
                        </div>
                     )}
                  </div>
               ))}
               {loading && (
                  <div className="flex items-center gap-3 pl-14 opacity-60">
                     <div className="flex space-x-1">
                        <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce"></div>
                     </div>
                     <span className="text-xs text-cyan-400 font-mono tracking-widest uppercase">Computing</span>
                  </div>
               )}
               <div ref={messagesEndRef} />
            </div>
         )}

         {/* 3. INPUT AREA */}
         <div className="p-4 md:p-6 shrink-0 z-20">
            <div className="max-w-4xl mx-auto relative group">
               <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/50 to-blue-600/50 rounded-2xl blur opacity-10 group-hover:opacity-30 transition duration-500"></div>
               <div className="relative flex items-center bg-[#0b1221]/90 border border-white/10 p-2 rounded-2xl focus-within:border-cyan-500/30 transition-all shadow-2xl backdrop-blur-xl">
                  <input
                     value={input}
                     onChange={(e) => setInput(e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                     className="flex-1 bg-transparent px-5 py-3 text-white placeholder-slate-500 outline-none text-base"
                     placeholder={!isChatting ? "Ask KrownFrame for assistance..." : "Ask a follow-up..."}
                     autoComplete="off"
                     autoFocus
                  />
                  <button
                     onClick={() => handleSend()}
                     disabled={!input.trim()}
                     className={`p-3 rounded-xl transition-all shadow-lg ${input.trim() ? 'bg-cyan-600 hover:bg-cyan-500 text-white' : 'bg-white/5 text-slate-500 cursor-not-allowed'}`}
                  >
                     <Send size={18} />
                  </button>
               </div>
               <div className="text-center mt-3">
                  <p className="text-[10px] text-slate-600 font-mono tracking-widest uppercase opacity-60">
                     KrownFrame v1.0 // System Online
                  </p>
               </div>
            </div>
         </div>

      </main>
    </div>
  );
}