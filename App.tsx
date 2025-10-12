
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { InputForm } from './components/InputForm';
import { SixpackRenderer } from './components/SixpackRenderer';
import { JobStatus } from './components/JobStatus';
import { SettingsModal } from './components/SettingsModal';
import { SystemCheckPanel } from './components/SystemCheckPanel';
import { startJob, getJobStatus, controlJob, getTopicSuggestions, initJobFromStorage, clearPersistedJob } from './services/jobService';
import type { UserInput, Job, Sixpack, CIColors, SectionLabels, PanelSegmentsLockState, PanelResult } from './types';
import { FLAGS } from './flags';

const POLLING_INTERVAL = 2500; // 2.5 seconds
const MIGRATION_BANNER_KEY = 'onepage_migration_banner_dismissed';

const App: React.FC = () => {
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
            <InputForm onGenerate={handleStartJob} isLoading={isJobRunning} />
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

          {error && (
            <div className="max-w-4xl mx-auto mt-8 bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg" role="alert">
              <strong className="font-bold">Fehler: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {job && job.state !== 'error' && (
            <div className="mt-12">
              <SixpackRenderer 
                job={job}
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
