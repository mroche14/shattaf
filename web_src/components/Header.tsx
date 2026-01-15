
import React from 'react';
import { Droplets, Menu, X } from 'lucide-react';

const Header: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl btn-primary flex items-center justify-center shadow-lg">
            <Droplets className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-bold text-2xl tracking-tighter uppercase">
              OASIS <span className="cyan-gradient-text">SHATTAF</span>
            </span>
            <span className="text-[8px] font-medium text-gray-400 tracking-widest uppercase">Douchette Hygiénique</span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-10 text-[10px] font-black tracking-[0.25em] text-gray-400">
          <a href="#philosophy" className="hover:text-white transition-all uppercase">L'Hygiène</a>
          <a href="#models" className="hover:text-white transition-all uppercase">La Gamme</a>
          <a href="#booking" className="hover:text-white transition-all uppercase">Installation</a>
          <button 
            onClick={() => document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-8 py-3 rounded-xl btn-primary text-white font-black hover:scale-105 transition-all shadow-xl uppercase"
          >
            Commander
          </button>
        </nav>

        <button className="md:hidden text-white" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {isOpen && (
        <div className="md:hidden glass absolute top-full left-0 right-0 p-8 flex flex-col gap-6 text-center animate-in slide-in-from-top duration-300">
          <a href="#philosophy" className="text-xl font-bold" onClick={() => setIsOpen(false)}>Hygiène & Bien-être</a>
          <a href="#models" className="text-xl font-bold" onClick={() => setIsOpen(false)}>Modèles</a>
          <a href="#booking" className="text-xl font-bold" onClick={() => setIsOpen(false)}>Réserver</a>
        </div>
      )}
    </header>
  );
};

export default Header;
