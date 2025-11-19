import { Photo, PhotoSeries } from '../types';

// API URL relative to the domain.
const API_URL = '/api.php'; 

const LOCAL_STORAGE_KEYS = {
  TOKEN: 'lumina_token'
};

// --- AUTHENTICATION ---

export const login = async (password: string): Promise<boolean> => {
  try {
    const res = await fetch(`${API_URL}?action=login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password })
    });
    
    if (!res.ok) return false;
    
    const data = await res.json();
    if (data.success) {
      localStorage.setItem(LOCAL_STORAGE_KEYS.TOKEN, data.token);
      return true;
    }
    return false;
  } catch (e) {
    console.error("Login connection failed:", e);
    return false;
  }
};

export const isAuthenticated = (): boolean => {
  // Checks if a token exists client-side. 
  return !!localStorage.getItem(LOCAL_STORAGE_KEYS.TOKEN);
};

export const logout = (): void => {
  localStorage.removeItem(LOCAL_STORAGE_KEYS.TOKEN);
};

export const updatePassword = async (newPassword: string): Promise<boolean> => {
  try {
    const res = await fetch(`${API_URL}?action=change_password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword })
    });
    
    if (!res.ok) throw new Error('API Error');
    const data = await res.json();
    return data.success;
  } catch (e) {
    console.error("Failed to update password:", e);
    return false;
  }
};

// --- DATA FETCHING ---

export const fetchData = async (): Promise<{ photos: Photo[], series: PhotoSeries[] }> => {
  try {
    const res = await fetch(API_URL);
    
    if (!res.ok) {
      throw new Error(`API returned ${res.status}`);
    }

    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("API did not return JSON. Check PHP configuration.");
    }

    const data = await res.json();
    
    const formattedPhotos = (data.photos || []).map((p: any) => ({
      ...p,
      url: p.url 
    }));

    return {
      photos: formattedPhotos,
      series: data.series || []
    };
  } catch (e) {
    console.error("Failed to fetch data from API:", e);
    return { photos: [], series: [] };
  }
};

// --- ACTIONS ---

export const savePhoto = async (photo: Photo): Promise<void> => {
  const res = await fetch(`${API_URL}?action=upload_photo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(photo)
  });
  
  if (!res.ok) throw new Error('Failed to save photo to server');
};

export const updatePhoto = async (photo: Photo): Promise<void> => {
  const res = await fetch(`${API_URL}?action=update_photo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(photo)
  });
  
  if (!res.ok) throw new Error('Failed to update photo on server');
};

export const deletePhoto = async (id: string): Promise<void> => {
  const res = await fetch(`${API_URL}?id=${id}&type=photo`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete photo on server');
};

export const saveSeries = async (series: PhotoSeries): Promise<void> => {
  const res = await fetch(`${API_URL}?action=save_series`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(series)
  });
  
  if (!res.ok) throw new Error('Failed to save series to server');
};

export const deleteSeries = async (id: string): Promise<void> => {
  const res = await fetch(`${API_URL}?id=${id}&type=series`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete series on server');
};