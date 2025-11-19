
import React, { useState } from 'react';
import { Photo } from '../types';

interface PhotoGridProps {
  photos: Photo[];
  onPhotoClick?: (photo: Photo) => void;
}

export const PhotoGrid: React.FC<PhotoGridProps> = ({ photos, onPhotoClick }) => {
  if (photos.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-neutral-400 font-light italic">
        No photographs found in this collection.
      </div>
    );
  }

  return (
    <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4 pr-4">
      {photos.map((photo) => (
        <PhotoCard key={photo.id} photo={photo} onClick={() => onPhotoClick && onPhotoClick(photo)} />
      ))}
    </div>
  );
};

const PhotoCard: React.FC<{ photo: Photo; onClick: () => void }> = ({ photo, onClick }) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <div 
      onClick={onClick}
      className="relative group cursor-pointer break-inside-avoid mb-4"
    >
      <div className={`
        relative overflow-hidden bg-neutral-100 transition-opacity duration-700 ease-out
        ${loaded ? 'opacity-100' : 'opacity-0'}
      `}>
        <img 
          src={photo.url} 
          alt={photo.title}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-[1.02]"
        />
        
        {/* Overlay Info */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
          <h3 className="text-white font-serif text-lg italic drop-shadow-md">{photo.title}</h3>
        </div>
      </div>
    </div>
  );
};
