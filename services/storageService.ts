
import { Photo, PhotoSeries, AboutConfig } from '../types';

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

export const fetchSettings = async (): Promise<AboutConfig> => {
  try {
    const res = await fetch(`${API_URL}?action=get_settings`);
    if (!res.ok) return { title: '', text: '', imageUrl: '' };
    const data = await res.json();
    
    return {
      title: data.about_title || '',
      text: data.about_text || '',
      imageUrl: data.about_image_url || ''
    };
  } catch (e) {
    console.error("Failed to fetch settings", e);
    return { title: '', text: '', imageUrl: '' };
  }
};

// --- ACTIONS ---

export const saveSettings = async (settings: AboutConfig): Promise<boolean> => {
  try {
    const payload = {
      about_title: settings.title,
      about_text: settings.text,
      about_image_url: settings.imageUrl
    };
    const res = await fetch(`${API_URL}?action=save_settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to save settings", e);
    return false;
  }
};

export const uploadAsset = async (base64Image: string, name: string): Promise<string | null> => {
  try {
    const res = await fetch(`${API_URL}?action=upload_asset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64Image, name })
    });
    const data = await res.json();
    return data.success ? data.url : null;
  } catch (e) {
    console.error("Failed to upload asset", e);
    return null;
  }
};

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

export const reorderPhotos = async (idsInOrder: string[]): Promise<void> => {
  const res = await fetch(`${API_URL}?action=reorder_photos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderList: idsInOrder })
  });
  if (!res.ok) throw new Error('Failed to reorder photos');
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
