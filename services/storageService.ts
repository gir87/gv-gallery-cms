import { Photo, PhotoSeries } from '../types';

// API URL relative to the domain.
// When running locally in React (port 3000), this usually 404s or fails unless proxied.
// We will fallback to LocalStorage if the API is unreachable.
const API_URL = '/api.php'; 

const LOCAL_STORAGE_KEYS = {
  PHOTOS: 'lumina_photos',
  SERIES: 'lumina_series',
  TOKEN: 'lumina_token'
};

// Helper to get data from LocalStorage safely
const getLocal = (key: string) => {
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : [];
};

// Helper to set data to LocalStorage safely
const setLocal = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const login = async (password: string): Promise<boolean> => {
  try {
    const res = await fetch(`${API_URL}?action=login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password })
    });
    
    if (!res.ok) throw new Error('API Error');
    
    const data = await res.json();
    if (data.success) {
      localStorage.setItem(LOCAL_STORAGE_KEYS.TOKEN, data.token);
      return true;
    }
    return false;
  } catch (e) {
    console.warn("Backend unreachable, using local demo auth. Password is 'lumina123'");
    // Fallback for local testing
    if (password === 'lumina123') {
      localStorage.setItem(LOCAL_STORAGE_KEYS.TOKEN, 'demo_token');
      return true;
    }
    return false;
  }
};

export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem(LOCAL_STORAGE_KEYS.TOKEN);
};

export const logout = (): void => {
  localStorage.removeItem(LOCAL_STORAGE_KEYS.TOKEN);
};

export const fetchData = async (): Promise<{ photos: Photo[], series: PhotoSeries[] }> => {
  try {
    const res = await fetch(API_URL);
    
    // If API returns 404 (file not found) or 500, throw error to trigger fallback
    if (!res.ok) throw new Error(`API returned ${res.status}`);
    
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("API did not return JSON");
    }

    const data = await res.json();
    
    // Normalize URLs from backend. 
    // If they are relative paths like 'uploads/img.jpg', we leave them as is (browser handles relative).
    // If they are base64 (from local fallback previously saved to DB), they work as is.
    const formattedPhotos = data.photos.map((p: any) => ({
      ...p,
      url: p.url
    }));

    return {
      photos: formattedPhotos,
      series: data.series
    };
  } catch (e) {
    console.warn("Backend unreachable or invalid (using LocalStorage fallback).", e);
    return {
      photos: getLocal(LOCAL_STORAGE_KEYS.PHOTOS),
      series: getLocal(LOCAL_STORAGE_KEYS.SERIES)
    };
  }
};

export const savePhoto = async (photo: Photo): Promise<void> => {
  try {
    const res = await fetch(`${API_URL}?action=upload_photo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(photo)
    });
    if (!res.ok) throw new Error('API Error');
  } catch (e) {
    console.warn("Backend unreachable. Saving to LocalStorage.");
    const photos = getLocal(LOCAL_STORAGE_KEYS.PHOTOS);
    photos.push(photo);
    setLocal(LOCAL_STORAGE_KEYS.PHOTOS, photos);
  }
};

export const deletePhoto = async (id: string): Promise<void> => {
  try {
    const res = await fetch(`${API_URL}?id=${id}&type=photo`, { method: 'DELETE' });
    if (!res.ok) throw new Error('API Error');
  } catch (e) {
    console.warn("Backend unreachable. Deleting from LocalStorage.");
    const photos = getLocal(LOCAL_STORAGE_KEYS.PHOTOS) as Photo[];
    const newPhotos = photos.filter(p => p.id !== id);
    setLocal(LOCAL_STORAGE_KEYS.PHOTOS, newPhotos);
  }
};

export const saveSeries = async (series: PhotoSeries): Promise<void> => {
  try {
    const res = await fetch(`${API_URL}?action=save_series`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(series)
    });
    if (!res.ok) throw new Error('API Error');
  } catch (e) {
    console.warn("Backend unreachable. Saving to LocalStorage.");
    const list = getLocal(LOCAL_STORAGE_KEYS.SERIES);
    // Check if exists and update, or push new
    const index = list.findIndex((s: PhotoSeries) => s.id === series.id);
    if (index >= 0) {
      list[index] = series;
    } else {
      list.push(series);
    }
    setLocal(LOCAL_STORAGE_KEYS.SERIES, list);
  }
};

export const deleteSeries = async (id: string): Promise<void> => {
  try {
    const res = await fetch(`${API_URL}?id=${id}&type=series`, { method: 'DELETE' });
    if (!res.ok) throw new Error('API Error');
  } catch (e) {
    console.warn("Backend unreachable. Deleting from LocalStorage.");
    const list = getLocal(LOCAL_STORAGE_KEYS.SERIES) as PhotoSeries[];
    const newList = list.filter(s => s.id !== id);
    setLocal(LOCAL_STORAGE_KEYS.SERIES, newList);
  }
};

// Deprecated but kept for interface compatibility if needed
export const getPhotos = (): Photo[] => getLocal(LOCAL_STORAGE_KEYS.PHOTOS);
export const getSeries = (): PhotoSeries[] => getLocal(LOCAL_STORAGE_KEYS.SERIES);