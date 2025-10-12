import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { InputForm } from './components/InputForm';
import { SixpackRenderer } from './components/SixpackRenderer';
import { JobStatus } from './components/JobStatus';
import { SettingsModal } from './components/SettingsModal';
import { SystemCheckPanel } from './components/SystemCheckPanel';
import { startJob, getJobStatus, controlJob, getTopicSuggestions, initJobFromStorage, clearPersistedJob } from './services/jobService';
import type { UserInput, Job, Sixpack, CIColors, SectionLabels, PanelSegmentsLockState, PanelResult, Geo, Warning } from './types';
import { FLAGS } from './flags';
import { initI18n, setLocale, t } from './i18n';

const POLLING_INTERVAL = 2500; // 2.5 seconds
const MIGRATION_BANNER_KEY = 'onepage_migration_banner_dismissed';

interface GeoTextPanelProps {
  geo: Geo;
  firstPanelSynopsis?: string;
}

const GeoTextPanel: React.FC<GeoTextPanelProps> = ({ geo, firstPanelSynopsis }) => {
  const { topAnswer, keyFacts } = geo;

  const validKeyFacts = keyFacts?.filter(Boolean) || [];

  if (!topAnswer && validKeyFacts.length === 0) {
    return null; // Don't render if there's no GEO text content
  }

  return (
    <div className="max-w-4xl mx-auto bg-brand-secondary rounded-2xl shadow-xl p-6 md:p-8">
      <h3 className="text-xl font-bold text-brand-text mb-4">GEO Text-Vorschau</h3>
      <div className="space-y-6">
        {topAnswer && (
          <div>
            <h4 className="font-semibold text-brand-accent mb-2">{t('lbl.geo.topAnswer')}</h4>
            <p className="bg-brand-primary p-4 rounded-lg text-brand-text-secondary text-sm leading-relaxed">{topAnswer}</p>
          </div>
        )}
        {validKeyFacts.length > 0 && (
          <div>
            <h4 className="font-semibold text-brand-accent mb-2">{t('lbl.geo.keyFacts')}</h4>
            <ul className="list-disc list-inside space-y-2 pl-4 text-brand-text-secondary text-sm">
              {validKeyFacts.map((fact, index) => (
                <li key={index}>{fact}</li>
              ))}
            </ul>
          </div>
        )}
        {firstPanelSynopsis && (
           <div>
            <h4 className="font-semibold text-brand-accent mb-2">{t('lbl.text.synopsis')} (aus erster Sektion)</h4>
            <p className="bg-brand-primary p-4 rounded-lg text-brand-text-secondary text-sm leading-relaxed italic">"{firstPanelSynopsis}"</p>
          </div>
        )}
      </div>
    </div>
  );
};


