
import React, { useEffect, useCallback } from 'react';
import { Photo } from '../types';

interface LightboxProps {
  photo: Photo;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  currentIndex: number;
  total: number;
}

export const Lightbox: React.FC<LightboxProps> = ({ 
  photo, 
  onClose, 
  onNext, 
  onPrev, 
  currentIndex, 
  total 
}) => {
  
  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowRight') onNext();
    if (e.key === 'ArrowLeft') onPrev();
  }, [onClose, onNext, onPrev]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    // Lock body scroll
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [handleKeyDown]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black flex flex-col animate-fade-in"
      onClick={handleBackdropClick}
    >
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20 text-white select-none">
        <span className="text-sm font-sans tracking-wider opacity-80">
          {currentIndex + 1} / {total}
        </span>
        <button 
          onClick={onClose}
          className="p-2 hover:opacity-70 transition-opacity focus:outline-none"
          aria-label="Close"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 w-full h-full relative flex items-center justify-center p-4 md:p-12">
        
        {/* Left Arrow */}
        <button 
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 p-4 text-white hover:opacity-70 transition-opacity z-20 focus:outline-none hidden md:block"
          aria-label="Previous"
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        {/* Image */}
        <img 
          src={photo.url} 
          alt={photo.title}
          className="max-w-full max-h-full object-contain shadow-2xl select-none"
          onClick={(e) => e.stopPropagation()} 
        />

        {/* Right Arrow */}
        <button 
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 p-4 text-white hover:opacity-70 transition-opacity z-20 focus:outline-none hidden md:block"
          aria-label="Next"
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* Mobile Overlay Navigation Zones (invisible) */}
      <div className="absolute inset-y-0 left-0 w-1/4 z-10 md:hidden" onClick={(e) => { e.stopPropagation(); onPrev(); }} />
      <div className="absolute inset-y-0 right-0 w-1/4 z-10 md:hidden" onClick={(e) => { e.stopPropagation(); onNext(); }} />
    </div>
  );
};
