import React from 'react';
import { PhotoSeries } from '../types';

interface SidebarProps {
  series: PhotoSeries[];
  currentView: string;
  currentSeriesId?: string;
  onNavigate: (view: 'home' | 'series' | 'admin', seriesId?: string) => void;
  isOpen: boolean;
  toggleOpen: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  series, 
  currentView, 
  currentSeriesId, 
  onNavigate,
  isOpen,
  toggleOpen
}) => {
  return (
    <>
      {/* Mobile Toggle */}
      <button 
        onClick={toggleOpen}
        className="fixed top-4 left-4 z-50 md:hidden bg-white p-2 rounded-full shadow-md"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
        </svg>
      </button>

      {/* Sidebar Container */}
      <aside 
        className={`
          fixed md:sticky top-0 left-0 h-screen w-64 bg-neutral-50 border-r border-neutral-200 
          flex flex-col p-8 z-40 transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Logo / Header */}
        <div className="mb-12">
          <h1 
            onClick={() => onNavigate('home')}
            className="text-2xl font-serif font-semibold tracking-tight cursor-pointer hover:opacity-70 transition-opacity"
          >
            Lumina.
          </h1>
          <p className="text-xs text-neutral-500 mt-2 font-sans uppercase tracking-widest">Photography</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto no-scrollbar">
          <ul className="space-y-4">
            <li>
              <button 
                onClick={() => onNavigate('home')}
                className={`text-sm uppercase tracking-widest transition-colors ${currentView === 'home' ? 'text-neutral-900 font-semibold' : 'text-neutral-500 hover:text-neutral-900'}`}
              >
                Portfolio
              </button>
            </li>
            
            {/* Series List */}
            {series.length > 0 && (
              <li className="pt-4 pb-2">
                <span className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Series</span>
              </li>
            )}
            
            {series.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => onNavigate('series', s.id)}
                  className={`text-sm transition-colors text-left w-full truncate ${currentSeriesId === s.id ? 'text-neutral-900 font-medium' : 'text-neutral-500 hover:text-neutral-900'}`}
                >
                  {s.title}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer / Admin Link */}
        <div className="mt-auto pt-8 border-t border-neutral-200">
          <button 
             onClick={() => onNavigate('admin')}
             className={`text-xs uppercase tracking-widest transition-colors ${currentView === 'admin' ? 'text-neutral-900 font-semibold' : 'text-neutral-400 hover:text-neutral-900'}`}
          >
            Admin Area
          </button>
          <p className="text-[10px] text-neutral-400 mt-4">
            &copy; {new Date().getFullYear()} Lumina
          </p>
        </div>
      </aside>
      
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden"
          onClick={toggleOpen}
        />
      )}
    </>
  );
};