import React from 'react';
import type { Job } from '../types';

interface JobStatusProps {
  job: Job;
  isAutoRun: boolean;
  onAutoRunChange: (isAutoRun: boolean) => void;
  onJobControl: (action: 'resume' | 'pause' | 'next' | 'cancel') => void;
  onClearJob: () => void;
}

export const JobStatus: React.FC<JobStatusProps> = ({ job, isAutoRun, onAutoRunChange, onJobControl, onClearJob }) => {
  const { progress, step, state } = job;

  const isJobActive = state === 'running' || state === 'queued';

  return (
    <div className="max-w-4xl mx-auto bg-brand-secondary rounded-2xl shadow-2xl p-6 md:p-8 space-y-4">
        <div>
            <div className="flex justify-between items-center mb-1">
                <p className="text-brand-text font-semibold text-lg">
                  {state === 'done' ? 'Generierung abgeschlossen!' : 'Generierung läuft...'}
                </p>
                <p className="text-brand-text font-bold text-lg">{Math.round(progress)}%</p>
            </div>
            <div className="w-full bg-brand-primary rounded-full h-3 overflow-hidden">
                <div
                    className={`bg-brand-accent h-3 rounded-full transition-all duration-300 ease-linear ${isJobActive ? 'animate-pulse' : ''}`}
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
             <p className="text-center text-sm text-brand-text-secondary/80 mt-2">
                Aktueller Schritt: <span className="font-semibold text-brand-text">{step.description}</span>
            </p>
        </div>
      
        {job.lastError && (
             <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg" role="alert">
              <strong className="font-bold">Fehler im Schritt '{job.lastError.atStep}': </strong>
              <span className="block sm:inline">{job.lastError.message}</span>
            </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-brand-primary">
            <div className="flex items-center space-x-2">
                <label htmlFor="auto-run-toggle" className="text-sm text-brand-text-secondary">Automatisch fortfahren</label>
                <label htmlFor="auto-run-toggle" className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" id="auto-run-toggle" className="sr-only peer" checked={isAutoRun} onChange={() => onAutoRunChange(!isAutoRun)} />
                  <div className="w-11 h-6 bg-brand-primary peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-accent rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-accent"></div>
                </label>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              {state === 'running' && (
                <button onClick={() => onJobControl('pause')} className="px-4 py-2 text-sm rounded-md bg-yellow-600/80 hover:bg-yellow-600 text-white transition-colors">Pause</button>
              )}
              {state === 'paused' && (
                 <button onClick={() => onJobControl('resume')} className="px-4 py-2 text-sm rounded-md bg-green-600/80 hover:bg-green-600 text-white transition-colors">Fortsetzen</button>
              )}
              {state === 'paused' && !isAutoRun && (
                 <button onClick={() => onJobControl('next')} className="px-4 py-2 text-sm rounded-md bg-brand-accent hover:bg-brand-accent-hover text-white transition-colors">Nächstes Panel</button>
              )}
              {state !== 'done' && (
                  <button onClick={() => onJobControl('cancel')} className="px-4 py-2 text-sm rounded-md bg-red-700/80 hover:bg-red-700 text-white transition-colors">Abbrechen</button>
              )}
              {state === 'done' && (
                  <button onClick={onClearJob} className="px-4 py-2 text-sm rounded-md bg-brand-accent hover:bg-brand-accent-hover text-white transition-colors">Neue Generierung</button>
              )}
            </div>
        </div>
    </div>
  );
};
