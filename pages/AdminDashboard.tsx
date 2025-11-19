import React, { useState, useRef } from 'react';
import { Photo, PhotoSeries, UploadStatus } from '../types';
import { compressImage, generateId } from '../utils/imageHelpers';
import { savePhoto, deletePhoto, saveSeries, deleteSeries } from '../services/storageService';

interface AdminDashboardProps {
  photos: Photo[];
  series: PhotoSeries[];
  refreshData: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ photos, series, refreshData }) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'manage' | 'series'>('upload');

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <header className="mb-10 border-b border-neutral-200 pb-6">
        <h2 className="text-3xl font-serif font-medium mb-2">CMS Dashboard</h2>
        <p className="text-neutral-500 text-sm">Manage your portfolio content.</p>
      </header>

      {/* Tabs */}
      <div className="flex space-x-6 mb-8">
        {['upload', 'manage', 'series'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`pb-2 text-sm uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === tab 
                ? 'border-neutral-900 text-neutral-900' 
                : 'border-transparent text-neutral-400 hover:text-neutral-600'
            }`}
          >
            {tab === 'manage' ? 'All Photos' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="min-h-[500px]">
        {activeTab === 'upload' && <UploadPanel series={series} onSuccess={refreshData} />}
        {activeTab === 'manage' && <ManagePhotos photos={photos} onDelete={async (id) => { await deletePhoto(id); refreshData(); }} />}
        {activeTab === 'series' && <ManageSeries series={series} photos={photos} onUpdate={refreshData} />}
      </div>
    </div>
  );
};

// --- Sub Components ---

