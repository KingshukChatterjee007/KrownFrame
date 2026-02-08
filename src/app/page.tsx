"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Cpu, Shield, Terminal, Plus, Menu, Activity, ChevronRight, Sun, Moon, Flame, Snowflake, Biohazard, Orbit, Drama, ShoppingCart, Trash2, User, Lock, Calculator, Heart, Zap, RotateCcw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Poppins } from "next/font/google";

// Initialize Poppins Font
const poppins = Poppins({ 
  subsets: ["latin"], 
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins"
});

// --- TYPES ---
interface CycleData {
  cetus: { isDay: boolean; expiry: string };
  vallis: { isWarm: boolean; expiry: string };
  cambion: { active: string; expiry: string };
  zariman: { expiry: string };
  duviri: { state: string; expiry: string };
  voidTrader: { active: boolean; startString: string; endString: string; location: string };
}

// --- HELPER: TIME FORMAT ---
const formatTimer = (ms: number) => {
  if (ms < 0) return "00:00";
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / 1000 / 60) % 60);
  const hours = Math.floor((ms / 1000 / 60 / 60));
  
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
};

export default function KrownFrame() {
  const defaultState = [{ role: "system", content: "Operator, the Void link is stable. Awaiting your command." }];
  const [messages, setMessages] = useState(defaultState);
  const [input, setInput] = useState("");
  const [mr, setMr] = useState(8); 
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);

  // --- LIVE DATA STATE ---
  const [cycles, setCycles] = useState<CycleData | null>(null);
  const [, setTick] = useState(0);

  // --- SIMULACRUM STATE ---
  const [simHealth, setSimHealth] = useState<string>("");
  const [simArmor, setSimArmor] = useState<string>("");
  const [simShields, setSimShields] = useState<string>("");
  const [simDr, setSimDr] = useState<string>("");

  useEffect(() => {
    setIsClient(true);
    if (window.innerWidth >= 768) setSidebarOpen(true);

    const saved = localStorage.getItem("krownframe-history");
    const savedMr = localStorage.getItem("krownframe-mr");
    if (saved) { try { setMessages(JSON.parse(saved)); } catch (e) { console.error(e); } }
    if (savedMr) setMr(Number(savedMr));

    // Fetch Cycles
    const fetchCycles = async () => {
      try {
        const res = await fetch('https://api.warframestat.us/pc');
        const data = await res.json();
        setCycles({
          cetus: data.cetusCycle,
          vallis: data.vallisCycle,
          cambion: data.cambionCycle,
          zariman: data.zarimanCycle,
          duviri: data.duviriCycle,
          voidTrader: data.voidTrader
        });
      } catch (e) { console.error("Void Link Interrupted:", e); }
    };
    
    fetchCycles();
    const dataInterval = setInterval(fetchCycles, 60000);
    const tickInterval = setInterval(() => setTick(t => t + 1), 1000);

    return () => {
      clearInterval(dataInterval);
      clearInterval(tickInterval);
    };
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
      if (window.innerWidth < 768) setSidebarOpen(false);
    }
  };

  const resetSimulacrum = () => {
    setSimHealth("");
    setSimArmor("");
    setSimShields("");
    setSimDr("");
  };

  const isChatting = messages.length > 1;
  useEffect(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

  // --- CHAT HANDLER ---
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

  // --- SIMULACRUM MATH ---
  const health = Number(simHealth) || 0;
  const armor = Number(simArmor) || 0;
  const shields = Number(simShields) || 0;
  const extraDr = Math.min(Number(simDr) || 0, 99.99) / 100;

  const armorDr = armor / (armor + 300);
  const healthEhp = health / ((1 - armorDr) * (1 - extraDr) || 1);
  const shieldEhp = shields / (0.5 * (1 - extraDr) || 1); // Shields have innate 50% DR
  const totalEhp = Math.round(healthEhp + shieldEhp);
  const totalDrPercent = (1 - ((1 - armorDr) * (1 - extraDr))) * 100;

  if (!isClient) return null;

  return (
    <div className={`flex h-screen w-full overflow-hidden bg-black text-cyan-50 selection:bg-cyan-500/30 selection:text-cyan-200 p-0 md:p-4 gap-0 md:gap-4 relative ${poppins.className}`}>
      
      <style jsx global>{`
        /* --- GLOBAL STYLES --- */
        @keyframes gradient-x {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-text {
          background-size: 200% auto;
          animation: gradient-x 3s ease infinite;
        }
        /* Hide scrollbar for Chrome, Safari and Opera */
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        /* Hide scrollbar for IE, Edge and Firefox */
        .no-scrollbar {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>

      {/* --- MOBILE OVERLAY --- */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* --- SIDEBAR --- */}
      <aside className={`
        fixed md:relative inset-y-0 left-0 z-50 w-[85%] max-w-[340px] md:w-80 h-full
        bg-zinc-950/95 backdrop-blur-xl border-r border-white/10 md:border-none
        transform transition-transform duration-300 ease-in-out shadow-2xl
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 flex flex-col /* CHANGED: Always flex-col for proper scrolling */
        md:bg-zinc-950/90 md:rounded-3xl md:border md:shadow-2xl
      `}>
        {/* Header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent md:rounded-t-3xl shrink-0">
          <div className="flex items-center gap-3 group cursor-default">
             <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.05)] group-hover:border-zinc-500 transition-colors">
                <Cpu className="text-white group-hover:animate-pulse" size={18} />
             </div>
             <div>
                <span className="block text-base font-bold tracking-[0.15em] uppercase text-white">
                    KrownFrame
                </span>
             </div>
          </div>
        </div>

        {/* Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
           
           {/* New Chat */}
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

           {/* MR Config */}
           <div className="flex items-center justify-between p-3 bg-gradient-to-r from-zinc-900 to-black border border-white/10 rounded-xl group hover:border-white/20 transition-all">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                     <Shield size={14} className="text-cyan-400" />
                  </div>
                  <div className="flex flex-col">
                     <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider">Mastery</span>
                     <span className="text-sm font-bold text-white">RANK {mr}</span>
                  </div>
               </div>
               <div className="flex items-center gap-1">
                  <button onClick={() => setMr(m => Math.max(0, m - 1))} className="p-1.5 hover:bg-white/10 rounded-md text-zinc-500 hover:text-white transition">-</button>
                  <button onClick={() => setMr(m => Math.min(40, m + 1))} className="p-1.5 hover:bg-white/10 rounded-md text-zinc-500 hover:text-white transition">+</button>
               </div>
           </div>

           {/* --- LIVE CYCLE MONITOR --- */}
           {cycles && (
             <div className="space-y-3 pt-2">
                <p className="px-2 text-[9px] uppercase tracking-[0.2em] text-zinc-600 font-bold mb-2">Cycle Monitor</p>
                
                {/* 1. Earth / Cetus */}
                <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/40 rounded-xl border border-white/5 hover:bg-white/5 transition-colors">
                   <span className="text-xs font-bold text-zinc-300">Plains of Eidolon</span>
                   <div className="flex items-center gap-3">
                      {cycles.cetus.isDay ? <Sun size={14} className="text-orange-400" /> : <Moon size={14} className="text-blue-400" />}
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold min-w-[70px] text-center border ${cycles.cetus.isDay ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                         {formatTimer(new Date(cycles.cetus.expiry).getTime() - Date.now())}
                      </span>
                   </div>
                </div>

                {/* 2. Orb Vallis */}
                <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/40 rounded-xl border border-white/5 hover:bg-white/5 transition-colors">
                   <span className="text-xs font-bold text-zinc-300">Orb Vallis</span>
                   <div className="flex items-center gap-3">
                      {cycles.vallis.isWarm ? <Flame size={14} className="text-red-400" /> : <Snowflake size={14} className="text-cyan-400" />}
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold min-w-[70px] text-center border ${cycles.vallis.isWarm ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'}`}>
                         {formatTimer(new Date(cycles.vallis.expiry).getTime() - Date.now())}
                      </span>
                   </div>
                </div>

                {/* 3. Cambion Drift */}
                <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/40 rounded-xl border border-white/5 hover:bg-white/5 transition-colors">
                   <span className="text-xs font-bold text-zinc-300">Cambion Drift</span>
                   <div className="flex items-center gap-3">
                      <Biohazard size={14} className="text-yellow-500" />
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold min-w-[70px] text-center border bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                         {formatTimer(new Date(cycles.cambion.expiry).getTime() - Date.now())}
                      </span>
                   </div>
                </div>

                {/* 4. Zariman */}
                <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/40 rounded-xl border border-white/5 hover:bg-white/5 transition-colors">
                   <span className="text-xs font-bold text-zinc-300">Zariman</span>
                   <div className="flex items-center gap-3">
                      <Orbit size={14} className="text-fuchsia-400" />
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold min-w-[70px] text-center border bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20">
                         {cycles.zariman ? formatTimer(new Date(cycles.zariman.expiry).getTime() - Date.now()) : "00:00"}
                      </span>
                   </div>
                </div>

                {/* 5. Duviri */}
                <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/40 rounded-xl border border-white/5 hover:bg-white/5 transition-colors">
                   <span className="text-xs font-bold text-zinc-300">Duviri</span>
                   <div className="flex items-center gap-3">
                      <span className="text-[10px] uppercase text-zinc-500 font-bold mr-1">{cycles.duviri.state}</span>
                      <Drama size={14} className="text-emerald-400" />
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold min-w-[70px] text-center border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                         {formatTimer(new Date(cycles.duviri.expiry).getTime() - Date.now())}
                      </span>
                   </div>
                </div>

                {/* 6. Baro Ki'Teer */}
                <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-white/5">
                    <div className="flex items-center justify-between px-4 py-4 bg-gradient-to-r from-cyan-950/50 to-blue-950/50 rounded-xl border border-cyan-500/20">
                       <div className="flex items-center gap-3">
                           <ShoppingCart size={16} className="text-cyan-400" />
                           <span className="text-sm font-bold text-cyan-100">Baro Ki'Teer</span>
                       </div>
                       
                       <span className={`text-[10px] font-mono font-bold uppercase tracking-wide px-2 py-1 rounded-md border ${cycles.voidTrader?.active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-zinc-700/20 text-zinc-500 border-zinc-700/20'}`}>
                          {cycles.voidTrader?.active ? "ARRIVED" : "ON VACATION"}
                       </span>
                    </div>
                </div>

                {/* 7. THE SIMULACRUM (EHP CALCULATOR) */}
                <div className="mt-4 pt-4 border-t border-white/5">
                   {/* HEADER WITH RESET BUTTON */}
                   <div className="flex items-center justify-between mb-3 px-1">
                      <div className="flex items-center gap-2">
                         <Calculator size={14} className="text-red-400" />
                         <p className="text-[9px] uppercase tracking-[0.2em] text-zinc-500 font-bold">The Simulacrum</p>
                      </div>
                      <button 
                         onClick={resetSimulacrum}
                         className="text-zinc-600 hover:text-white transition-colors"
                         title="Reset Calculator"
                      >
                         <RotateCcw size={12} />
                      </button>
                   </div>
                   
                   <div className="space-y-2">
                      {/* Inputs Row 1 */}
                      <div className="flex gap-2">
                         <div className="flex-1 bg-zinc-900 border border-white/10 rounded-lg p-2 focus-within:border-red-500/50 transition-colors">
                            <div className="flex items-center gap-1 mb-1">
                               <Heart size={10} className="text-red-400"/>
                               <span className="text-[8px] text-zinc-500 uppercase font-bold tracking-wider">Health</span>
                            </div>
                            <input 
                               type="number" 
                               className="bg-transparent border-none outline-none text-xs text-white w-full font-mono placeholder-zinc-700" 
                               placeholder="0" 
                               value={simHealth} 
                               onChange={e => setSimHealth(e.target.value)} 
                            />
                         </div>
                         <div className="flex-1 bg-zinc-900 border border-white/10 rounded-lg p-2 focus-within:border-orange-500/50 transition-colors">
                            <div className="flex items-center gap-1 mb-1">
                               <Shield size={10} className="text-orange-400"/>
                               <span className="text-[8px] text-zinc-500 uppercase font-bold tracking-wider">Armor</span>
                            </div>
                            <input 
                               type="number" 
                               className="bg-transparent border-none outline-none text-xs text-white w-full font-mono placeholder-zinc-700" 
                               placeholder="0" 
                               value={simArmor} 
                               onChange={e => setSimArmor(e.target.value)} 
                            />
                         </div>
                      </div>
                      
                      {/* Inputs Row 2 */}
                      <div className="flex gap-2">
                         <div className="flex-1 bg-zinc-900 border border-white/10 rounded-lg p-2 focus-within:border-blue-500/50 transition-colors">
                            <div className="flex items-center gap-1 mb-1">
                               <Activity size={10} className="text-blue-400"/>
                               <span className="text-[8px] text-zinc-500 uppercase font-bold tracking-wider">Shields</span>
                            </div>
                            <input 
                               type="number" 
                               className="bg-transparent border-none outline-none text-xs text-white w-full font-mono placeholder-zinc-700" 
                               placeholder="0" 
                               value={simShields} 
                               onChange={e => setSimShields(e.target.value)} 
                            />
                         </div>
                         <div className="flex-1 bg-zinc-900 border border-white/10 rounded-lg p-2 focus-within:border-purple-500/50 transition-colors">
                            <div className="flex items-center gap-1 mb-1">
                               <Zap size={10} className="text-purple-400"/>
                               <span className="text-[8px] text-zinc-500 uppercase font-bold tracking-wider">Extra DR %</span>
                            </div>
                            <input 
                               type="number" 
                               max="99"
                               className="bg-transparent border-none outline-none text-xs text-white w-full font-mono placeholder-zinc-700" 
                               placeholder="0" 
                               value={simDr} 
                               onChange={e => setSimDr(e.target.value)} 
                            />
                         </div>
                      </div>

                      {/* Results Card */}
                      <div className="p-3 mt-2 bg-gradient-to-r from-red-950/30 to-orange-950/30 border border-red-500/20 rounded-xl flex justify-between items-center">
                         <div className="flex flex-col">
                            <span className="text-[9px] text-red-400/80 uppercase font-bold tracking-widest">Total EHP</span>
                            <span className="text-lg font-bold font-mono text-red-100">{totalEhp.toLocaleString()}</span>
                         </div>
                         <div className="h-8 w-px bg-white/10 mx-2"></div>
                         <div className="flex flex-col items-end">
                            <span className="text-[9px] text-orange-400/80 uppercase font-bold tracking-widest">Damage Red.</span>
                            <span className="text-sm font-mono text-orange-100">{totalDrPercent.toFixed(1)}%</span>
                         </div>
                      </div>
                   </div>
                </div>

                {/* 8. Weekly Reset */}
                <div className="mt-4 text-center pb-4">
                   <p className="text-[9px] text-zinc-600 uppercase tracking-widest font-mono">
                      Circuit Resets in {Math.floor((new Date().setUTCHours(24,0,0,0) + (7 - new Date().getUTCDay()) * 86400000 - Date.now()) / 3600000)}H
                   </p>
                </div>

             </div>
           )}

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 bg-black/20 md:rounded-b-3xl shrink-0">
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

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex flex-col relative bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black md:rounded-3xl md:border md:border-white/5 overflow-hidden shadow-2xl">
         
         <div className="md:hidden h-16 flex items-center justify-between px-4 border-b border-white/5 bg-black/90 backdrop-blur-md shrink-0">
            <button onClick={() => setSidebarOpen(true)} className="text-white p-2">
               <Menu />
            </button>
            <span className="font-bold text-white tracking-widest text-sm">KROWNFRAME</span>
            <div className="w-8"></div>
         </div>

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
                     <div className="flex items-center gap-2">
                        <Lock size={12} className="text-zinc-400" />
                        <span className="text-[10px] md:text-xs font-mono text-zinc-400 tracking-widest uppercase">PROTOCOL: SECURE</span>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {isChatting && (
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8 scroll-smooth">
               {messages.map((msg: any, i) => (
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
                                 strong: ({...props}: any) => <span className="font-bold text-white" {...props} />,
                                 ul: ({...props}: any) => <ul className="list-disc pl-4 space-y-1" {...props} />,
                                 li: ({...props}: any) => <li className="marker:text-zinc-500" {...props} />
                              }}
                           >
                              {msg.content || ""}
                           </ReactMarkdown>
                           {/* THE TYPEWRITER CURSOR */}
                           {msg.role === 'system' && i === messages.length - 1 && loading && (
                              <span className="inline-block w-2 h-4 bg-cyan-400 ml-1 animate-pulse align-middle shadow-[0_0_8px_rgba(34,211,238,0.8)]"></span>
                           )}
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

         <div className="p-4 md:p-8 shrink-0 z-20 pb-6 md:pb-8">
            <div className="max-w-4xl mx-auto relative group">
               <div className="absolute -inset-1 bg-gradient-to-r from-zinc-700/30 to-zinc-800/30 rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition duration-700"></div>
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
                  <p className="text-[10px] text-zinc-600 font-mono tracking-widest opacity-50 uppercase">
                     © 2026 KROWNFRAME // All Rights Reserved
                  </p>
               </div>
            </div>
         </div>

      </main>
    </div>
  );
}