const App: React.FC = () => {
  const [i18nLoaded, setI18nLoaded] = useState(false);
  const [job, setJob] = useState<Job | null>(() => {
    if (FLAGS.PERSISTENCE_MVP) {
      return initJobFromStorage();
    }
    return null;
  });
  const [jobId, setJobId] = useState<string | null>(job?.jobId || null);
  const [error, setError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isSystemCheckVisible, setIsSystemCheckVisible] = useState<boolean>(false);
  const [isAutoRun, setIsAutoRun] = useState<boolean>(true);
  const [topicSuggestions, setTopicSuggestions] = useState<string[]>([]);
  const [showMigrationBanner, setShowMigrationBanner] = useState<boolean>(!localStorage.getItem(MIGRATION_BANNER_KEY));
  const [validationState, setValidationState] = useState<{ isValid: boolean; errorCount: number; warnCount: number; warnings: Warning[] }>({ isValid: true, errorCount: 0, warnCount: 0, warnings: [] });
  
  // Initialize i18n and set locale based on browser language on initial load
  useEffect(() => {
    const initializeApp = async () => {
      await initI18n();
      const userLang = navigator.language.split('-')[0];
      setLocale(userLang === 'en' ? 'en' : 'de');
      setI18nLoaded(true);
    };
    initializeApp();
  }, []);

  const isJobRunning = useMemo(() => job?.state === 'running' || job?.state === 'queued', [job]);

  // Sync jobId state when job object changes
  useEffect(() => {
    setJobId(job?.jobId || null);
  }, [job]);


  // --- Job Polling Effect ---
  useEffect(() => {
    if (!jobId || !isJobRunning) return;

    const intervalId = setInterval(async () => {
      try {
        const updatedJob = await getJobStatus(jobId);
        setJob(prevJob => {
            // Preserve lock state from UI if it exists, as backend mock won't have it
            if (prevJob && updatedJob) {
                // Also preserve the panel order from the previous state during polling updates
                const prevOrderMap = new Map(prevJob.results.panels.map(p => [p.index, p]));
                const newPanels = updatedJob.results.panels.sort((a, b) => {
                    const aPos = prevJob.results.panels.findIndex(p => p.index === a.index);
                    const bPos = prevJob.results.panels.findIndex(p => p.index === b.index);
                    return aPos - bPos;
                });

                updatedJob.results.panels = newPanels.map(panel => {
                    // FIX: Added type assertion to resolve 'unknown' type error. This can happen when state structure is inconsistent.
                    const prevPanel = prevOrderMap.get(panel.index) as PanelResult | undefined;
                    if (prevPanel) {
                        if (prevPanel.is_locked) {
                            // FIX: Cast panel to allow property assignment.
                            (panel as PanelResult).is_locked = true;
                        }
                        if (prevPanel.segment_locks) {
                           // FIX: Cast panel to allow property assignment.
                           (panel as PanelResult).segment_locks = prevPanel.segment_locks;
                        }
                    }
                    return panel;
                });
            }
            return updatedJob;
        });
        
        const isJobFinished = updatedJob.state === 'done' || updatedJob.state === 'error' || updatedJob.state === 'paused';
        if (isJobFinished) {
          clearInterval(intervalId);
          if (updatedJob.state === 'error') {
            setError(updatedJob.lastError?.message || "Der Job ist mit einem unbekannten Fehler fehlgeschlagen.");
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
        setError("Verbindung zum Server verloren. Bitte Seite neu laden.");
        clearInterval(intervalId);
      }
    }, POLLING_INTERVAL);

    return () => clearInterval(intervalId);
  }, [jobId, isJobRunning]);
  
  const handleStartJob = useCallback(async (input: UserInput) => {
    setError(null);
    setJob(null);
    setIsSystemCheckVisible(false); // Hide system check when a real job starts
    try {
      const { jobId: newJobId } = await startJob(input);
      // Immediately fetch initial status
      const initialJob = await getJobStatus(newJobId);
      setJob(initialJob);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Fehler beim Starten des Generierungs-Jobs.');
    }
  }, []);
  
  // FIX: Added 'run_linter' to the action type to satisfy the onJobControl prop type of SixpackRenderer.
  const handleJobControl = useCallback(async (action: 'resume' | 'pause' | 'next' | 'cancel' | 'regenerate_panel' | 'add_panel' | 'regenerate_panel_segment' | 'run_linter', panelIndex?: number, payload?: any) => {
      if (!jobId) return;
      try {
          await controlJob(jobId, action, panelIndex, payload);
          // Fetch status immediately after control action to reflect changes quickly
          const updatedJob = await getJobStatus(jobId);
          setJob(updatedJob);
      } catch(err) {
          console.error(`Failed to ${action} job:`, err);
          setError(`Aktion '${action}' konnte nicht ausgeführt werden.`);
      }
  }, [jobId]);

  const handleClearJob = useCallback(() => {
    setJob(null);
    setJobId(null);
    setError(null);
    clearPersistedJob();
  }, []);

  const handleUpdatePanelProperty = useCallback((panelIndex: number, property: 'title' | 'summary', value: string, segmentLock: keyof PanelSegmentsLockState) => {
    setJob(prev => {
        if (!prev) return null;
        
        const newPanels = prev.results.panels.map(p => {
            if (p.index === panelIndex) {
                const updatedPanel = { ...p };
                if (updatedPanel.panel) {
                    (updatedPanel.panel as any)[property] = value;
                }
                if (!updatedPanel.segment_locks) {
                    updatedPanel.segment_locks = { title: false, summary: false, sections: false, faq: false, keywords: false };
                }
                updatedPanel.segment_locks[segmentLock] = true;
                return updatedPanel;
            }
            return p;
        });

        return { ...prev, results: { ...prev.results, panels: newPanels } };
    });
  }, []);

  const handleUpdatePanelSummary = useCallback((panelIndex: number, newSummary: string) => {
    handleUpdatePanelProperty(panelIndex, 'summary', newSummary, 'summary');
  }, [handleUpdatePanelProperty]);

  const handleUpdatePanelTitle = useCallback((panelIndex: number, newTitle: string) => {
    handleUpdatePanelProperty(panelIndex, 'title', newTitle, 'title');
  }, [handleUpdatePanelProperty]);

  const handleUpdateCIColors = useCallback((newColors: CIColors) => {
    setJob(prev => {
        if (!prev) return null;
        // FIX: Corrected the malformed state update. This was corrupting the job object structure, leading to the downstream type errors.
        return {
            ...prev,
            userInput: {
                ...prev.userInput,
                // Persist design changes for next job if user wants to keep them
                keepDesign: true 
            },
            results: {
                ...prev.results,
                ci_colors: newColors,
            }
        };
    });
  }, []);

  const handleUpdateSectionLabels = useCallback((newLabels: SectionLabels) => {
    setJob(prev => {
        if (!prev) return null;
        return {
            ...prev,
             userInput: {
                ...prev.userInput,
                keepDesign: true
            },
            results: {
                ...prev.results,
                section_labels: newLabels,
            }
        };
    });
  }, []);
  
  const handleRegeneratePanel = useCallback((panelIndex: number) => {
      handleJobControl('regenerate_panel', panelIndex);
  }, [handleJobControl]);

  const handleRegeneratePanelSegment = useCallback((panelIndex: number, segment: string) => {
    handleJobControl('regenerate_panel_segment', panelIndex, { segment });
  }, [handleJobControl]);

  const handleAddNewPanel = useCallback((topic: string) => {
      handleJobControl('add_panel', undefined, { topic });
  }, [handleJobControl]);
  
  const handleOpenAddPanelModal = useCallback(async () => {
    if (!jobId) return;
    try {
        const suggestions = await getTopicSuggestions(jobId);
        setTopicSuggestions(suggestions);
    } catch (err) {
        console.error("Could not get topic suggestions:", err);
        setTopicSuggestions([]); // Set to empty on error
    }
  }, [jobId]);


  const handleTogglePanelLock = useCallback((panelIndex: number) => {
      setJob(prev => {
          if (!prev) return null;
          const newPanels = prev.results.panels.map(p => {
              if (p.index === panelIndex) {
                  return { ...p, is_locked: !p.is_locked };
              }
              return p;
          });
          return { ...prev, results: { ...prev.results, panels: newPanels }};
      });
  }, []);
  
  const handleReorderPanels = useCallback((sourceIndex: number, destinationIndex: number) => {
    setJob(prev => {
        if (!prev) return null;

        const panelList = Array.from(prev.results.panels);
        const [moved] = panelList.splice(sourceIndex, 1);
        panelList.splice(destinationIndex, 0, moved);
        
        return {
            ...prev,
            results: {
                ...prev.results,
                panels: panelList,
            }
        };
    });
  }, []);

  const handleDismissBanner = useCallback(() => {
    localStorage.setItem(MIGRATION_BANNER_KEY, 'true');
    setShowMigrationBanner(false);
  }, []);


  // --- Derived State for Rendering ---
  const sixpackForRenderer = useMemo((): Sixpack | null => {
    if (!job || !job.results.geo || !job.results.topic) {
        return null;
    }
    // We only pass successfully generated panels to the renderer.
    const successfulPanels = job.results.panels
      .filter(p => p.status === 'ok' && p.panel)
      .map(p => p.panel!);
      
    return {
        type: 'sixpack',
        format: '1x1',
        topic: job.results.topic,
        geo: job.results.geo,
        panels: successfulPanels,
        meta: job.results.meta,
        ci_colors: job.results.ci_colors,
    };
  }, [job]);

  if (!i18nLoaded) {
    return (
      <div className="min-h-screen bg-brand-primary flex items-center justify-center text-brand-text">
        <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-brand-accent"></div>
            <p className="mt-4 text-lg">Anwendung wird geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-brand-primary font-sans">
        <Header 
            onSettingsClick={() => setIsSettingsOpen(true)}
            onSystemCheckClick={() => setIsSystemCheckVisible(prev => !prev)}
        />
        <main className="container mx-auto p-4 md:p-8">

          {showMigrationBanner && (
            <div className="max-w-4xl mx-auto bg-brand-accent/20 border border-brand-accent/50 text-brand-text p-4 rounded-lg mb-8 flex justify-between items-center">
                <div>
                    <h3 className="font-bold">Update: One-Page-Export ist jetzt Standard!</h3>
                    <p className="text-sm text-brand-text-secondary">Panels sind jetzt Sektionen einer vollständigen Seite. Der alte Panel-Export ist unter "Legacy" weiterhin verfügbar.</p>
                </div>
                <button onClick={handleDismissBanner} className="p-2 rounded-full hover:bg-brand-primary text-2xl" aria-label="Hinweis schließen">&times;</button>
            </div>
          )}
          
          <div className="max-w-4xl mx-auto bg-brand-secondary rounded-2xl shadow-2xl p-6 md:p-8">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-2 text-brand-text">
              Geo-SEO Content-Generator
            </h2>
            <p className="text-center text-brand-text-secondary mb-8">
              Erzeugen Sie optimierte Content-Sektionen oder eine vollständige One-Page-Seite.
            </p>
            <InputForm onGenerate={handleStartJob} isLoading={isJobRunning} onValidationChange={setValidationState} />
          </div>

          {isSystemCheckVisible && (
            <div className="mt-8">
                <SystemCheckPanel />
            </div>
          )}

          {job && (
            <div className="mt-8">
              <JobStatus
                job={job}
                isAutoRun={isAutoRun}
                onAutoRunChange={setIsAutoRun}
                onJobControl={handleJobControl}
                onClearJob={handleClearJob}
              />
            </div>
          )}

          {job && job.results.geo && (job.results.geo.topAnswer || (job.results.geo.keyFacts || []).filter(Boolean).length > 0) && (
            <div className="mt-8">
              <GeoTextPanel 
                geo={job.results.geo}
                firstPanelSynopsis={job.results.panels.find(p => p.status === 'ok' && p.panel)?.panel?.summary}
              />
            </div>
          )}

          {error && (
            <div className="max-w-4xl mx-auto mt-8 bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg" role="alert">
              <strong className="font-bold">Fehler: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {job && job.state !== 'error' && (
            <div className="mt-8">
              <SixpackRenderer 
                job={job}
                validationState={validationState}
                onUpdatePanelSummary={handleUpdatePanelSummary}
                onUpdatePanelTitle={handleUpdatePanelTitle}
                onUpdateCIColors={handleUpdateCIColors}
                onUpdateSectionLabels={handleUpdateSectionLabels}
                onRegeneratePanel={handleRegeneratePanel}
                onRegeneratePanelSegment={handleRegeneratePanelSegment}
                onTogglePanelLock={handleTogglePanelLock}
                onReorderPanels={handleReorderPanels}
                onJobControl={handleJobControl}
                onAddNewPanel={handleAddNewPanel}
                onOpenAddPanelModal={handleOpenAddPanelModal}
                topicSuggestions={topicSuggestions}
              />
            </div>
          )}
          
        </main>
        <footer className="text-center p-4 text-brand-text-secondary text-sm">
          <p>&copy; {new Date().getFullYear()} Geo-SEO Content Panel Creator. Powered by AI.</p>
        </footer>
      </div>
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        sixpack={sixpackForRenderer}
      />
    </>
  );
};

export default App;