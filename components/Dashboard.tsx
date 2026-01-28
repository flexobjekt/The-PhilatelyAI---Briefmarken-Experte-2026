
import React from 'react';
import { AppView, Stamp } from '../types';

interface DashboardProps {
  collection: Stamp[];
  onViewChange: (view: AppView) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ collection, onViewChange }) => {
  const parseCurrency = (valStr: string | undefined): number => {
    if (!valStr) return 0;
    // Entferne Währungssymbole und Leerzeichen
    let clean = valStr.replace(/[^\d.,-]/g, '').trim();
    if (!clean) return 0;

    // Behandle Punkt/Komma Problematik
    if (clean.includes('.') && clean.includes(',')) {
      if (clean.lastIndexOf('.') > clean.lastIndexOf(',')) {
        clean = clean.replace(/,/g, ''); // Tausendertrennzeichen Komma
      } else {
        clean = clean.replace(/\./g, '').replace(',', '.'); // Tausendertrennzeichen Punkt
      }
    } else if (clean.includes(',')) {
      clean = clean.replace(',', '.');
    }
    
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
  };

  const totalValueNum = collection.reduce((acc, stamp) => {
    return acc + parseCurrency(stamp.expertValuation || stamp.estimatedValue);
  }, 0);

  const totalValue = `€${totalValueNum.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const origins = Array.from(new Set(collection.map(s => s.origin)));
  const distribution = origins.map(origin => {
    const count = collection.filter(s => s.origin === origin).length;
    return { name: origin, percent: (count / collection.length) * 100 };
  }).sort((a, b) => b.percent - a.percent).slice(0, 5);

  const stats = [
    { label: 'Archivierte Marken', value: collection.length, sub: 'Bestand', icon: 'fas fa-book-bookmark', color: 'bg-indigo-600' },
    { label: 'Gesamtwert', value: totalValue, sub: 'Marktanalyse', icon: 'fas fa-vault', color: 'bg-emerald-600' },
    { label: 'Experten-Status', value: collection.filter(s => s.expertStatus === 'appraised').length, sub: 'Verifiziert', icon: 'fas fa-stamp', color: 'bg-amber-500' },
  ];

  return (
    <div className="space-y-12 pb-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col gap-6 group hover:shadow-2xl transition-all duration-500">
            <div className={`w-16 h-16 ${stat.color} text-white rounded-[1.5rem] flex items-center justify-center text-2xl shadow-xl group-hover:scale-110 transition-transform duration-500`}>
              <i className={stat.icon}></i>
            </div>
            <div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{stat.label}</p>
              <h4 className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</h4>
              <p className="text-xs text-slate-400 mt-2 font-medium">{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-10">
          <div className="bg-indigo-600 rounded-[3.5rem] p-12 text-white relative overflow-hidden shadow-2xl shadow-indigo-100 group">
            <div className="relative z-10 max-w-lg">
              <span className="inline-block bg-white/20 backdrop-blur px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border border-white/20">
                Premium-KI Aktiviert
              </span>
              <h3 className="text-4xl serif-title mb-4 leading-tight">Digitaler Blick ins Philatelie-Archiv</h3>
              <p className="text-indigo-100 text-lg mb-10 leading-relaxed font-medium">
                Ihre Sammlung wird in Echtzeit mit weltweiten Auktionsdaten abgeglichen. Scannen Sie neue Fundstücke für sofortige Expertise.
              </p>
              <button 
                onClick={() => onViewChange('scanner')}
                className="bg-white text-indigo-600 px-10 py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl hover:bg-indigo-50 transition-all flex items-center gap-3 active:scale-95"
              >
                <i className="fas fa-camera text-xl"></i> Jetzt Scannen
              </button>
            </div>
            <div className="absolute -top-20 -right-20 w-[400px] h-[400px] bg-indigo-500 rounded-full mix-blend-multiply opacity-50 blur-[100px]"></div>
          </div>

          <section>
            <div className="flex justify-between items-center mb-8 px-2">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Neuzugänge</h3>
              <button onClick={() => onViewChange('collection')} className="text-indigo-600 text-sm font-black uppercase tracking-widest hover:text-indigo-800 transition-all">Archiv <i className="fas fa-arrow-right ml-2"></i></button>
            </div>
            
            {collection.length === 0 ? (
               <div className="bg-white rounded-[2.5rem] py-20 text-center border-2 border-dashed border-slate-100">
                  <p className="text-slate-400 font-bold">Noch keine Marken im Archiv.</p>
               </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                {collection.slice(0, 4).map(stamp => (
                  <div key={stamp.id} className="bg-white p-3 rounded-[2.2rem] shadow-sm border border-slate-100 group cursor-pointer hover:shadow-xl transition-all duration-500" onClick={() => onViewChange('collection')}>
                    <div className="aspect-square rounded-[1.5rem] overflow-hidden mb-4 bg-slate-50">
                      <img src={stamp.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    </div>
                    <div className="px-2 pb-2">
                      <p className="text-[10px] font-black text-slate-800 truncate mb-1 uppercase">{stamp.name}</p>
                      <p className="text-[12px] text-emerald-600 font-black">{stamp.expertValuation || stamp.estimatedValue}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="lg:col-span-4 space-y-8">
           <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl">
              <h4 className="text-xl font-black mb-8 tracking-tight">Geografie</h4>
              {collection.length === 0 ? (
                <p className="text-slate-500 text-sm italic">Keine Daten verfügbar.</p>
              ) : (
                <div className="space-y-6">
                  {distribution.map((item, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <span>{item.name}</span>
                        <span>{Math.round(item.percent)}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${item.percent}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
           </div>

           <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 text-xl">
                <i className="fas fa-chart-line"></i>
              </div>
              <h4 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Markt-Report</h4>
              <p className="text-slate-500 text-sm leading-relaxed mb-8 font-medium">Auktions-Trends werden direkt in die Wertermittlung einbezogen.</p>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs font-bold p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-500">Klassik Europa</span>
                  <span className="text-emerald-600">+12.1%</span>
                </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
