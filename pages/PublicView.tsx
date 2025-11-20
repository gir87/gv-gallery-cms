
import React, { useState, useMemo } from 'react';
import { Photo, PhotoSeries } from '../types';
import { PhotoGrid } from '../components/PhotoGrid';
import { Lightbox } from '../components/Lightbox';

interface PublicViewProps {
  photos: Photo[];
  seriesList: PhotoSeries[];
  currentSeriesId?: string;
}

export const PublicView: React.FC<PublicViewProps> = ({ photos, seriesList, currentSeriesId }) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Filter photos based on current view
  const displayedPhotos = useMemo(() => {
    let list = [];
    
    if (currentSeriesId) {
      // Series View: Only show photos assigned to this series
      list = photos.filter(p => p.seriesId === currentSeriesId);
    } else {
      // Home View: Only show photos marked as "Show on Homepage"
      list = photos.filter(p => p.isHomepage);
    }

    // Sort by order_index (user defined)
    list.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
    
    return list;
  }, [photos, currentSeriesId]);

  const activeSeries = currentSeriesId ? seriesList.find(s => s.id === currentSeriesId) : null;

  const handlePhotoClick = (photo: Photo) => {
    const index = displayedPhotos.findIndex(p => p.id === photo.id);
    if (index >= 0) {
      setLightboxIndex(index);
    }
  };

  const handleNext = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex((prev) => (prev !== null && prev + 1 < displayedPhotos.length ? prev + 1 : 0));
  };

  const handlePrev = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex((prev) => (prev !== null && prev - 1 >= 0 ? prev - 1 : displayedPhotos.length - 1));
  };

  return (
    <>
      <div className="max-w-[1600px] mx-auto px-4 md:px-12 py-12 animate-fade-in">
        {currentSeriesId && activeSeries ? (
          <div className="mb-16 max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-serif mb-6">{activeSeries.title}</h2>
            <p className="text-neutral-500 text-lg font-light leading-relaxed">{activeSeries.description}</p>
          </div>
        ) : (
          <div className="mb-16 max-w-2xl">
          </div>
        )}
        
        <PhotoGrid photos={displayedPhotos} onPhotoClick={handlePhotoClick} />
      </div>

      {lightboxIndex !== null && (
        <Lightbox 
          photo={displayedPhotos[lightboxIndex]}
          currentIndex={lightboxIndex}
          total={displayedPhotos.length}
          onClose={() => setLightboxIndex(null)}
          onNext={handleNext}
          onPrev={handlePrev}
        />
      )}
    </>
  );
};
