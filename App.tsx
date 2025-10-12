import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { InputForm } from './components/InputForm';
import { JobStatus } from './components/JobStatus';
import { SixpackRenderer } from './components/SixpackRenderer';
import { Loader } from './components/Loader';
import { SettingsModal } from './components/SettingsModal';
import { SystemCheckPanel } from './components/SystemCheckPanel';
import { LayoutModule } from './components/LayoutModule';
import { startJob, getJobStatus, controlJob, getTopicSuggestions, initJobFromStorage, clearPersistedJob } from './services/jobService';
import { clearDraft } from './services/persistence';
import type { UserInput, Job, Warning, SeoData } from './types';
import { FLAGS } from './flags';
import { initI18n } from './i18n';

type AppView = 'form' | 'job' | 'system_check' | 'layout_module';

const App: React.FC = () => {
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAutoRun, setIsAutoRun] = useState<boolean>(true);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [view, setView] = useState<AppView>('form');
  const [topicSuggestions, setTopicSuggestions] = useState<string[]>([]);
  const [validationState, setValidationState] = useState<{ isValid: boolean; errorCount: number; warnCount: number; warnings: Warning[] }>({ isValid: true, errorCount: 0, warnCount: 0, warnings: [] });
  
  const handleGenerate = async (input: UserInput) => {
    clearPersistedJob(); // Clear old session-based job persistence
    clearDraft(input.geo.slug); // Clear new localStorage draft
    const { jobId } = await startJob(input);
    const newJob = await getJobStatus(jobId);
    setJob(newJob);
    setView('job');
  };

  const handleClearJob = () => {
    setJob(null);
    clearPersistedJob();
    setView('form');
  };
  
  const handleJobControl = useCallback(async (action: 'resume' | 'pause' | 'next' | 'cancel') => {
    if (job) {
      await controlJob(job.jobId, action);
      // Fetch updated status after control action
      const updatedJob = await getJobStatus(job.jobId);
      setJob(updatedJob);
    }
  }, [job]);

  const handleRegeneratePanel = useCallback(async (panelIndex: number) => {
    if (job) {
        // This is a placeholder for a more complex implementation.
        // In a real scenario, this would trigger a specific backend call.
        console.log(`Regenerating panel ${panelIndex}`);
        await controlJob(job.jobId, 'regenerate_panel', panelIndex);
    }
  }, [job]);

  const handleRegeneratePanelSegment = useCallback(async (panelIndex: number, segment: string) => {
    if(job) {
      console.log(`Regenerating segment ${segment} of panel ${panelIndex}`);
      await controlJob(job.jobId, 'regenerate_panel_segment', panelIndex, { segment });
    }
  }, [job]);
  
  const handleAddNewPanel = useCallback(async (topic: string) => {
    if(job) {
      console.log(`Adding new panel with topic: ${topic}`);
      await controlJob(job.jobId, 'add_panel', undefined, { topic });
    }
  }, [job]);

  const handleOpenAddPanelModal = useCallback(async () => {
      if (job) {
          const suggestions = await getTopicSuggestions(job.jobId);
          setTopicSuggestions(suggestions);
      }
  }, [job]);

  const handleUpdatePanelProperty = (jobId: string, panelIndex: number, property: 'summary' | 'title', value: string) => {
      setJob(prevJob => {
          if (!prevJob || prevJob.jobId !== jobId) return prevJob;
          const newPanels = [...prevJob.results.panels];
          const panelToUpdate = newPanels.find(p => p.index === panelIndex);
          if (panelToUpdate && panelToUpdate.panel) {
              panelToUpdate.panel[property] = value;
              // Also mark the segment as locked
              if (!panelToUpdate.segment_locks) panelToUpdate.segment_locks = {};
              panelToUpdate.segment_locks[property] = true;
          }
          return { ...prevJob, results: { ...prevJob.results, panels: newPanels }};
      });
  };

  const handleUpdateSeoMeta = (jobId: string, meta: SeoData) => {
      setJob(prevJob => {
          if (!prevJob || prevJob.jobId !== jobId) return prevJob;
          // Preserve existing meta fields like jsonLd while updating title and description
          const newMeta = { ...(prevJob.results.meta || {}), ...meta };
          return { ...prevJob, results: { ...prevJob.results, meta: newMeta as SeoData }};
      });
  };

  useEffect(() => {
    const pollJobStatus = async () => {
      if (job && (job.state === 'running' || job.state === 'queued')) {
        try {
          const updatedJob = await getJobStatus(job.jobId);
          setJob(updatedJob);
        } catch (error) {
          console.error("Failed to get job status:", error);
        }
      }
    };

    const intervalId = setInterval(pollJobStatus, 2000);
    return () => clearInterval(intervalId);
  }, [job]);
  
  useEffect(() => {
      const initializeApp = async () => {
          await initI18n();
          if (FLAGS.PERSISTENCE_MVP) {
              const persistedJob = initJobFromStorage();
              if (persistedJob) {
                  setJob(persistedJob);
                  setView('job');
              }
          }
          setIsLoading(false);
      };
      initializeApp();
  }, []);

  if (isLoading) {
    return <div className="bg-brand-primary min-h-screen flex items-center justify-center"><Loader /></div>;
  }

  return (
    <div className="bg-brand-primary min-h-screen text-brand-text font-sans">
      <Header 
        onSettingsClick={() => setIsSettingsModalOpen(true)}
        onSystemCheckClick={() => setView('system_check')}
      />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === 'form' && (
          <>
            <div className="text-center mb-8">
              <button onClick={() => setView('layout_module')} className="text-brand-accent hover:underline">Go to Layout Module Editor</button>
            </div>
            <InputForm onGenerate={handleGenerate} isLoading={job?.state === 'running' || job?.state === 'queued'} onValidationChange={setValidationState} />
          </>
        )}
        {view === 'job' && job && (
          <>
            {job.state === 'running' || job.state === 'queued' ? (
              <JobStatus 
                  job={job} 
                  isAutoRun={isAutoRun} 
                  onAutoRunChange={setIsAutoRun}
                  onJobControl={handleJobControl}
                  onClearJob={handleClearJob}
              />
            ) : (
               <SixpackRenderer 
                  job={job}
                  validationState={validationState}
                  onClearJob={handleClearJob}
                  onUpdatePanelSummary={(panelIndex, newSummary) => handleUpdatePanelProperty(job.jobId, panelIndex, 'summary', newSummary)}
                  onUpdatePanelTitle={(panelIndex, newTitle) => handleUpdatePanelProperty(job.jobId, panelIndex, 'title', newTitle)}
                  onUpdateCIColors={(newColors) => setJob(j => j ? ({ ...j, results: { ...j.results, ci_colors: newColors }}) : null)}
                  onUpdateSectionLabels={(newLabels) => setJob(j => j ? ({...j, results: {...j.results, section_labels: newLabels}}) : null)}
                  onUpdateSeoMeta={(meta) => handleUpdateSeoMeta(job.jobId, meta)}
                  onRegeneratePanel={handleRegeneratePanel}
                  onRegeneratePanelSegment={handleRegeneratePanelSegment}
                  onTogglePanelLock={(panelIndex) => setJob(j => {
                    if (!j) return null;
                    const newPanels = j.results.panels.map(p => p.index === panelIndex ? { ...p, is_locked: !p.is_locked } : p);
                    return {...j, results: {...j.results, panels: newPanels}};
                  })}
                  onReorderPanels={(sourceIndex, destinationIndex) => setJob(j => {
                    if (!j) return null;
                    const newPanels = [...j.results.panels];
                    const [removed] = newPanels.splice(sourceIndex, 1);
                    newPanels.splice(destinationIndex, 0, removed);
                    return {...j, results: {...j.results, panels: newPanels}};
                  })}
                  onJobControl={async (action, panelIndex) => { if(job) await controlJob(job.jobId, action, panelIndex); }}
                  onAddNewPanel={handleAddNewPanel}
                  onOpenAddPanelModal={handleOpenAddPanelModal}
                  topicSuggestions={topicSuggestions}
               />
            )}
          </>
        )}
        {view === 'system_check' && (
            <div>
                <button onClick={() => setView('form')} className="mb-4 text-brand-accent hover:underline">&larr; Zurück zum Formular</button>
                <SystemCheckPanel />
            </div>
        )}
        {view === 'layout_module' && (
           <div>
               <button onClick={() => setView('form')} className="mb-4 text-brand-accent hover:underline">&larr; Zurück zum Formular</button>
               <LayoutModule />
            </div>
        )}
      </main>
      <SettingsModal 
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        sixpack={job}
      />
    </div>
  );
};

export default App;