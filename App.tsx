import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { AdminDashboard } from './pages/AdminDashboard';
import { PublicView } from './pages/PublicView';
import { NavigationState } from './types';
import { getPhotos, getSeries } from './services/storageService';

function App() {
  const [navState, setNavState] = useState<NavigationState>({ view: 'home' });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Data State
  const [photos, setPhotos] = useState(getPhotos());
  const [series, setSeries] = useState(getSeries());

  const refreshData = () => {
    setPhotos(getPhotos());
    setSeries(getSeries());
  };

  const handleNavigate = (view: 'home' | 'series' | 'admin', seriesId?: string) => {
    setNavState({ view, seriesId });
    setSidebarOpen(false);
    window.scrollTo(0, 0);
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

        {navState.view === 'admin' ? (
          <AdminDashboard 
            photos={photos} 
            series={series} 
            refreshData={refreshData}
          />
        ) : (
          <PublicView 
            photos={photos}
            seriesList={series}
            currentSeriesId={navState.seriesId}
          />
        )}
      </main>
    </div>
  );
}

export default App;