import { Photo, PhotoSeries } from '../types';

const PHOTOS_KEY = 'lumina_photos';
const SERIES_KEY = 'lumina_series';

export const getPhotos = (): Photo[] => {
  const data = localStorage.getItem(PHOTOS_KEY);
  return data ? JSON.parse(data) : [];
};

export const savePhoto = (photo: Photo): void => {
  const photos = getPhotos();
  const updatedPhotos = [photo, ...photos];
  try {
    localStorage.setItem(PHOTOS_KEY, JSON.stringify(updatedPhotos));
  } catch (e) {
    console.error("Storage quota exceeded", e);
    alert("Storage quota exceeded. Please delete some photos.");
  }
};

export const deletePhoto = (id: string): void => {
  const photos = getPhotos();
  const filtered = photos.filter(p => p.id !== id);
  localStorage.setItem(PHOTOS_KEY, JSON.stringify(filtered));
};

export const getSeries = (): PhotoSeries[] => {
  const data = localStorage.getItem(SERIES_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveSeries = (series: PhotoSeries): void => {
  const list = getSeries();
  const exists = list.find(s => s.id === series.id);
  let updated;
  if (exists) {
    updated = list.map(s => s.id === series.id ? series : s);
  } else {
    updated = [...list, series];
  }
  localStorage.setItem(SERIES_KEY, JSON.stringify(updated));
};

export const deleteSeries = (id: string): void => {
  const list = getSeries();
  const filtered = list.filter(s => s.id !== id);
  localStorage.setItem(SERIES_KEY, JSON.stringify(filtered));
  
  // Also decouple photos from this series
  const photos = getPhotos();
  const updatedPhotos = photos.map(p => p.seriesId === id ? { ...p, seriesId: null } : p);
  localStorage.setItem(PHOTOS_KEY, JSON.stringify(updatedPhotos));
};