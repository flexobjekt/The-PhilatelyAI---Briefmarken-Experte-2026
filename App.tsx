
import React, { useState, useEffect } from 'react';
import { AppView, Stamp } from './types';
import Dashboard from './components/Dashboard';
import StampScanner from './components/StampScanner';
import StampCollection from './components/StampCollection';
import ExpertAppraisal from './components/ExpertAppraisal';
import Navigation from './components/Navigation';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [collection, setCollection] = useState<Stamp[]>([]);
  const [albums, setAlbums] = useState<string[]>(['Allgemein', 'Europa', 'Übersee', 'Seltenheiten']);

  useEffect(() => {
    const savedCollection = localStorage.getItem('stamp_collection');
    const savedAlbums = localStorage.getItem('stamp_albums');
    if (savedCollection) {
      try {
        setCollection(JSON.parse(savedCollection));
      } catch (e) { console.error("Error loading collection", e); }
    }
    if (savedAlbums) {
      try {
        setAlbums(JSON.parse(savedAlbums));
      } catch (e) { console.error("Error loading albums", e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('stamp_collection', JSON.stringify(collection));
  }, [collection]);

  useEffect(() => {
    localStorage.setItem('stamp_albums', JSON.stringify(albums));
  }, [albums]);

  const addToCollection = (stamp: Stamp) => {
    setCollection(prev => [stamp, ...prev]);
    setCurrentView('collection');
  };

  const removeFromCollection = (id: string) => {
    if (window.confirm('Marke unwiderruflich aus der Sammlung löschen?')) {
      setCollection(prev => prev.filter(s => s.id !== id));
    }
  };

  const updateStamp = (updated: Stamp) => {
    setCollection(prev => prev.map(s => s.id === updated.id ? updated : s));
  };

  const addAlbum = (name: string) => {
    if (name && !albums.includes(name)) {
      setAlbums([...albums, name]);
    }
  };

  const exportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(collection, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `PhilatelyAI_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard collection={collection} onViewChange={setCurrentView} />;
      case 'scanner':
        return <StampScanner onSave={addToCollection} onCancel={() => setCurrentView('dashboard')} albums={albums} />;
      case 'collection':
        return (
          <StampCollection 
            collection={collection} 
            onDelete={removeFromCollection} 
            onUpdate={updateStamp} 
            albums={albums}
            onExport={exportData}
            onAddAlbum={addAlbum}
          />
        );
      case 'appraisal':
        return <ExpertAppraisal collection={collection} onUpdate={updateStamp} />;
      default:
        return <Dashboard collection={collection} onViewChange={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen pb-24 md:pb-0 md:pl-64 flex flex-col bg-slate-50">
      <Navigation currentView={currentView} onViewChange={setCurrentView} />

      <main className="flex-grow p-4 md:p-10 max-w-7xl mx-auto w-full">
        <header className="mb-10 flex justify-between items-center">
          <div>
            <h1 className="text-3xl md:text-5xl serif-title text-slate-900 tracking-tight">
              {currentView === 'dashboard' && 'Status-Zentrum'}
              {currentView === 'scanner' && 'Digitaler Erfasser'}
              {currentView === 'collection' && 'Privates Archiv'}
              {currentView === 'appraisal' && 'Wertermittlung'}
            </h1>
            <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mt-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              PhilatelyAI • Live Intelligence
            </p>
          </div>
          <div className="hidden md:flex gap-4">
            <button 
              onClick={exportData}
              className="bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all"
            >
              <i className="fas fa-file-export mr-2"></i> Export
            </button>
            <button 
              onClick={() => setCurrentView('scanner')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all"
            >
              <i className="fas fa-plus mr-2"></i> Neu Hinzufügen
            </button>
          </div>
        </header>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          {renderView()}
        </div>
      </main>

      {currentView !== 'scanner' && (
        <button 
          onClick={() => setCurrentView('scanner')}
          className="md:hidden fixed bottom-28 right-6 w-16 h-16 bg-indigo-600 text-white rounded-3xl shadow-2xl flex items-center justify-center z-50 hover:scale-110 active:scale-95 transition-all"
        >
          <i className="fas fa-camera text-2xl"></i>
        </button>
      )}

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 px-6 py-5 flex justify-between items-center z-40">
        <button onClick={() => setCurrentView('dashboard')} className={`flex flex-col items-center transition-all ${currentView === 'dashboard' ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}>
          <i className="fas fa-th-large text-xl"></i>
          <span className="text-[9px] mt-1 font-black uppercase tracking-tighter">Status</span>
        </button>
        <button onClick={() => setCurrentView('collection')} className={`flex flex-col items-center transition-all ${currentView === 'collection' ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}>
          <i className="fas fa-archive text-xl"></i>
          <span className="text-[9px] mt-1 font-black uppercase tracking-tighter">Archiv</span>
        </button>
        <div className="w-12"></div>
        <button onClick={() => setCurrentView('appraisal')} className={`flex flex-col items-center transition-all ${currentView === 'appraisal' ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}>
          <i className="fas fa-certificate text-xl"></i>
          <span className="text-[9px] mt-1 font-black uppercase tracking-tighter">Werte</span>
        </button>
      </div>
    </div>
  );
};

export default App;