const UploadPanel: React.FC<{ series: PhotoSeries[]; onSuccess: () => void }> = ({ series, onSuccess }) => {
  const [status, setStatus] = useState<UploadStatus>(UploadStatus.IDLE);
  const [preview, setPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: '',
    seriesId: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus(UploadStatus.COMPRESSING);
    try {
      // We only need base64 for the upload preview and saving
      const { base64 } = await compressImage(file);
      setPreview(base64);
      
      // Use filename as default title (remove extension)
      const defaultTitle = file.name.replace(/\.[^/.]+$/, "");
      
      setFormData(prev => ({
        ...prev,
        title: defaultTitle,
        description: '',
        tags: ''
      }));
      
      setStatus(UploadStatus.IDLE);
    } catch (error) {
      console.error(error);
      setStatus(UploadStatus.ERROR);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!preview) return;

    setStatus(UploadStatus.SAVING);

    const newPhoto: Photo = {
      id: generateId(),
      url: preview, // This is the base64 string
      title: formData.title,
      description: formData.description,
      seriesId: formData.seriesId || null,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      createdAt: Date.now(),
      width: 0, 
      height: 0
    };

    await savePhoto(newPhoto);
    
    // Reset
    setPreview(null);
    setFormData({ title: '', description: '', tags: '', seriesId: '' });
    if (fileInputRef.current) fileInputRef.current.value = '';
    setStatus(UploadStatus.SUCCESS);
    setTimeout(() => {
      setStatus(UploadStatus.IDLE);
      onSuccess();
    }, 1500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      {/* Left: Preview & Input */}
      <div>
        <div 
          className={`
            border-2 border-dashed rounded-xl h-80 flex flex-col items-center justify-center
            transition-colors relative overflow-hidden
            ${preview ? 'border-neutral-300 bg-neutral-50' : 'border-neutral-300 hover:border-neutral-400 bg-neutral-50'}
          `}
        >
          {preview ? (
             <img src={preview} alt="Preview" className="w-full h-full object-contain" />
          ) : (
            <div className="text-center p-6">
              <svg className="w-12 h-12 text-neutral-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-neutral-500">Click below to select an image</p>
            </div>
          )}
          
          <input 
            ref={fileInputRef}
            type="file" 
            accept="image/*" 
            onChange={handleFileChange} 
            className="absolute inset-0 opacity-0 cursor-pointer"
            disabled={status === UploadStatus.COMPRESSING}
          />
        </div>
        
        {status === UploadStatus.SUCCESS && (
          <div className="mt-4 text-green-600 bg-green-50 p-3 rounded-lg text-sm text-center">
            Photo uploaded successfully!
          </div>
        )}
      </div>

      {/* Right: Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Title</label>
          <input 
            type="text" 
            value={formData.title}
            onChange={e => setFormData({...formData, title: e.target.value})}
            className="w-full border-b border-neutral-200 py-2 focus:outline-none focus:border-neutral-900 bg-transparent font-serif text-xl placeholder-neutral-300"
            placeholder="Untitled"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Description</label>
          <textarea 
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
            className="w-full border border-neutral-200 rounded-md p-3 focus:outline-none focus:border-neutral-900 bg-transparent text-sm h-24 placeholder-neutral-300"
            placeholder="Enter photo description..."
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Assign to Series</label>
          <select 
            value={formData.seriesId}
            onChange={e => setFormData({...formData, seriesId: e.target.value})}
            className="w-full border border-neutral-200 rounded-md p-2 focus:outline-none focus:border-neutral-900 bg-transparent text-sm"
          >
            <option value="">No Series (Single Photo)</option>
            {series.map(s => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Tags</label>
          <input 
            type="text" 
            value={formData.tags}
            onChange={e => setFormData({...formData, tags: e.target.value})}
            className="w-full border-b border-neutral-200 py-2 focus:outline-none focus:border-neutral-900 bg-transparent text-sm text-neutral-600 placeholder-neutral-300"
            placeholder="nature, bw, portrait..."
          />
        </div>

        <button 
          type="submit" 
          disabled={!preview || status === UploadStatus.SAVING}
          className={`
            w-full py-3 text-sm font-bold uppercase tracking-widest transition-colors mt-4
            ${!preview ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed' : 'bg-neutral-900 text-white hover:bg-neutral-700'}
          `}
        >
          {status === UploadStatus.SAVING ? 'Saving...' : 'Publish Photo'}
        </button>
      </form>
    </div>
  );
};

const ManagePhotos: React.FC<{ photos: Photo[]; onDelete: (id: string) => Promise<void> }> = ({ photos, onDelete }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {photos.map(photo => (
        <div key={photo.id} className="relative group aspect-square bg-neutral-100 overflow-hidden">
          <img src={photo.url} className="w-full h-full object-cover" alt={photo.title} />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
            <button 
              onClick={async (e) => {
                e.stopPropagation(); 
                e.preventDefault();
                if(window.confirm('Delete this photo?')) {
                  await onDelete(photo.id);
                }
              }}
              className="bg-white text-red-600 px-4 py-2 rounded-md text-xs font-bold uppercase hover:bg-red-50 transition-colors cursor-pointer z-20 shadow-lg"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
      {photos.length === 0 && <p className="col-span-full text-neutral-400 text-sm">No photos uploaded yet.</p>}
    </div>
  );
};

const ManageSeries: React.FC<{ series: PhotoSeries[]; photos: Photo[]; onUpdate: () => void }> = ({ series, photos, onUpdate }) => {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await saveSeries({
      id: generateId(),
      title: name,
      description: desc,
      coverPhotoId: null,
      createdAt: Date.now()
    });
    setName('');
    setDesc('');
    setSaving(false);
    onUpdate();
  };

  return (
    <div className="space-y-12">
      {/* Create New */}
      <div className="bg-neutral-50 p-6 rounded-xl border border-neutral-100">
        <h3 className="font-serif text-lg mb-4">Create New Series</h3>
        <form onSubmit={handleCreate} className="flex flex-col md:flex-row gap-4">
          <input 
            placeholder="Series Title" 
            className="flex-1 p-2 border border-neutral-200 rounded"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
          <input 
            placeholder="Short Description" 
            className="flex-2 p-2 border border-neutral-200 rounded"
            value={desc}
            onChange={e => setDesc(e.target.value)}
          />
          <button 
            type="submit" 
            disabled={saving}
            className="bg-neutral-900 text-white px-6 py-2 rounded text-sm uppercase tracking-wider disabled:opacity-50"
          >
            {saving ? 'Creating...' : 'Create'}
          </button>
        </form>
      </div>

      {/* List */}
      <div className="space-y-4">
        {series.map(s => (
          <div key={s.id} className="flex items-center justify-between p-4 border border-neutral-100 rounded-lg hover:shadow-sm transition-shadow">
            <div>
              <h4 className="font-serif text-xl">{s.title}</h4>
              <p className="text-neutral-500 text-sm">{s.description}</p>
              <span className="text-xs text-neutral-400 mt-1 block">
                {photos.filter(p => p.seriesId === s.id).length} photos
              </span>
            </div>
            <button 
              onClick={async () => {
                if(window.confirm('Delete this series? Photos will remain but be unassigned.')) {
                  await deleteSeries(s.id);
                  onUpdate();
                }
              }}
              className="text-red-400 hover:text-red-600 text-sm uppercase tracking-wider"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};