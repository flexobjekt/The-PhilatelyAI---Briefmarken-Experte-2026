
import React, { useState, useEffect, useRef } from 'react';
import { Stamp } from '../types';
import { analyzeStamp } from '../services/geminiService';

interface StampCollectionProps {
  collection: Stamp[];
  albums: string[];
  onDelete: (id: string) => void;
  onUpdate: (stamp: Stamp) => void;
  onExport: () => void;
  onAddAlbum: (name: string) => void;
}

type SortOption = 'name' | 'estimatedValue' | 'year' | 'origin' | 'dateAdded' | 'condition';
type SortOrder = 'asc' | 'desc';
type ExpertFilter = 'all' | 'none' | 'pending' | 'appraised';

const StampCollection: React.FC<StampCollectionProps> = ({ 
  collection, 
  albums, 
  onDelete, 
  onUpdate, 
  onExport, 
  onAddAlbum 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAlbum, setSelectedAlbum] = useState('Alle');
  const [selectedStamp, setSelectedStamp] = useState<Stamp | null>(null);
  const [isAddingAlbum, setIsAddingAlbum] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDeepAnalyzing, setIsDeepAnalyzing] = useState(false);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [refreshKeywords, setRefreshKeywords] = useState('');
  
  // Progress states for AI
  const [analysisStatus, setAnalysisStatus] = useState('');
  const [analysisProgress, setAnalysisProgress] = useState(0);
  
  // Advanced Sort & Filter State
  const [sortBy, setSortBy] = useState<SortOption>('dateAdded');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [expertFilter, setExpertFilter] = useState<ExpertFilter>('all');
  
  // Comparison state
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  // Status message rotation logic
  useEffect(() => {
    let interval: number | undefined;
    if (isRefreshing || isDeepAnalyzing) {
      const messages = isDeepAnalyzing 
        ? [
            "Initialisiere Hochpräzisions-Scan...",
            "Analysiere Farbpigmente & Drucktiefe...",
            "Gleiche Papiermerkmale mit Fachdatenbanken ab...",
            "Prüfe Wasserzeichen & Faserstruktur...",
            "Identifiziere Stempelform & Datumsabschlag...",
            "Berechne philatelistischen Seltenheitsfaktor...",
            "Finalisiere technisches Dossier..."
          ]
        : [
            "Verbindung zur PhilatelyAI Cloud...",
            "Gleiche Bilddaten mit Weltkatalogen ab...",
            "Identifiziere Herkunft & Ausgabejahr...",
            "Bewerte optischen Erhaltungszustand...",
            "Extrahiere aktuelle Auktionsergebnisse...",
            "Synchronisiere Marktdaten..."
          ];
      
      let step = 0;
      setAnalysisStatus(messages[0]);
      setAnalysisProgress(5);

      interval = window.setInterval(() => {
        step++;
        if (step < messages.length) {
          setAnalysisStatus(messages[step]);
          setAnalysisProgress(prev => Math.min(prev + (90 / messages.length), 92));
        }
      }, 1500);
    } else {
      setAnalysisProgress(0);
      setAnalysisStatus('');
    }
    return () => clearInterval(interval);
  }, [isRefreshing, isDeepAnalyzing]);

  const getNumericValue = (valStr: string | undefined): number => {
    if (!valStr) return 0;
    let clean = valStr.replace(/[^\d.,]/g, '').trim();
    if (!clean) return 0;

    if (clean.includes('.') && clean.includes(',')) {
      if (clean.lastIndexOf('.') > clean.lastIndexOf(',')) {
        clean = clean.replace(/,/g, '');
      } else {
        clean = clean.replace(/\./g, '').replace(',', '.');
      }
    } else if (clean.includes(',')) {
      clean = clean.replace(',', '.');
    }
    
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
  };

  const getNumericYear = (yearStr: string) => {
    const match = yearStr.match(/\d{4}/);
    return match ? parseInt(match[0]) : 0;
  };

  const getStatusCount = (status: ExpertFilter) => {
    if (status === 'all') return collection.length;
    return collection.filter(s => s.expertStatus === status).length;
  };

  const parseCondition = (conditionText: string) => {
    const categories = ['Zähnung', 'Zentrierung', 'Stempel', 'Erhaltung', 'Status', 'Mängel'];
    const results: { label: string; value: string }[] = [];
    
    categories.forEach(cat => {
      const regex = new RegExp(`${cat}:?\\s*([^.;]+)`, 'i');
      const match = conditionText.match(regex);
      if (match) {
        results.push({ label: cat, value: match[1].trim() });
      }
    });

    return results.length > 0 ? results : null;
  };

  const renderFormattedText = (text: string | undefined) => {
    if (!text) return null;
    return text.split('\n').filter(p => p.trim() !== '').map((para, i) => (
      <p key={i} className="mb-4 last:mb-0 leading-relaxed text-sm">
        {para.trim().startsWith('-') || para.trim().startsWith('•') ? (
          <span className="flex gap-3">
            <span className="text-indigo-400 mt-1">•</span>
            <span>{para.trim().substring(1).trim()}</span>
          </span>
        ) : (
          para
        )}
      </p>
    ));
  };

  const processedItems = [...collection]
    .filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            s.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            s.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesAlbum = selectedAlbum === 'Alle' || s.album === selectedAlbum;
      const matchesExpertStatus = expertFilter === 'all' || s.expertStatus === expertFilter;
      return matchesSearch && matchesAlbum && matchesExpertStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'estimatedValue': {
          const valA = a.expertValuation && a.expertValuation.trim() !== '' ? a.expertValuation : a.estimatedValue;
          const valB = b.expertValuation && b.expertValuation.trim() !== '' ? b.expertValuation : b.estimatedValue;
          comparison = getNumericValue(valA) - getNumericValue(valB);
          break;
        }
        case 'year':
          comparison = getNumericYear(a.year) - getNumericYear(b.year);
          break;
        case 'origin':
          comparison = a.origin.localeCompare(b.origin);
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'condition':
          comparison = a.condition.localeCompare(b.condition);
          break;
        case 'dateAdded':
        default:
          comparison = new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime();
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const handleAddAlbum = () => {
    if (newAlbumName.trim()) {
      onAddAlbum(newAlbumName.trim());
      setNewAlbumName('');
      setIsAddingAlbum(false);
    }
  };

  const openDetail = (stamp: Stamp) => {
    setIsModalLoading(true);
    setSelectedStamp(stamp);
    setTimeout(() => {
      setIsModalLoading(false);
    }, 600);
  };

  const handleRefreshAI = async (deep: boolean = false) => {
    if (!selectedStamp) return;
    deep ? setIsDeepAnalyzing(true) : setIsRefreshing(true);
    try {
      const result = await analyzeStamp(selectedStamp.image, selectedStamp, {
        keywords: refreshKeywords.trim() || undefined,
        deepAnalysis: deep
      });
      setAnalysisProgress(100);
      setTimeout(() => {
        const updated: Stamp = {
          ...selectedStamp,
          ...result,
          estimatedValue: selectedStamp.expertValuation || result.estimatedValue || selectedStamp.estimatedValue
        };
        onUpdate(updated);
        setSelectedStamp(updated);
        setRefreshKeywords('');
      }, 500);
    } catch (error) {
      alert("Fehler bei der KI-Analyse: " + (error instanceof Error ? error.message : "Unbekannter Fehler"));
    } finally {
      setTimeout(() => {
        deep ? setIsDeepAnalyzing(false) : setIsRefreshing(false);
      }, 800);
    }
  };

  const toggleCompare = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setCompareIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const compareStamps = collection.filter(s => compareIds.includes(s.id));

  // Comparison helpers to detect diversity
  const isFieldDiverse = (fieldGetter: (s: Stamp) => string) => {
    if (compareStamps.length <= 1) return false;
    const firstVal = fieldGetter(compareStamps[0]);
    return !compareStamps.every(s => fieldGetter(s) === firstVal);
  };

  const diverseFields = {
    value: isFieldDiverse(s => s.expertValuation || s.estimatedValue),
    origin: isFieldDiverse(s => s.origin),
    year: isFieldDiverse(s => s.year),
    condition: isFieldDiverse(s => s.condition),
    rarity: isFieldDiverse(s => s.rarity),
    printing: isFieldDiverse(s => s.printingMethod || ''),
    paper: isFieldDiverse(s => s.paperType || ''),
  };

  return (
    <div className="space-y-8 pb-32">
      {/* Search & Album Header */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row gap-6 items-center">
          <div className="relative flex-grow w-full">
            <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"></i>
            <input 
              type="text" 
              placeholder="Markenname, Land oder Details durchsuchen..." 
              className="w-full pl-14 pr-6 py-4 bg-slate-50 rounded-2xl border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="flex bg-slate-100 p-1.5 rounded-2xl overflow-x-auto max-w-full no-scrollbar shadow-inner">
              <button 
                onClick={() => setSelectedAlbum('Alle')}
                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${selectedAlbum === 'Alle' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Alle Alben
              </button>
              {albums.map(album => (
                <button 
                  key={album}
                  onClick={() => setSelectedAlbum(album)}
                  className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${selectedAlbum === album ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {album}
                </button>
              ))}
              <button 
                onClick={() => setIsAddingAlbum(true)}
                className="px-4 py-2 text-slate-400 hover:text-indigo-600 transition-colors"
                title="Neues Album erstellen"
              >
                <i className="fas fa-plus"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Status Filter Row */}
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-50">
          <span className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Prüfungsstatus:</span>
          <div className="flex flex-wrap gap-2">
            {(['all', 'appraised', 'pending', 'none'] as ExpertFilter[]).map((status) => (
              <button
                key={status}
                onClick={() => setExpertFilter(status)}
                className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all border flex items-center gap-2 ${
                  expertFilter === status 
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                    : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'
                }`}
              >
                {status === 'all' && 'Alle'}
                {status === 'appraised' && 'Zertifiziert'}
                {status === 'pending' && 'In Prüfung'}
                {status === 'none' && 'Nur KI'}
                <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-black ${expertFilter === status ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  {getStatusCount(status)}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Advanced Sort Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-100/40 p-5 rounded-[2rem] border border-slate-200/40">
        <div className="flex items-center gap-4 w-full sm:w-auto overflow-x-auto no-scrollbar pb-2 sm:pb-0">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2 whitespace-nowrap">Sortierung</span>
          <div className="flex bg-white rounded-xl p-1 shadow-sm border border-slate-200 min-w-max">
            {(['dateAdded', 'estimatedValue', 'year', 'origin', 'name', 'condition'] as SortOption[]).map((option) => (
              <button
                key={option}
                onClick={() => setSortBy(option)}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${sortBy === option ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {option === 'dateAdded' && 'Neuheit'}
                {option === 'estimatedValue' && 'Wert'}
                {option === 'year' && 'Jahr'}
                {option === 'origin' && 'Land'}
                {option === 'name' && 'Name'}
                {option === 'condition' && 'Zustand'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto">
          <button
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="flex-grow sm:flex-grow-0 bg-white border border-slate-200 text-slate-700 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
          >
            {sortOrder === 'asc' ? <i className="fas fa-sort-amount-up"></i> : <i className="fas fa-sort-amount-down"></i>}
            {sortOrder === 'asc' ? 'A-Z / Auf' : 'Z-A / Ab'}
          </button>
          <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden sm:block">
            {processedItems.length} Treffer
          </p>
        </div>
      </div>

      {/* Grid */}
      {processedItems.length === 0 ? (
        <div className="py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
          <div className="w-24 h-24 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-box-open text-4xl"></i>
          </div>
          <h3 className="text-xl font-bold text-slate-800">Keine Fundstücke</h3>
          <p className="text-slate-400 mt-2">Passen Sie Ihre Filter oder Suche an.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {processedItems.map(stamp => {
            const isSelectedForCompare = compareIds.includes(stamp.id);
            return (
              <div 
                key={stamp.id}
                onClick={() => openDetail(stamp)}
                className={`group bg-white rounded-[2.5rem] overflow-hidden border transition-all duration-500 cursor-pointer flex flex-col ${isSelectedForCompare ? 'ring-4 ring-indigo-500 shadow-2xl border-indigo-200' : 'border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2'}`}
              >
                <div className="aspect-square overflow-hidden bg-slate-50 relative">
                  <img src={stamp.image} alt={stamp.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div 
                    onClick={(e) => toggleCompare(e, stamp.id)}
                    className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 transition-all ${isSelectedForCompare ? 'bg-indigo-600 border-white text-white' : 'bg-white/90 border-transparent text-slate-300 hover:text-indigo-500'}`}
                  >
                    <i className={`fas ${isSelectedForCompare ? 'fa-check' : 'fa-plus'} text-[10px]`}></i>
                  </div>
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-800 shadow-sm">
                      {stamp.album}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-slate-800 leading-tight pr-4 line-clamp-2">{stamp.name}</h3>
                    <span className="text-indigo-600 font-black text-sm whitespace-nowrap mt-0.5">{stamp.expertValuation || stamp.estimatedValue}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-tighter mb-4">
                    <span>{stamp.origin}</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span>{getNumericYear(stamp.year) || 'N/A'}</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span className="truncate max-w-[80px]">{stamp.condition}</span>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${stamp.expertStatus === 'appraised' ? 'bg-emerald-500' : stamp.expertStatus === 'pending' ? 'bg-amber-500 animate-pulse' : 'bg-slate-300'}`}></div>
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">
                        {stamp.expertStatus === 'appraised' ? 'Verifiziert' : stamp.expertStatus === 'pending' ? 'Prüfung...' : 'KI-Ergebnis'}
                      </span>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDelete(stamp.id); }}
                      className="text-slate-300 hover:text-red-500 transition-colors p-2"
                    >
                      <i className="fas fa-trash-alt text-sm"></i>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Comparison Bar */}
      {compareIds.length > 1 && !showComparison && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] bg-slate-900 text-white px-8 py-5 rounded-[2.5rem] shadow-2xl flex items-center gap-8 animate-in slide-in-from-bottom-4">
          <div className="flex -space-x-3">
            {compareStamps.slice(0, 4).map(s => (
              <img key={s.id} src={s.image} className="w-10 h-10 rounded-full border-2 border-slate-900 object-cover shadow-lg" alt="preview" />
            ))}
            {compareIds.length > 4 && (
              <div className="w-10 h-10 rounded-full bg-indigo-600 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold">
                +{compareIds.length - 4}
              </div>
            )}
          </div>
          <div className="h-8 w-px bg-slate-700"></div>
          <div>
            <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Vergleich bereit</p>
            <p className="text-sm font-bold">{compareIds.length} Marken ausgewählt</p>
          </div>
          <button 
            onClick={() => setShowComparison(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95"
          >
            Vergleichen
          </button>
          <button 
            onClick={() => setCompareIds([])}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {/* Comparison Overlay */}
      {showComparison && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-[200] flex flex-col p-6 lg:p-12 overflow-hidden">
          <div className="flex items-center justify-between mb-12 flex-shrink-0">
            <div>
              <h2 className="text-3xl lg:text-5xl serif-title text-white">Side-by-Side Vergleich</h2>
              <div className="flex items-center gap-3 mt-2">
                <p className="text-indigo-400 font-bold uppercase text-xs tracking-widest">Detaillierte Gegenüberstellung der Top-Merkmale</p>
                <div className="flex items-center gap-2 bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-[9px] font-black uppercase">
                  <i className="fas fa-circle-exclamation"></i> Unterschiede markiert
                </div>
              </div>
            </div>
            <button 
              onClick={() => setShowComparison(false)}
              className="w-16 h-16 bg-white/10 hover:bg-red-500 text-white rounded-3xl flex items-center justify-center transition-all group"
            >
              <i className="fas fa-times text-2xl group-hover:scale-110"></i>
            </button>
          </div>

          <div className="flex-grow overflow-x-auto no-scrollbar pb-12">
            <div className="flex gap-8 min-w-max h-full">
              {compareStamps.map(stamp => (
                <div key={stamp.id} className="w-[340px] bg-white rounded-[3rem] p-8 flex flex-col shadow-2xl animate-in zoom-in-95 duration-500">
                  <div className="aspect-square bg-slate-50 rounded-[2.5rem] overflow-hidden mb-8 border border-slate-100 shadow-inner">
                    <img src={stamp.image} className="w-full h-full object-contain" alt={stamp.name} />
                  </div>
                  <div className="space-y-6 flex-grow">
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 leading-tight mb-2 line-clamp-2 min-h-[3.5rem]">{stamp.name}</h3>
                      <p className="text-indigo-600 font-black text-xs uppercase tracking-widest">{stamp.album}</p>
                    </div>
                    
                    <div className="space-y-4">
                      {/* Value Cell */}
                      <div className={`p-5 rounded-2xl border transition-all ${diverseFields.value ? 'bg-amber-50 border-amber-200 shadow-sm ring-1 ring-amber-200' : 'bg-emerald-50 border-emerald-100/50'}`}>
                        <div className="flex justify-between items-start mb-1">
                          <p className={`text-[10px] font-black uppercase tracking-widest ${diverseFields.value ? 'text-amber-600' : 'text-emerald-500'}`}>Wert</p>
                          {diverseFields.value && <i className="fas fa-not-equal text-amber-400 text-[10px]"></i>}
                        </div>
                        <p className={`text-xl font-black ${diverseFields.value ? 'text-amber-900' : 'text-emerald-900'}`}>{stamp.expertValuation || stamp.estimatedValue}</p>
                      </div>

                      {/* Origin/Year Cell */}
                      <div className={`p-5 rounded-2xl border transition-all ${(diverseFields.origin || diverseFields.year) ? 'bg-amber-50 border-amber-200 shadow-sm ring-1 ring-amber-200' : 'bg-slate-50 border-slate-100'}`}>
                        <div className="flex justify-between items-start mb-1">
                          <p className={`text-[10px] font-black uppercase tracking-widest ${(diverseFields.origin || diverseFields.year) ? 'text-amber-600' : 'text-slate-400'}`}>Herkunft / Jahr</p>
                          {(diverseFields.origin || diverseFields.year) && <i className="fas fa-not-equal text-amber-400 text-[10px]"></i>}
                        </div>
                        <p className={`text-sm font-bold ${(diverseFields.origin || diverseFields.year) ? 'text-amber-900' : 'text-slate-800'}`}>
                          <span className={diverseFields.origin ? 'underline decoration-amber-300 underline-offset-4' : ''}>{stamp.origin}</span>, 
                          <span className={diverseFields.year ? ' ml-1 underline decoration-amber-300 underline-offset-4' : ' ml-1'}>{stamp.year}</span>
                        </p>
                      </div>

                      {/* Condition Cell */}
                      <div className={`p-5 rounded-2xl border transition-all ${diverseFields.condition ? 'bg-amber-50 border-amber-200 shadow-sm ring-1 ring-amber-200' : 'bg-indigo-50/30 border-indigo-100/20'}`}>
                        <div className="flex justify-between items-start mb-1">
                          <p className={`text-[10px] font-black uppercase tracking-widest ${diverseFields.condition ? 'text-amber-600' : 'text-indigo-400'}`}>Zustand</p>
                          {diverseFields.condition && <i className="fas fa-not-equal text-amber-400 text-[10px]"></i>}
                        </div>
                        <p className={`text-sm font-bold leading-snug ${diverseFields.condition ? 'text-amber-900' : 'text-indigo-900'}`}>{stamp.condition}</p>
                      </div>

                      {/* Rarity Cell */}
                      <div className={`p-5 rounded-2xl border transition-all ${diverseFields.rarity ? 'bg-amber-50 border-amber-200 shadow-sm ring-1 ring-amber-200' : 'bg-slate-50 border-slate-100'}`}>
                        <div className="flex justify-between items-start mb-1">
                          <p className={`text-[10px] font-black uppercase tracking-widest ${diverseFields.rarity ? 'text-amber-600' : 'text-slate-400'}`}>Rarität</p>
                          {diverseFields.rarity && <i className="fas fa-not-equal text-amber-400 text-[10px]"></i>}
                        </div>
                        <p className={`text-sm font-bold ${diverseFields.rarity ? 'text-amber-900' : 'text-slate-800'}`}>{stamp.rarity}</p>
                      </div>

                      {/* Technical (Deep) details if available */}
                      {(stamp.printingMethod || stamp.paperType) && (
                        <div className={`p-5 rounded-2xl border transition-all ${(diverseFields.printing || diverseFields.paper) ? 'bg-amber-50 border-amber-200 shadow-sm ring-1 ring-amber-200' : 'bg-slate-50/50 border-slate-100'}`}>
                          <div className="flex justify-between items-start mb-2">
                            <p className={`text-[10px] font-black uppercase tracking-widest ${(diverseFields.printing || diverseFields.paper) ? 'text-amber-600' : 'text-slate-400'}`}>Technische Daten</p>
                            {(diverseFields.printing || diverseFields.paper) && <i className="fas fa-not-equal text-amber-400 text-[10px]"></i>}
                          </div>
                          <div className="space-y-1">
                            {stamp.printingMethod && <p className="text-[11px] font-medium text-slate-600"><span className="text-slate-400 mr-1">Druck:</span> {stamp.printingMethod}</p>}
                            {stamp.paperType && <p className="text-[11px] font-medium text-slate-600"><span className="text-slate-400 mr-1">Papier:</span> {stamp.paperType}</p>}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={() => setCompareIds(prev => prev.filter(i => i !== stamp.id))}
                    className="mt-8 text-red-400 hover:text-red-600 transition-colors text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 py-3 bg-red-50/0 hover:bg-red-50 rounded-xl"
                  >
                    <i className="fas fa-minus-circle"></i> Aus Vergleich entfernen
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedStamp && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-6xl max-h-[92vh] overflow-y-auto relative animate-in zoom-in-95 duration-300 shadow-2xl no-scrollbar">
            <button 
              onClick={() => { setSelectedStamp(null); setRefreshKeywords(''); setIsModalLoading(false); }}
              className="absolute top-8 right-8 w-12 h-12 bg-white/80 backdrop-blur text-slate-400 rounded-2xl flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all shadow-sm z-[110]"
            >
              <i className="fas fa-times text-xl"></i>
            </button>

            {isModalLoading ? (
              <div className="flex flex-col items-center justify-center min-h-[600px] p-20 text-center">
                <div className="w-20 h-20 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-8"></div>
                <h3 className="text-2xl font-black text-slate-800 mb-2">Synchronisiere Datenbanken...</h3>
                <p className="text-slate-400 font-medium">Lade philatelistische Details für {selectedStamp.name}</p>
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row min-h-[700px] relative">
                {(isRefreshing || isDeepAnalyzing) && (
                  <div className="absolute inset-0 bg-white/90 backdrop-blur-md z-[105] flex flex-col items-center justify-center transition-all animate-in fade-in duration-300 p-8">
                    <div className="max-w-md w-full text-center space-y-10">
                      <div className="relative inline-block">
                        <div className="w-24 h-24 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <i className={`fas ${isDeepAnalyzing ? 'fa-microscope' : 'fa-robot'} text-indigo-600 text-xl animate-pulse`}></i>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">{isDeepAnalyzing ? 'Tiefen-Analyse' : 'KI-Analyse'}</h4>
                        <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden w-full max-w-xs mx-auto">
                          <div 
                            className="absolute top-0 left-0 h-full bg-indigo-600 transition-all duration-500 ease-out rounded-full shadow-[0_0_10px_rgba(79,70,229,0.5)]"
                            style={{ width: `${analysisProgress}%` }}
                          ></div>
                        </div>
                        <p className="text-indigo-600 font-black text-[10px] uppercase tracking-[0.2em] h-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                          {analysisStatus}
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                           <p className="text-[10px] font-bold text-slate-700">{Math.round(analysisProgress)}%</p>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">CPU Last</p>
                           <p className="text-[10px] font-bold text-slate-700">Aktiv</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="lg:w-1/2 bg-slate-50 p-8 lg:p-12 flex items-center justify-center relative">
                  <div className="relative group max-w-md w-full">
                    <img src={selectedStamp.image} alt={selectedStamp.name} className="w-full h-auto rounded-[2rem] shadow-[0_48px_80px_-16px_rgba(0,0,0,0.3)] border-8 border-white" />
                  </div>
                </div>
                <div className="lg:w-1/2 p-8 lg:p-16 bg-white">
                  <div className="mb-10">
                    <div className="flex flex-wrap items-center gap-3 mb-6">
                      <span className="bg-slate-100 text-slate-600 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em]">{selectedStamp.album}</span>
                      <span className="bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em]">{selectedStamp.rarity}</span>
                    </div>
                    <h2 className="text-5xl serif-title text-slate-900 mb-6 leading-tight">{selectedStamp.name}</h2>
                    <div className="flex flex-wrap gap-8 text-slate-600 font-semibold text-sm">
                      <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl">
                        <i className="fas fa-globe-americas text-indigo-500"></i>
                        <span>{selectedStamp.origin}</span>
                      </div>
                      <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl">
                        <i className="fas fa-calendar-check text-indigo-500"></i>
                        <span>Ausgabe {selectedStamp.year}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
                    <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100/50 shadow-sm">
                      <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                        <i className="fas fa-chart-line"></i> Aktueller Marktwert
                      </p>
                      <p className="text-4xl font-black text-emerald-900">{selectedStamp.expertValuation || selectedStamp.estimatedValue}</p>
                    </div>
                    <div className="p-6 bg-indigo-50/30 rounded-[2rem] border border-indigo-100/30 shadow-sm">
                      <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                        <i className="fas fa-search-plus"></i> Zustands-Profil
                      </p>
                      <p className="text-xl font-bold text-indigo-900 leading-tight">{selectedStamp.condition}</p>
                    </div>
                  </div>

                  {/* Technical Specifications Section */}
                  {(selectedStamp.printingMethod || selectedStamp.paperType || selectedStamp.cancellationType) && (
                    <section className="mb-12 space-y-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-xs">
                          <i className="fas fa-microscope"></i>
                        </div>
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Technische Spezifikationen</h4>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          <span className="text-[8px] font-black uppercase text-indigo-400 block mb-1">Druckverfahren</span>
                          <span className="text-xs font-bold text-slate-700">{selectedStamp.printingMethod || 'Nicht analysiert'}</span>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          <span className="text-[8px] font-black uppercase text-indigo-400 block mb-1">Papiersorte</span>
                          <span className="text-xs font-bold text-slate-700">{selectedStamp.paperType || 'Nicht analysiert'}</span>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          <span className="text-[8px] font-black uppercase text-indigo-400 block mb-1">Stempelform</span>
                          <span className="text-xs font-bold text-slate-700">{selectedStamp.cancellationType || 'Nicht analysiert'}</span>
                        </div>
                      </div>
                    </section>
                  )}

                  <div className="space-y-12">
                    <section className="space-y-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center text-xs">
                          <i className="fas fa-clipboard-check"></i>
                        </div>
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Zustandsbericht</h4>
                      </div>
                      <div className="grid gap-4">
                        <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-6">
                           <div className="flex gap-6">
                             <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex-shrink-0 flex items-center justify-center">
                               <i className="fas fa-robot text-lg"></i>
                             </div>
                             <div className="flex-1">
                               <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">KI-Visuelle Analyse</h5>
                               <p className="text-slate-700 text-sm font-semibold leading-relaxed mb-4">{selectedStamp.condition}</p>
                               {parseCondition(selectedStamp.condition) && (
                                 <div className="grid grid-cols-2 gap-2 mt-4">
                                   {parseCondition(selectedStamp.condition)!.map((point, i) => (
                                     <div key={i} className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                                       <span className="text-[9px] font-black uppercase text-indigo-400 block tracking-tighter">{point.label}</span>
                                       <span className="text-[11px] font-bold text-slate-600">{point.value}</span>
                                     </div>
                                   ))}
                                 </div>
                               )}
                             </div>
                           </div>
                        </div>
                      </div>
                    </section>

                    {selectedStamp.historicalContext && (
                      <section className="space-y-4">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center text-xs">
                            <i className="fas fa-landmark"></i>
                          </div>
                          <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Historischer Hintergrund</h4>
                        </div>
                        <div className="p-8 bg-indigo-50/30 rounded-[2.5rem] border border-indigo-100/30">
                          <div className="text-slate-700 prose-sm">
                            {renderFormattedText(selectedStamp.historicalContext)}
                          </div>
                        </div>
                      </section>
                    )}

                    <div className="pt-10 border-t border-slate-100 space-y-8">
                      {/* Deep Analysis Action - Prominent am Ende */}
                      <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden group shadow-2xl">
                        <div className="relative z-10 flex flex-col items-center text-center gap-6">
                          <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform">
                            <i className="fas fa-microscope"></i>
                          </div>
                          <div>
                            <h4 className="text-xl font-black uppercase tracking-[0.2em] mb-3">Philatelistische Tiefen-Analyse</h4>
                            <p className="text-sm text-slate-400 max-w-sm mx-auto">Starten Sie eine hochpräzise Untersuchung von Druckmethode, Papiertyp und Stempelform durch unsere spezialisierte KI.</p>
                          </div>
                          <button 
                            onClick={() => handleRefreshAI(true)}
                            disabled={isDeepAnalyzing}
                            className="bg-white text-slate-900 hover:bg-indigo-50 px-10 py-5 rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all shadow-xl disabled:opacity-50 flex items-center gap-4 group/btn"
                          >
                            <i className={`fas fa-bolt ${isDeepAnalyzing ? 'animate-pulse text-indigo-500' : 'group-hover/btn:scale-125 transition-transform'}`}></i>
                            {isDeepAnalyzing ? 'Digitale Mikroskopie läuft...' : 'Jetzt Analyse starten'}
                          </button>
                        </div>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
                      </div>

                      <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 group">
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h4 className="text-xs font-black uppercase text-slate-800 tracking-widest">KI-Re-Analyse</h4>
                            <p className="text-[10px] text-slate-400 font-bold mt-1">Allgemeine Daten aktualisieren</p>
                          </div>
                          <button 
                            onClick={() => handleRefreshAI(false)}
                            disabled={isRefreshing}
                            className="bg-white text-indigo-600 hover:bg-indigo-600 hover:text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-100 transition-all shadow-sm flex items-center gap-3 disabled:opacity-50"
                          >
                            <i className={`fas fa-sync-alt ${isRefreshing ? 'animate-spin' : ''}`}></i>
                            Standard Refresh
                          </button>
                        </div>
                        <input 
                          type="text" 
                          placeholder="Zusätzliche Merkmale eingeben (z.B. Text am Rand)..." 
                          className="w-full bg-white border border-slate-200 p-4 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                          value={refreshKeywords}
                          onChange={(e) => setRefreshKeywords(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Album Creation Dialog */}
      {isAddingAlbum && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsAddingAlbum(false)}></div>
          <div className="bg-indigo-600 p-10 rounded-[3rem] text-white flex flex-col items-center gap-8 relative z-10 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-white/20 rounded-[2rem] flex items-center justify-center text-3xl">
              <i className="fas fa-folder-plus"></i>
            </div>
            <div className="text-center">
              <h4 className="font-black text-2xl mb-2">Neues Album erstellen</h4>
            </div>
            <div className="w-full space-y-4">
              <input 
                type="text" 
                placeholder="Name des Albums..." 
                className="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-4 outline-none focus:bg-white focus:text-slate-800 transition-all text-center font-bold text-lg"
                value={newAlbumName}
                onChange={(e) => setNewAlbumName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddAlbum()}
                autoFocus
              />
              <button onClick={handleAddAlbum} className="w-full bg-white text-indigo-600 py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:bg-indigo-50 transition-all">Erstellen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StampCollection;
