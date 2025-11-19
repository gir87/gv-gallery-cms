import React from 'react';
import { Photo, PhotoSeries } from '../types';
import { PhotoGrid } from '../components/PhotoGrid';

interface PublicViewProps {
  photos: Photo[];
  seriesList: PhotoSeries[];
  currentSeriesId?: string;
}

export const PublicView: React.FC<PublicViewProps> = ({ photos, seriesList, currentSeriesId }) => {
  
  // If viewing a specific series
  if (currentSeriesId) {
    const activeSeries = seriesList.find(s => s.id === currentSeriesId);
    const seriesPhotos = photos.filter(p => p.seriesId === currentSeriesId);

    if (!activeSeries) return <div>Series not found</div>;

    return (
      <div className="max-w-[1600px] mx-auto px-4 md:px-12 py-12 animate-fade-in">
        <div className="mb-16 max-w-2xl">
          <h2 className="text-4xl md:text-5xl font-serif mb-6">{activeSeries.title}</h2>
          <p className="text-neutral-500 text-lg font-light leading-relaxed">{activeSeries.description}</p>
        </div>
        <PhotoGrid photos={seriesPhotos} />
      </div>
    );
  }

  // Home View - Show mixed portfolio or highlight recent works
  // To look like the reference, we show a mix, or perhaps just the grid of all "Portfolio" items
  // We exclude photos that are strictly in a series unless we want a "All Work" feed.
  // Let's show everything sorted by date new -> old.
  const sortedPhotos = [...photos].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="max-w-[1600px] mx-auto px-4 md:px-12 py-12 animate-fade-in">
       <div className="mb-16 max-w-2xl">
          <h2 className="text-4xl md:text-5xl font-serif mb-6">Selected Works</h2>
          <p className="text-neutral-500 text-lg font-light leading-relaxed">
            A collection of moments, light, and shadow captured across the globe.
          </p>
        </div>
      <PhotoGrid photos={sortedPhotos} />
    </div>
  );
};