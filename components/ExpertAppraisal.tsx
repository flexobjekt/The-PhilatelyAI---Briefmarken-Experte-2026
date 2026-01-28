
import React, { useState } from 'react';
import { Stamp } from '../types';

interface ExpertAppraisalProps {
  collection: Stamp[];
  onUpdate: (stamp: Stamp) => void;
}

const ExpertAppraisal: React.FC<ExpertAppraisalProps> = ({ collection, onUpdate }) => {
  const pendingStamps = collection.filter(s => s.expertStatus === 'pending');
  const appraisedStamps = collection.filter(s => s.expertStatus === 'appraised');
  const [activeTab, setActiveTab] = useState<'info' | 'requests'>('info');
  
  // Modal State
  const [appraisingStamp, setAppraisingStamp] = useState<Stamp | null>(null);
  const [valuationInput, setValuationInput] = useState('');
  const [noteInput, setNoteInput] = useState('');

  const handleAppraisalSubmit = () => {
    if (appraisingStamp) {
      const updated: Stamp = {
        ...appraisingStamp,
        expertStatus: 'appraised',
        expertValuation: valuationInput || appraisingStamp.estimatedValue,
        expertNote: noteInput || "Bestätigtes Original nach fachmännischer Begutachtung."
      };
      onUpdate(updated);
      closeModal();
    }
  };

  const closeModal = () => {
    setAppraisingStamp(null);
    setValuationInput('');
    setNoteInput('');
  };

  const rejectRequest = (stamp: Stamp) => {
    if (window.confirm(`Möchten Sie die Anfrage für "${stamp.name}" wirklich ablehnen?`)) {
      onUpdate({ ...stamp, expertStatus: 'none' });
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-2 rounded-2xl flex gap-1 w-fit border border-slate-100 shadow-sm mx-auto md:mx-0">
        <button 
          onClick={() => setActiveTab('info')}
          className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'info' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          Informationen
        </button>
        <button 
          onClick={() => setActiveTab('requests')}
          className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'requests' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          Anfragen ({pendingStamps.length + appraisedStamps.length})
        </button>
      </div>

      {activeTab === 'info' ? (
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-indigo-900 text-white p-12 rounded-[3rem] relative overflow-hidden shadow-2xl">
            <h3 className="text-3xl serif-title mb-6">Menschliche Expertise</h3>
            <p className="text-indigo-200 mb-8 leading-relaxed font-medium">
              Zusätzlich zur KI-Bewertung bieten wir Ihnen einen direkten Draht zu unabhängigen Experten. 
              Senden Sie Ihre Marken digital ein und erhalten Sie eine professionelle Einschätzung basierend auf jahrzehntelanger Erfahrung.
            </p>
            <ul className="space-y-4 mb-10">
              <li className="flex items-center gap-3">
                <i className="fas fa-check-circle text-indigo-400"></i>
                <span>Vollkommen kostenlos</span>
              </li>
              <li className="flex items-center gap-3">
                <i className="fas fa-check-circle text-indigo-400"></i>
                <span>Unverbindliche Beratung</span>
              </li>
              <li className="flex items-center gap-3">
                <i className="fas fa-check-circle text-indigo-400"></i>
                <span>Netzwerk aus Auktionshäusern</span>
              </li>
            </ul>
            <div className="p-6 bg-white/10 rounded-3xl border border-white/10 backdrop-blur">
              <p className="text-sm font-bold mb-1">Nächster Schritt:</p>
              <p className="text-xs text-indigo-300">Wählen Sie eine Marke in Ihrer Sammlung aus und klicken Sie auf 'Experten-Anfrage'.</p>
            </div>
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-[100px]"></div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 text-xl shadow-inner">
                <i className="fas fa-certificate"></i>
              </div>
              <h4 className="text-xl font-black text-slate-900 mb-3 tracking-tight">Zertifizierter Check</h4>
              <p className="text-slate-500 text-sm leading-relaxed font-medium">
                Unsere Partner prüfen die Marke auf Originalität und Zustand. Dies ist besonders wichtig bei hochwertigen Einzelstücken.
              </p>
            </div>
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-6 text-xl shadow-inner">
                <i className="fas fa-gavel"></i>
              </div>
              <h4 className="text-xl font-black text-slate-900 mb-3 tracking-tight">Einlieferungshilfe</h4>
              <p className="text-slate-500 text-sm leading-relaxed font-medium">
                Bei wertvollen Marken unterstützen wir Sie bei der Vermittlung an renommierte Auktionshäuser für den optimalen Verkaufserfolg.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {pendingStamps.length === 0 && appraisedStamps.length === 0 ? (
            <div className="bg-white p-20 rounded-[3rem] text-center border-2 border-dashed border-slate-100">
               <i className="fas fa-envelope-open-text text-4xl text-slate-200 mb-4"></i>
               <p className="text-slate-400 font-bold">Keine laufenden Anfragen.</p>
               <p className="text-xs text-slate-300 mt-2 italic">Starten Sie eine Anfrage in der Sammlungs-Detailansicht.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {pendingStamps.map(stamp => (
                <div key={stamp.id} className="bg-white p-6 rounded-[2rem] border border-amber-100 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                  <div className="flex items-center gap-6">
                    <img src={stamp.image} className="w-20 h-20 rounded-2xl object-cover shadow-lg" />
                    <div>
                      <h4 className="font-black text-slate-800 text-lg">{stamp.name}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] font-black uppercase text-amber-500 bg-amber-50 px-3 py-1 rounded-full">Prüfung läuft...</span>
                        <span className="text-xs text-slate-400 font-medium">Anfrage vom {new Date(stamp.dateAdded).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => {
                        setAppraisingStamp(stamp);
                        setValuationInput(stamp.estimatedValue);
                      }}
                      className="bg-emerald-600 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg flex items-center gap-2"
                    >
                      <i className="fas fa-check-double"></i> Begutachten
                    </button>
                    <button 
                      onClick={() => rejectRequest(stamp)}
                      className="bg-white border border-red-100 text-red-500 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-all flex items-center gap-2"
                    >
                      <i className="fas fa-times"></i> Ablehnen
                    </button>
                  </div>
                </div>
              ))}
              {appraisedStamps.map(stamp => (
                <div key={stamp.id} className="bg-white p-8 rounded-[2.5rem] border border-emerald-100 shadow-lg relative overflow-hidden group">
                  <div className="flex flex-col md:flex-row gap-8 relative z-10">
                    <div className="relative">
                      <img src={stamp.image} className="w-32 h-32 rounded-3xl object-cover shadow-2xl" />
                      <div className="absolute -top-3 -right-3 bg-emerald-500 text-white w-8 h-8 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                        <i className="fas fa-check text-xs"></i>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-2xl font-black text-slate-900">{stamp.name}</h4>
                          <p className="text-xs text-emerald-600 font-black uppercase tracking-widest">Expertise abgeschlossen</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Experten-Wert</p>
                          <p className="text-3xl font-black text-emerald-700">{stamp.expertValuation}</p>
                        </div>
                      </div>
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 italic">
                        <p className="text-slate-600 text-sm font-medium">"{stamp.expertNote}"</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Appraisal Entry Modal */}
      {appraisingStamp && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-xl p-10 shadow-2xl animate-in zoom-in-95 duration-300 relative">
            <button 
              onClick={closeModal}
              className="absolute top-8 right-8 text-slate-400 hover:text-slate-600 transition-all"
            >
              <i className="fas fa-times text-xl"></i>
            </button>

            <div className="flex items-center gap-6 mb-8">
              <img src={appraisingStamp.image} className="w-20 h-20 rounded-2xl object-cover shadow-lg border-2 border-slate-100" />
              <div>
                <h3 className="text-xl font-black text-slate-900">{appraisingStamp.name}</h3>
                <p className="text-[10px] text-indigo-500 font-black uppercase tracking-widest">Begutachtungs-Protokoll</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 px-1">Experten-Wertermittlung</label>
                <div className="relative">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 font-bold">€</div>
                  <input 
                    type="text" 
                    placeholder="z.B. 1.250,00" 
                    className="w-full pl-10 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
                    value={valuationInput.replace('€', '').trim()}
                    onChange={(e) => setValuationInput(`€${e.target.value}`)}
                  />
                </div>
                <p className="text-[9px] text-slate-400 mt-2 px-1 italic">KI-Schätzung war: {appraisingStamp.estimatedValue}</p>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 px-1">Fachliche Anmerkungen</label>
                <textarea 
                  rows={4}
                  placeholder="Details zum Zustand, Seltenheit oder Besonderheiten..." 
                  className="w-full bg-slate-50 border border-slate-200 p-6 rounded-2xl font-medium text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                ></textarea>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={handleAppraisalSubmit}
                  className="flex-1 bg-emerald-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-emerald-700 transition-all"
                >
                  Expertise Speichern
                </button>
                <button 
                  onClick={closeModal}
                  className="px-8 py-5 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpertAppraisal;
