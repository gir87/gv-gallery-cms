import React, { useEffect, useState } from 'react';
import { fetchSettings } from '../services/storageService';
import { AboutConfig } from '../types';

export const About: React.FC = () => {
  const [data, setData] = useState<AboutConfig>({ title: '', text: '', imageUrl: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const settings = await fetchSettings();
      setData(settings);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return <div className="p-12 animate-pulse">Loading...</div>;
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 md:px-12 py-12 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24">
        
        {/* Left: Content */}
        <div className="max-w-xl">
          <h2 className="text-4xl md:text-5xl font-serif mb-8">{data.title || 'About'}</h2>
          <div className="text-neutral-600 text-base font-light leading-relaxed space-y-6 whitespace-pre-wrap">
            {data.text || 'No information available yet.'}
          </div>
        </div>

        {/* Right: Image */}
        <div className="relative">
          {data.imageUrl ? (
            <img 
              src={data.imageUrl} 
              alt={data.title} 
              className="w-full h-auto object-cover max-h-[80vh] shadow-lg"
            />
          ) : (
            <div className="w-full h-96 bg-neutral-100 flex items-center justify-center text-neutral-400 italic">
              No author image set
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
