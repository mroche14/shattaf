
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, Loader2 } from 'lucide-react';
import { askConsultant } from '../services/geminiService';

const ChatConsultant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([
    { role: 'ai', text: "Bonjour, je suis votre Concierge Oasis. Comment puis-je vous aider dans votre transition vers une hygiène supérieure aujourd'hui ?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    const response = await askConsultant(userMsg);
    setMessages(prev => [...prev, { role: 'ai', text: response || "Je rencontre une difficulté de connexion. Veuillez m'en excuser." }]);
    setLoading(false);
  };

  return (
    <div className="fixed bottom-8 right-8 z-[60]">
      {isOpen ? (
        <div className="glass w-[380px] h-[550px] rounded-[40px] border-cyan-500/20 flex flex-col overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-10 duration-500">
          <div className="p-6 btn-primary flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <Bot className="w-6 h-6 text-white" />
              <span className="font-black text-white text-[11px] uppercase tracking-[0.18em]">Concierge Oasis</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white hover:rotate-90 transition-transform"><X size={24}/></button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-5 rounded-3xl ${m.role === 'user' ? 'btn-primary text-white rounded-tr-none' : 'glass border-white/10 rounded-tl-none'}`}>
                  <p className="text-[11px] font-bold leading-relaxed">{m.text}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="glass p-4 rounded-3xl rounded-tl-none animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                </div>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-white/5 bg-black/40">
            <div className="relative">
              <input 
                className="w-full bg-[#020617] border border-white/10 rounded-2xl pl-6 pr-14 py-4 text-xs font-bold focus:border-cyan-400 outline-none transition-all placeholder:text-gray-700"
                placeholder="Votre question sur l'hygiène..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleSend()}
              />
              <button 
                onClick={handleSend}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 btn-primary rounded-xl flex items-center justify-center text-white hover:scale-105 transition-all shadow-lg"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-20 h-20 rounded-full btn-primary flex items-center justify-center shadow-[0_0_40px_rgba(6,182,212,0.4)] hover:scale-110 transition-all group"
        >
          <MessageCircle className="w-10 h-10 text-white group-hover:rotate-12 transition-all" />
        </button>
      )}
    </div>
  );
};

export default ChatConsultant;
