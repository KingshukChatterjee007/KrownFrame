"use client";
import { useState, useRef, useEffect } from "react";

export default function KrownFrame() {
  // 1. STATE VARIABLES (The Brains of the UI)
  const [messages, setMessages] = useState([
    { role: "system", content: "Greetings, Tenno. I am Cephalon Krown. Status report required." }
  ]);
  const [input, setInput] = useState("");
  const [mr, setMr] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Auto-scroll to bottom
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages]);

  // 2. THE STREAMING FUNCTION (Fast Response)
  const handleSend = async () => {
    if (!input.trim()) return;

    // Add user message immediately
    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // Create a placeholder for the AI's answer
    setMessages((prev) => [...prev, { role: "system", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMsg], userMR: mr }),
      });

      if (!res.body) throw new Error("No response body");

      // Read the stream
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value, { stream: true });

        // Update the LAST message (the placeholder) with the new chunk
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
        const lastMsg = newMessages[newMessages.length - 1];
        lastMsg.content = "Error: Connection severed. Visual sensors offline.";
        return newMessages;
      });
    }
    setLoading(false);
  };

  // 3. THE VISUALS (HTML/JSX)
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#e0e0e0] font-mono p-6 flex flex-col relative overflow-hidden">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-[#00eeff]/30 pb-4 mb-6 z-10">
        <h1 className="text-3xl font-bold tracking-wider text-[#00eeff] italic" style={{ textShadow: "0 0 10px #00eeff" }}>
          K R O W N F R A M E
        </h1>
        <div className="flex items-center space-x-4">
          <span className="text-xs uppercase tracking-widest text-gray-500">Mastery Rank</span>
          <input
            type="number"
            value={mr}
            onChange={(e) => setMr(Number(e.target.value))}
            className="bg-transparent text-[#00eeff] w-12 outline-none text-right border-b border-gray-700 focus:border-[#00eeff]"
          />
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto mb-6 space-y-4 pr-2 z-10 scrollbar-hide">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-sm border ${msg.role === 'user' ? 'bg-[#151515] border-[#333]' : 'bg-[#0f171a] border-[#00eeff]/20'}`}>
              
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {msg.content}
              </p>
              
            </div>
          </div>
        ))}
        {loading && <div className="text-[#00eeff] text-xs animate-pulse">Scanning Void frequencies...</div>}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Field Area */}
      <div className="max-w-4xl mx-auto w-full flex gap-3 z-10">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          className="flex-1 bg-[#111] border border-[#222] p-4 outline-none focus:border-[#00eeff] transition-all placeholder-gray-600 text-sm"
          placeholder="Awaiting input, Tenno..."
        />
        <button
          onClick={handleSend}
          className="bg-[#00eeff] text-black font-bold px-8 hover:bg-[#00ccdd] transition-all uppercase tracking-widest text-xs"
        >
          Send
        </button>
      </div>
    </main>
  );
}