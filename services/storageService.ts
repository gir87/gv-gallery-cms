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
  // Real security is handled by the backend API not accepting requests without valid session/auth if you extended it,
  // but for this simple CMS, existence of the token allows UI access.
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
    
    // Ensure we map the data correctly
    // The PHP API returns 'url' relative to domain (e.g. 'uploads/file.jpg')
    // or base64 if it was a legacy upload.
    const formattedPhotos = (data.photos || []).map((p: any) => ({
      ...p,
      // If it's a relative path and doesn't start with data: or http, prepend nothing (browser handles relative)
      // or you could prepend a base domain if needed.
      url: p.url 
    }));

    return {
      photos: formattedPhotos,
      series: data.series || []
    };
  } catch (e) {
    console.error("Failed to fetch data from API:", e);
    // Return empty arrays so the UI doesn't crash, but show nothing
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