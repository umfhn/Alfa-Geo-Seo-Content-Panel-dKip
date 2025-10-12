import React, { useState, useEffect } from 'react';
import type { Job } from '../types';
import { ProgressBarLoader } from './ProgressBarLoader';

interface PanelPlaceholderProps {
  index: number;
  status: 'pending' | 'failed' | 'skipped';
  error?: string;
  job: Job;
  onRegeneratePanel: (index: number) => void;
  onJobControl: (action: 'cancel') => void;
}

export const PanelPlaceholder: React.FC<PanelPlaceholderProps> = ({ index, status, error, job, onRegeneratePanel, onJobControl }) => {
  const [regenerationProgress, setRegenerationProgress] = useState(0);

  const isGeneratingThisPanel = status === 'pending' && job && job.state === 'running' && job.step.kind === 'panel' && job.step.index === index;
  // A regeneration step is identified by its specific description.
  const isRegeneration = isGeneratingThisPanel && job.step.description.includes('neu generiert');

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isRegeneration) {
      setRegenerationProgress(0);
      // This timer simulates the progress for the mock regeneration duration (1.5s in jobService)
      interval = setInterval(() => {
        setRegenerationProgress(prev => {
          if (prev >= 95) {
            clearInterval(interval!);
            return 95;
          }
          // The progress is not linear to feel more realistic
          const increment = prev < 80 ? 15 : 5;
          return prev + increment;
        });
      }, 200);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
    // Dependency array ensures this effect runs only when a panel regeneration starts
  }, [isRegeneration]);
  
  const getStatusContent = () => {
      if (isGeneratingThisPanel) {
          let displayProgress;
          if (isRegeneration) {
            // Use the time-based state for regeneration progress
            displayProgress = regenerationProgress;
          } else {
            // Original calculation for the initial batch run
            const panelCount = job.step.of || 6;
            const prePanelProgress = 20; // Progress before panels start (profiling, topics)
            const totalPanelProgressRange = 90 - prePanelProgress; // Total % allocated for all panels
            const progressPerPanel = totalPanelProgressRange / panelCount;
            const panelStartProgress = prePanelProgress + index * progressPerPanel;
            
            const panelProgress = Math.max(0, job.progress - panelStartProgress);
            displayProgress = Math.min(100, Math.round((panelProgress / progressPerPanel) * 100));
          }

          return (
            <ProgressBarLoader 
                progress={displayProgress}
                stepDescription={job.step.description}
                onCancel={() => onJobControl('cancel')}
            />
          );
      }

      switch(status) {
          case 'pending':
              return (
                  <div className="flex items-center space-x-3">
                      <span className="text-brand-text-secondary">Panel {index + 1}: In Warteschlange...</span>
                  </div>
              );
          case 'failed':
              const getErrorSuggestion = (msg: string): string => {
                const lowerMsg = msg.toLowerCase();
                if (lowerMsg.includes('inhaltsfilter') || lowerMsg.includes('safety')) {
                    return "Versuchen Sie, den ursprünglichen Prompt oder die Themen-Vorgaben weniger provokativ oder mehrdeutig zu formulieren. Vermeiden Sie sensible Themen.";
                }
                if (lowerMsg.includes('rate-limit')) {
                    return "Das System hat zu viele Anfragen gesendet. Warten Sie bitte einige Minuten, bevor Sie es erneut versuchen.";
                }
                if (lowerMsg.includes('formatfehler')) {
                    return "Die KI hat in einem unerwarteten Format geantwortet. Ein Klick auf 'Neu versuchen' löst das Problem in der Regel.";
                }
                return "Prüfen Sie Ihre Internetverbindung. Wenn das Problem weiterhin besteht, versuchen Sie es später erneut oder kontaktieren Sie den Support.";
              };
              return (
                  <div className="flex flex-col items-start justify-center gap-4 w-full p-4">
                      <h4 className="font-bold text-red-400 self-center">Panel {index + 1}: Generierung fehlgeschlagen</h4>
                      <p className="w-full text-sm text-red-300 bg-brand-primary p-2 rounded-md font-mono">{error || "Ein unbekannter Fehler ist aufgetreten."}</p>
                       <details className="w-full text-sm">
                          <summary className="cursor-pointer text-brand-accent hover:underline">Was kann ich tun?</summary>
                          <div className="mt-2 p-3 bg-brand-primary rounded-md text-brand-text-secondary">
                              <p>{getErrorSuggestion(error || '')}</p>
                          </div>
                      </details>
                       <button 
                         onClick={() => onRegeneratePanel(index)}
                         className="px-4 py-2 text-sm rounded-md bg-brand-accent hover:bg-brand-accent-hover text-white transition-colors mt-2 self-center"
                       >
                           Neu versuchen
                       </button>
                  </div>
              );
          case 'skipped':
                return (
                    <p className="text-brand-text-secondary">Panel {index + 1} wurde übersprungen.</p>
                );
          default:
              return null;
      }
  }
  
  return (
    <div className="bg-brand-secondary/50 border-2 border-dashed border-brand-primary rounded-xl p-8 text-center flex items-center justify-center min-h-[200px]">
        {getStatusContent()}
    </div>
  );
};