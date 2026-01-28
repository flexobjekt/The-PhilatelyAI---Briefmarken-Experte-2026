
import React from 'react';
import { AppView } from '../types';

interface NavigationProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, onViewChange }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-chart-line' },
    { id: 'scanner', label: 'Scanner', icon: 'fas fa-camera' },
    { id: 'collection', label: 'Sammlung', icon: 'fas fa-layer-group' },
    { id: 'appraisal', label: 'Experten-Check', icon: 'fas fa-certificate' },
  ];

  return (
    <nav className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-slate-900 text-white flex-col z-50">
      <div className="p-8">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
            <i className="fas fa-stamp text-xl"></i>
          </div>
          <span className="text-xl font-bold tracking-tight">PhilatelyAI</span>
        </div>

        <div className="space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id as AppView)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                currentView === item.id 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <i className={`${item.icon} w-5`}></i>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-auto p-8">
        <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700/50">
          <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mb-3">System-Status</p>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <p className="text-sm font-bold">KI Online</p>
          </div>
          <p className="text-[10px] text-slate-400">Alle Funktionen freigeschaltet</p>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
