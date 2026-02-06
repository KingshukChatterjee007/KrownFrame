"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Cpu, User, ThumbsUp, Copy, RefreshCw } from "lucide-react"; // *You might need to install icons, see below

export default function KrownFrame() {
  // --- LOGIC (SAME AS BEFORE) ---
  const [messages, setMessages] = useState([
    { role: "system", content: "Greetings, Tenno. I am Cephalon Krown. My sensors are calibrated. How may I assist your arsenal today?" }
  ]);
  const [input, setInput] = useState("");
  const [mr, setMr] = useState(0);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setMessages((prev) => [...prev, { role: "system", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMsg], userMR: mr }),
      });
      if (!res.body) throw new Error("No response body");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const newMessages = [...prev];
          const lastMsg = newMessages[newMessages.length - 1];
          lastMsg.content += chunkValue;
          return newMessages;
        });
      }
    } catch (error) {
      setMessages((prev) => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1].content = "Error: Void static detected. Connection severed.";
        return newMessages;
      });
    }
    setLoading(false);
  };

  // --- NEW VISUALS ---
  return (
    <main className="min-h-screen bg-black text-gray-100 font-sans flex flex-col items-center justify-between relative overflow-hidden selection:bg-[#00eeff] selection:text-black">
      
      {/* Background Ambience (Optional Glow) */}
      <div className="absolute top-0 left-0 w-full h-64 bg-[#00eeff] opacity-5 blur-[150px] pointer-events-none"></div>

      {/* 1. TOP BAR */}
      <div className="w-full max-w-2xl flex justify-between items-center p-6 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-800 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Cpu size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-wide">Cephalon Krown</h1>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-xs text-gray-400">Online | MR {mr}</span>
            </div>
          </div>
        </div>
        
        {/* MR Settings Pill */}
        <div className="flex items-center bg-[#1a1a1a] rounded-full px-4 py-2 border border-white/5">
          <span className="text-xs text-gray-500 mr-2 uppercase tracking-wider">Rank</span>
          <input
            type="number"
            value={mr}
            onChange={(e) => setMr(Number(e.target.value))}
            className="bg-transparent text-[#00eeff] w-8 text-center outline-none font-bold"
          />
        </div>
      </div>

      {/* 2. CHAT AREA */}
      <div className="flex-1 w-full max-w-2xl overflow-y-auto p-4 space-y-8 scrollbar-hide z-10 pb-32">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            
            {/* Avatars */}
            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-gradient-to-br from-pink-500 to-purple-600' : 'bg-[#1a1a1a] border border-white/10'}`}>
              {msg.role === 'user' ? <User size={14} /> : <Cpu size={14} className="text-[#00eeff]" />}
            </div>

            {/* Bubbles */}
            <div className={`max-w-[80%] space-y-2`}>
              <div 
                className={`p-5 rounded-3xl text-sm leading-relaxed shadow-xl backdrop-blur-sm
                ${msg.role === 'user' 
                  ? 'bg-gradient-to-br from-[#8b5cf6] to-[#ec4899] text-white rounded-tr-sm' // User: Gradient
                  : 'bg-[#121212] border border-white/5 text-gray-300 rounded-tl-sm' // System: Dark Glass
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>

              {/* Bot Action Buttons (Only for system messages) */}
              {msg.role === 'system' && (
                <div className="flex gap-4 pl-2 opacity-50 hover:opacity-100 transition-opacity duration-300">
                   <Copy size={14} className="cursor-pointer hover:text-[#00eeff]" />
                   <ThumbsUp size={14} className="cursor-pointer hover:text-[#00eeff]" />
                   <RefreshCw size={14} className="cursor-pointer hover:text-[#00eeff]" />
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 pl-14 text-xs text-gray-500 animate-pulse">
            <Cpu size={12} className="animate-spin" />
            Computing optimum strategy...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. FLOATING INPUT BAR */}
      <div className="fixed bottom-6 w-full max-w-2xl px-4 z-20">
        <div className="bg-[#1a1a1a]/80 backdrop-blur-xl border border-white/10 p-2 rounded-full flex items-center shadow-2xl shadow-black/50">
          
          <div className="w-10 h-10 bg-[#222] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#333] transition-colors">
            <span className="text-xl text-gray-400">+</span>
          </div>

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 bg-transparent px-4 text-sm text-white placeholder-gray-500 outline-none"
            placeholder="Ask Cephalon Krown..."
          />

          <button
            onClick={handleSend}
            className={`p-3 rounded-full transition-all duration-300 ${input.trim() ? 'bg-[#00eeff] text-black rotate-0' : 'bg-[#333] text-gray-500 -rotate-90'}`}
          >
            <Send size={18} fill={input.trim() ? "black" : "none"} />
          </button>
        </div>
      </div>

    </main>
  );
}