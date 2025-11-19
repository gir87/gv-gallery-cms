import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { AdminDashboard } from './pages/AdminDashboard';
import { PublicView } from './pages/PublicView';
import { Login } from './components/Login';
import { NavigationState, Photo, PhotoSeries } from './types';
import { fetchData, isAuthenticated, logout } from './services/storageService';

function App() {
  const [navState, setNavState] = useState<NavigationState>({ view: 'home' });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Data State
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [series, setSeries] = useState<PhotoSeries[]>([]);

  const loadData = async () => {
    const data = await fetchData();
    setPhotos(data.photos);
    setSeries(data.series);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    setIsAdmin(isAuthenticated());
  }, []);

  const handleNavigate = (view: 'home' | 'series' | 'admin', seriesId?: string) => {
    if (view === 'admin' && !isAdmin) {
       // Just verify session
       if (isAuthenticated()) {
         setIsAdmin(true);
       }
    }
    setNavState({ view, seriesId });
    setSidebarOpen(false);
    window.scrollTo(0, 0);
  };

  const handleLoginSuccess = () => {
    setIsAdmin(true);
  };

  const handleLogout = () => {
    logout();
    setIsAdmin(false);
    setNavState({ view: 'home' });
  };

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar 
        series={series}
        currentView={navState.view}
        currentSeriesId={navState.seriesId}
        onNavigate={handleNavigate}
        isOpen={sidebarOpen}
        toggleOpen={() => setSidebarOpen(!sidebarOpen)}
      />

      <main className="flex-1 min-h-screen ml-0 md:ml-0 transition-all duration-300">
        {/* Mobile Header Spacer */}
        <div className="h-16 md:hidden"></div>

        {loading ? (
           <div className="flex items-center justify-center h-screen">
             <div className="animate-pulse text-neutral-400 tracking-widest text-sm uppercase">Loading Portfolio...</div>
           </div>
        ) : (
          <>
            {navState.view === 'admin' ? (
              isAdmin ? (
                <div className="relative">
                  <button 
                    onClick={handleLogout} 
                    className="absolute top-6 right-6 text-xs text-red-500 hover:text-red-700 uppercase tracking-widest"
                  >
                    Logout
                  </button>
                  <AdminDashboard 
                    photos={photos} 
                    series={series} 
                    refreshData={loadData}
                  />
                </div>
              ) : (
                <Login onLoginSuccess={handleLoginSuccess} />
              )
            ) : (
              <PublicView 
                photos={photos}
                seriesList={series}
                currentSeriesId={navState.seriesId}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;