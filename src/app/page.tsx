"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Cpu, Shield, Terminal, Zap, User, Trash2, Plus, MessageSquare, Settings, Menu, X } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function KrownFrame() {
  const defaultState = [{ role: "system", content: "Operator, the Void link is stable. Awaiting your command." }];
  const [messages, setMessages] = useState(defaultState);
  const [input, setInput] = useState("");
  const [mr, setMr] = useState(8); 
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true); // For mobile toggle
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);

  // --- LOAD & SAVE LOGIC ---
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
      // Don't reload, just reset state
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

  if (!isClient) return null;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#020617] text-cyan-50 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* --- SIDEBAR (Glass Dashboard Style) --- */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-black/40 backdrop-blur-xl border-r border-white/5 transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 flex flex-col
      `}>
        {/* Sidebar Header */}
        <div className="h-20 flex items-center px-6 border-b border-white/5">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                <Cpu className="text-white" size={16} />
             </div>
             <span className="text-lg font-bold tracking-widest uppercase font-mono text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">
                KrownFrame
             </span>
          </div>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
           
           {/* New Chat Button */}
           <button 
             onClick={clearHistory}
             className="w-full flex items-center gap-3 px-4 py-3 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 rounded-xl transition-all group"
           >
             <Plus size={18} className="text-cyan-400 group-hover:text-cyan-200" />
             <span className="text-sm font-medium text-cyan-100">New Session</span>
           </button>

           {/* Navigation Section */}
           <div className="space-y-1">
              <p className="px-4 text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Systems</p>
              <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-lg border border-white/5 text-sm text-slate-200">
                 <MessageSquare size={16} />
                 <span>Active Link</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 rounded-lg text-sm text-slate-400 transition-colors cursor-not-allowed opacity-50">
                 <Settings size={16} />
                 <span>Archives (Locked)</span>
              </div>
           </div>

           {/* MR Config (Moved to Sidebar!) */}
           <div className="bg-black/40 rounded-xl p-4 border border-white/5">
              <div className="flex items-center gap-2 mb-3 text-slate-400">
                 <Shield size={14} />
                 <span className="text-xs font-bold uppercase tracking-wider">Mastery Rank</span>
              </div>
              <div className="flex items-center justify-between bg-white/5 rounded-lg p-1 border border-white/10">
                 <button onClick={() => setMr(m => Math.max(0, m - 1))} className="p-2 hover:bg-white/10 rounded-md text-slate-400 hover:text-white transition">-</button>
                 <span className="font-mono text-xl font-bold text-cyan-300">{mr}</span>
                 <button onClick={() => setMr(m => Math.min(40, m + 1))} className="p-2 hover:bg-white/10 rounded-md text-slate-400 hover:text-white transition">+</button>
              </div>
           </div>

        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/5">
           <button 
             onClick={clearHistory}
             className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300 transition-colors w-full justify-center opacity-60 hover:opacity-100"
           >
             <Trash2 size={12} />
             <span>Sever Connection</span>
           </button>
        </div>
      </aside>


      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 flex flex-col relative bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0f172a] via-[#020617] to-black">
         
         {/* Mobile Header */}
         <div className="md:hidden h-16 flex items-center justify-between px-4 border-b border-white/5">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white">
               {sidebarOpen ? <X /> : <Menu />}
            </button>
            <span className="font-bold text-white">KROWNFRAME</span>
            <div className="w-6"></div>
         </div>

         {/* 1. LANDING MODE (Only if not chatting) */}
         {!isChatting && (
            <div className="flex-1 flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in duration-700">
               <div className="relative mb-8">
                  <div className="absolute -inset-10 bg-cyan-500/20 blur-[60px] rounded-full"></div>
                  <Cpu size={80} className="text-white relative z-10 drop-shadow-2xl" />
               </div>
               <h1 className="text-4xl md:text-6xl font-bold text-white mb-2 text-center tracking-tight">
                  How can I assist you, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">Operator?</span>
               </h1>
               <p className="text-slate-400 text-sm md:text-base tracking-wide max-w-lg text-center mb-8">
                  Void Link Active & MR {mr} Configuration Loaded
               </p>
            </div>
         )}

         {/* 2. CHAT MODE (Scrollable Area) */}
         {isChatting && (
            <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-6 scroll-smooth">
               {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                     {msg.role === 'system' && (
                        <div className="w-8 h-8 rounded-full bg-cyan-900/30 border border-cyan-500/30 flex items-center justify-center shrink-0 mt-1">
                           <Terminal size={14} className="text-cyan-300" />
                        </div>
                     )}
                     
                     <div className={`
                        max-w-[85%] md:max-w-[70%] p-5 rounded-2xl text-sm md:text-[15px] leading-relaxed shadow-xl
                        ${msg.role === 'user' 
                           ? 'bg-blue-600 text-white rounded-tr-sm' 
                           : 'bg-[#1e293b]/60 border border-white/5 backdrop-blur-md text-slate-200 rounded-tl-sm'}
                     `}>
                        {/* MARKDOWN RENDERER */}
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

                     {msg.role === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mt-1">
                           <User size={14} className="text-white" />
                        </div>
                     )}
                  </div>
               ))}
               {loading && (
                  <div className="flex items-center gap-2 pl-12 opacity-50">
                     <Zap size={14} className="text-cyan-400 animate-pulse" />
                     <span className="text-xs text-cyan-400 font-mono">Thinking...</span>
                  </div>
               )}
               <div ref={messagesEndRef} />
            </div>
         )}

         {/* 3. INPUT AREA (Floating Bottom) */}
         <div className="p-4 md:p-6 shrink-0 z-20">
            <div className="max-w-4xl mx-auto relative group">
               <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl blur opacity-10 group-hover:opacity-20 transition duration-500"></div>
               <div className="relative flex items-center bg-[#0f172a]/90 border border-white/10 p-2 rounded-2xl focus-within:border-cyan-500/50 transition-all shadow-2xl backdrop-blur-xl">
                  <input
                     value={input}
                     onChange={(e) => setInput(e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                     className="flex-1 bg-transparent px-4 py-3 text-white placeholder-slate-500 outline-none text-base"
                     placeholder={!isChatting ? "Initiate Neural Link..." : "Ask a follow-up..."}
                     autoComplete="off"
                     autoFocus
                  />
                  <button
                     onClick={handleSend}
                     className="p-3 bg-cyan-600 hover:bg-cyan-500 rounded-xl text-white transition-all shadow-lg"
                  >
                     <Send size={18} />
                  </button>
               </div>
               <div className="text-center mt-3">
                  <p className="text-[10px] text-slate-600 font-mono tracking-widest uppercase">
                     KrownFrame v1.0 // System Online // MR {mr}
                  </p>
               </div>
            </div>
         </div>

      </main>
    </div>
  );
}