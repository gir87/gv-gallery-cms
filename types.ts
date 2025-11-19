export interface Photo {
  id: string;
  url: string; // Base64 data URI
  title: string;
  description: string;
  seriesId: string | null;
  tags: string[];
  createdAt: number;
  width: number;
  height: number;
}

export interface PhotoSeries {
  id: string;
  title: string;
  description: string;
  coverPhotoId: string | null;
  createdAt: number;
}

export type ViewState = 'home' | 'series' | 'admin';

// For the router/navigation
export interface NavigationState {
  view: ViewState;
  seriesId?: string; // If viewing a specific series
}

export enum UploadStatus {
  IDLE,
  COMPRESSING,
  ANALYZING,
  SAVING,
  SUCCESS,
  ERROR
}