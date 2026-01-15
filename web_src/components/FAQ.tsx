
import React, { useState } from 'react';
import { FAQS } from '../constants';
import { Plus, Minus } from 'lucide-react';

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 bg-[#050a14]">
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-xs font-black text-cyan-400 tracking-[0.4em] uppercase">Intelligence</h2>
          <h3 className="text-4xl md:text-5xl font-display font-bold text-white">Questions Fréquentes.</h3>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, idx) => (
            <div key={idx} className="glass rounded-3xl border-white/5 overflow-hidden transition-all">
              <button 
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full p-8 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
              >
                <span className="text-lg font-bold font-display tracking-tight">{faq.question}</span>
                {openIndex === idx ? <Minus className="text-cyan-400" /> : <Plus className="text-cyan-400" />}
              </button>
              {openIndex === idx && (
                <div className="p-8 pt-0 text-gray-400 text-sm leading-relaxed animate-in slide-in-from-top-2 duration-300">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
