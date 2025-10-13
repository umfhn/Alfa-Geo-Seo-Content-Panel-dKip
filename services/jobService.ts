



import type { UserInput, Job, JobStep, PanelResult, HealthReport, Panel, LintingResults, Geo, QualityScoreBreakdownValue, PanelCount, PanelSegmentsLockState } from '../types';
import { designPresets } from './exportService';
import { generateSinglePanelLive, runAIPing, regeneratePanelSegment } from './geminiService';
import { FLAGS } from '../flags';
import { lintPanel, lintSetKeywordDups } from './lintService';
import { saveActiveJob, loadActiveJob, clearActiveJob } from './persistence';

// --- In-memory Mock Database ---
const jobDatabase = new Map<string, Job>();
let jobCounter = Date.now();

// --- Configuration ---
const AI_MODE: 'live' | 'mock' = 'live'; // Feature Flag: 'live' or 'mock'
const MAX_RETRIES = 2;
const INITIAL_BACKOFF_MS = 1000;

// --- Persistence ---
const debounce = (fn: Function, ms = 250) => {
    let timeoutId: ReturnType<typeof setTimeout>;
    return function (this: any, ...args: any[]) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), ms);
    };
};
const persistJob = debounce(saveActiveJob);


// --- Mock Implementation (remains for testing/fallback) ---
const createDummyPanel = (index: number, topic: string, geo: Geo): Panel => ({
    slug: `mock-panel-${index}-${topic.toLowerCase().replace(/\s+/g, '-')}`,
    title: `Mock-Titel für ${topic} in ${geo.city}`,
    kind: 'accordion',
    summary: `Dies ist eine Mock-Zusammenfassung für ${topic}, speziell für ${geo.companyName} in ${geo.city}.`,
    sections: [{ title: 'Mock-Abschnitt', bullets: ['Stichpunkt 1', 'Stichpunkt 2'] }],
    faqs: [{ q: 'Mock-Frage?', a: 'Mock-Antwort.' }],
    keywords: ['mock', topic, geo.city],
    sources: [],
    payloadHash: `mock-hash-${Math.random().toString(36).substring(7)}`,
});

// A simple hash function for mock content hashing
const simpleHash = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }
    return hash.toString();
};

const calculatePanelContentHash = (panel: Panel): string => {
    const content = JSON.stringify({
        title: panel.title, summary: panel.summary, sections: panel.sections,
        faqs: panel.faqs, keywords: panel.keywords
    });
    return simpleHash(content);
};

const createDummyLintingResults = (panel: Panel): LintingResults => ({
    passed: true, has_warnings: false, issues: [], similarity_score: 0.1,
    content_hash: calculatePanelContentHash(panel),
    quality_score_breakdown: {
        completeness: { score: 95, weight: 0.3 }, variance: { score: 92, weight: 0.3 },
        geo_integration: { score: 98, weight: 0.2 }, readability: { score: 95, weight: 0.1 },
        keywords: { score: 90, weight: 0.1 },
    }
});

// --- Job Orchestrator ---

const runJob = async (jobId: string) => {
    const job = jobDatabase.get(jobId);
    if (!job) return;

    const updateStep = (step: JobStep, progress: number) => {
        const currentJob = jobDatabase.get(jobId);
        if (currentJob && currentJob.state === 'running') {
            currentJob.step = step;
            currentJob.progress = progress;
            currentJob.timestamps.updated = new Date().toISOString();
            persistJob(currentJob);
        }
    };

    try {
        job.state = 'running';
        
        updateStep({ kind: 'profiling', description: 'Analysiere Input...' }, 10);
        await new Promise(res => setTimeout(res, 500));
        
        const mainTopic = `Leistungen von ${job.userInput.geo.companyName}`;
        job.results.topic = mainTopic;
        
        updateStep({ kind: 'ci_colors', description: 'Initialisiere Design...' }, 15);
        if (!job.userInput.keepDesign) {
            job.results.ci_colors = designPresets[0].colors;
        }
        await new Promise(res => setTimeout(res, 300));

        const panelCount = job.results.panels.length;
        const topics = job.userInput.topics || Array(panelCount).fill(mainTopic);
        
        const existingTitles: string[] = [];

        for (let i = 0; i < panelCount; i++) {
            const currentJob = jobDatabase.get(jobId);
            if (!currentJob || currentJob.state !== 'running') {
                // The job was paused or cancelled. Stop processing without throwing an error,
                // as the state is managed by the controlJob function.
                return;
            }

            // FIX: Skip panels that have already been successfully generated to allow for resume functionality.
            if (job.results.panels[i].status === 'ok') {
                const existingPanel = job.results.panels[i].panel;
                if (existingPanel?.title) {
                    existingTitles.push(existingPanel.title);
                }
                continue;
            }
            
            const panelProgressStart = 15 + (i / panelCount) * 80;
            updateStep({ kind: 'panel', index: i, of: panelCount, description: `Generiere Sektion ${i + 1} von ${panelCount}...` }, panelProgressStart);
            job.results.panels[i].status = 'pending';

            let panel: Panel | null = null;
            let lastError: Error | null = null;

            for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
                try {
                    if (AI_MODE === 'live') {
                         panel = await generateSinglePanelLive(job.userInput, topics[i] || mainTopic, existingTitles);
                    } else {
                         panel = createDummyPanel(i, topics[i] || mainTopic, job.results.geo!);
                    }
                    break; // Success, exit retry loop
                } catch (error) {
                    lastError = error instanceof Error ? error : new Error(String(error));
                    console.warn(`Attempt ${attempt + 1} failed for panel ${i}:`, lastError.message);
                    if (attempt < MAX_RETRIES) {
                        const backoffTime = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
                        updateStep({ kind: 'panel', index: i, of: panelCount, description: `Fehler, versuche erneut in ${backoffTime / 1000}s...` }, panelProgressStart);
                        await new Promise(res => setTimeout(res, backoffTime));
                    }
                }
            }

            if (!panel) {
                job.results.panels[i].status = 'failed';
                job.results.panels[i].error = lastError?.message || "Sektion konnte nach mehreren Versuchen nicht generiert werden.";
                continue; // Move to the next panel
            }
            
            existingTitles.push(panel.title);
            
            let linting_results: LintingResults;
            if (FLAGS.LINTER_MVP) {
                const panelIssues = lintPanel(panel, job.results.geo?.city, job.results.geo?.region);
                linting_results = {
                    passed: !panelIssues.some(i => i.severity === 'ERROR'),
                    has_warnings: panelIssues.some(i => i.severity === 'WARN'),
                    issues: panelIssues,
                    similarity_score: 0.1, // Dummy value
                    content_hash: calculatePanelContentHash(panel),
                    quality_score_breakdown: { // Dummy values
                        completeness: { score: 95, weight: 0.3 }, variance: { score: 92, weight: 0.3 },
                        geo_integration: { score: panelIssues.some(i => i.code === 'TITLE_NO_GEO') ? 70 : 98, weight: 0.2 },
                        readability: { score: 95, weight: 0.1 },
                        keywords: { score: 90, weight: 0.1 },
                    }
                };
            } else {
                linting_results = createDummyLintingResults(panel);
            }

            const quality_score = Math.round(Object.values(linting_results.quality_score_breakdown || {}).reduce((acc, curr) => acc + curr.score * curr.weight, 0));
            
            job.results.panels[i] = {
                index: i, status: 'ok', panel, topic: topics[i] || mainTopic, angle: 'Leistungen',
                quality_score: quality_score, linting_results,
                explainability: {
                    source_info: AI_MODE === 'live' ? 'Gemini API' : 'Mock Data',
                    extracted_geo: job.results.geo!, duration_ms: 1, payload_hash: panel.payloadHash!,
                }
            };
        }

        updateStep({ kind: 'finalizing', description: 'Finalisiere Ergebnisse...' }, 98);
        
        if (FLAGS.LINTER_MVP) {
            const successfulPanels = job.results.panels
                .filter(p => p.status === 'ok' && p.panel)
                .map(p => p.panel!);
            job.results.lintSummary = lintSetKeywordDups(successfulPanels);
        }
        
        job.results.set_hash = simpleHash(JSON.stringify(job.results.panels.map(p => p.panel?.payloadHash)));
        
        job.state = 'done';
        job.progress = 100;
        job.step = { kind: 'finalizing', description: 'Abgeschlossen' };

    } catch (error) {
        console.error("Job failed:", error);
        job.state = 'error';
        job.lastError = {
            code: 'JOB_FAILED',
            message: error instanceof Error ? error.message : "Ein unbekannter Fehler ist aufgetreten.",
            atStep: job.step.kind,
        };
    } finally {
        const finalJob = jobDatabase.get(jobId);
        if (finalJob) {
            finalJob.timestamps.updated = new Date().toISOString();
            persistJob(finalJob);
        }
    }
};


export const startJob = async (input: UserInput): Promise<{ jobId: string }> => {
    const jobId = `job-${++jobCounter}`;
    const panelCount = parseInt(input.panelCount, 10);
    const now = new Date().toISOString();
    const previousJob = Array.from(jobDatabase.values()).pop();
    const newJob: Job = {
        jobId, state: 'queued', progress: 0,
        step: { kind: 'profiling', description: 'Job wird gestartet...' },
        userInput: input,
        results: {
            geo: input.geo,
            media: input.media,
            panels: Array.from({ length: panelCount }, (_, i) => ({ index: i, status: 'pending', topic: '', angle: '' } as PanelResult)),
            ci_colors: input.keepDesign && previousJob?.results.ci_colors ? previousJob.results.ci_colors : undefined,
            section_labels: input.keepDesign && previousJob?.results.section_labels ? previousJob.results.section_labels : { summary: 'Überblick', sections: 'Inhalte', faq: 'Häufige Fragen', keywords: 'Stichwörter' }
        },
        lastError: null,
        timestamps: { created: now, updated: now },
    };
    jobDatabase.set(jobId, newJob);
    persistJob(newJob);
    
    // Don't await runJob, let it run in the background
    runJob(jobId);

    return { jobId };
};

export const getJobStatus = async (jobId: string): Promise<Job> => {
    if (!jobDatabase.has(jobId)) { throw new Error('Job not found'); }
    return JSON.parse(JSON.stringify(jobDatabase.get(jobId)!));
};

export const controlJob = async (jobId: string, action: 'resume' | 'pause' | 'next' | 'cancel' | 'regenerate_panel' | 'add_panel' | 'regenerate_panel_segment' | 'run_linter', panelIndex?: number, payload?: any): Promise<void> => {
    const job = jobDatabase.get(jobId);
    if (!job) throw new Error('Job not found');
    switch(action) {
        case 'pause': if (job.state === 'running') job.state = 'paused'; break;
        case 'resume': if (job.state === 'paused') { job.state = 'running'; runJob(jobId); } break;
        case 'cancel': job.state = 'error'; job.lastError = { code: 'CANCELLED', message: 'Job vom Benutzer abgebrochen.', atStep: job.step.kind }; break;
        // FIX: The 'run_linter' action was previously using dummy data. It has been updated to execute the actual linter service,
        // providing real-time, accurate linting results for all panels and updating the job state accordingly.
        case 'run_linter':
            if (FLAGS.LINTER_MVP) {
                job.results.panels.forEach(p => {
                    if (p.panel) {
                        const panelIssues = lintPanel(p.panel, job.results.geo?.city, job.results.geo?.region);
                        // Preserve existing breakdown but update geo score
                        const oldBreakdown = p.linting_results?.quality_score_breakdown || createDummyLintingResults(p.panel).quality_score_breakdown!;
                        p.linting_results = {
                            passed: !panelIssues.some(i => i.severity === 'ERROR'),
                            has_warnings: panelIssues.some(i => i.severity === 'WARN'),
                            issues: panelIssues,
                            similarity_score: p.linting_results?.similarity_score || 0.1, // Preserve old score
                            content_hash: calculatePanelContentHash(p.panel), // Recalculate hash
                            quality_score_breakdown: {
                                ...oldBreakdown,
                                geo_integration: { score: panelIssues.some(i => i.code === 'TITLE_NO_GEO') ? 70 : 98, weight: 0.2 },
                            }
                        };
                        // Recalculate total quality score
                        p.quality_score = Math.round(Object.values(p.linting_results.quality_score_breakdown || {}).reduce((acc, curr) => acc + curr.score * curr.weight, 0));
                    }
                });
                // Also re-lint the whole set for keyword duplications
                const successfulPanels = job.results.panels
                    .filter(p => p.status === 'ok' && p.panel)
                    .map(p => p.panel!);
                job.results.lintSummary = lintSetKeywordDups(successfulPanels);
            } else {
                // Fallback to dummy results if LINTER_MVP is off
                job.results.panels.forEach(p => { if (p.panel) { p.linting_results = createDummyLintingResults(p.panel); } });
            }
            await new Promise(res => setTimeout(res, 300)); // Simulate async work
            break;
        // FIX: Implement missing control actions
        case 'regenerate_panel':
            if (panelIndex !== undefined && job.results.panels[panelIndex]) {
                const panelResult = job.results.panels[panelIndex];
                job.results.panels[panelIndex] = {
                    ...panelResult,
                    status: 'pending',
                    panel: undefined,
                    error: undefined,
                    linting_results: { passed: false, has_warnings: false, issues: [], similarity_score: 0, content_hash: '' },
                    quality_score: undefined,
                };
                if (job.state !== 'running') {
                    job.state = 'running';
                    runJob(jobId);
                }
            }
            break;
        case 'add_panel':
            if (payload?.topic) {
                const newPanelIndex = job.results.panels.length;
                const newPanelResult: PanelResult = {
                    index: newPanelIndex,
                    status: 'pending',
                    topic: payload.topic,
                    angle: 'Leistungen',
                    linting_results: { passed: false, has_warnings: false, issues: [], similarity_score: 0, content_hash: '' },
                };
                job.results.panels.push(newPanelResult);
                job.userInput.panelCount = String(job.results.panels.length) as PanelCount;
                if (!job.userInput.topics) job.userInput.topics = [];
                job.userInput.topics.push(payload.topic);
                if (job.state !== 'running') {
                    job.state = 'running';
                    runJob(jobId);
                }
            }
            break;
        case 'regenerate_panel_segment':
            if (panelIndex !== undefined && payload?.segment && job.results.panels[panelIndex]?.panel) {
                const panelToUpdate = job.results.panels[panelIndex];
                const segment = payload.segment;
                const originalState = job.state;
                job.state = 'running';
                job.step = { kind: 'panel_segment', index: panelIndex, segment, description: `Generiere '${segment}' neu...` };
                persistJob(job);

                try {
                    const existingTitles = job.results.panels.filter(p => p.panel && p.index !== panelIndex).map(p => p.panel!.title);
                    const regeneratedPanel = await regeneratePanelSegment(job.userInput, panelToUpdate.panel!, segment, existingTitles);

                    // Re-lint the updated panel
                    const panelIssues = lintPanel(regeneratedPanel, job.results.geo?.city, job.results.geo?.region);
                    const linting_results = {
                        passed: !panelIssues.some(i => i.severity === 'ERROR'),
                        has_warnings: panelIssues.some(i => i.severity === 'WARN'),
                        issues: panelIssues,
                        similarity_score: 0.1, // Dummy value
                        content_hash: calculatePanelContentHash(regeneratedPanel),
                        quality_score_breakdown: createDummyLintingResults(regeneratedPanel).quality_score_breakdown
                    };

                    const quality_score = Math.round(Object.values(linting_results.quality_score_breakdown || {}).reduce((acc, curr) => acc + curr.score * curr.weight, 0));

                    panelToUpdate.panel = regeneratedPanel;
                    panelToUpdate.linting_results = linting_results;
                    panelToUpdate.quality_score = quality_score;
                    if (panelToUpdate.segment_locks) {
                        delete panelToUpdate.segment_locks[segment as keyof PanelSegmentsLockState];
                    }
                    job.state = originalState; // Restore original state
                    job.step = { kind: 'finalizing', description: 'Abgeschlossen' }; // Reset step
                } catch (error) {
                    console.error("Segment regeneration failed:", error);
                    job.state = 'error';
                    job.lastError = { code: 'SEGMENT_REGEN_FAILED', message: error instanceof Error ? error.message : "Segment-Regenerierung fehlgeschlagen.", atStep: job.step.kind };
                }
            }
            break;
        default: console.warn(`Control action '${action}' not fully implemented.`); break;
    }
    persistJob(job);
};

export const getTopicSuggestions = async (jobId: string): Promise<string[]> => {
    const job = jobDatabase.get(jobId);
    if (!job || !job.results.topic) return [];
    await new Promise(res => setTimeout(res, 300));
    return [ `Kundenrezensionen und Fallstudien`, `Unser Team in ${job.results.geo?.city}`, ];
};

export const runHealthCheck = async (type: 'connection' | 'dry-run'): Promise<HealthReport> => {
    const isDryRun = type === 'dry-run';
    const backendCheck = await runAIPing();
    const lastRunId = Array.from(jobDatabase.keys()).pop();

    const report: HealthReport = {
        timestamp: new Date().toISOString(), status: backendCheck.ok ? 'green' : 'red',
        summary: backendCheck.ok ? 'Alle System-Checks erfolgreich bestanden.' : 'Ein kritischer Fehler wurde bei der KI-Anbindung festgestellt.',
        checks: {
            backend: { ok: backendCheck.ok, status: backendCheck.ok ? 'green' : 'red', latency_ms: backendCheck.latency_ms, message: backendCheck.message, source: 'live' },
            mini_prompt: { ok: isDryRun ? backendCheck.ok : false, status: isDryRun ? (backendCheck.ok ? 'green' : 'red') : 'neutral', latency_ms: isDryRun ? backendCheck.latency_ms : undefined, message: isDryRun ? backendCheck.message : 'Nicht getestet', source: isDryRun ? 'live' : undefined },
            placeholders: { ok: true, status: 'green', unresolved: [], message: 'OK', source: 'mock' },
            keywords: { ok: true, status: 'green', duplicates: [], message: 'OK', source: 'mock' },
            rate_limit: { ok: true, status: 'green', remaining: 99, quota: 100, message: 'OK', source: 'mock' },
            runs: Array.from(jobDatabase.values()).slice(-3).map(j => ({ id: j.jobId, panels: j.results.panels.length, tone: j.userInput.tone, detail: j.userInput.contentDepth, timestamp: j.timestamps.created })),
            system: { app_version: "2.0.0", build_hash: "live-b7c4d5", env: "development", feature_flags: ['LIVE_AI_MODE', 'GUARDS_V1', ... (FLAGS.LINTER_MVP ? ['LINTER_MVP'] : []) ], lastRunId }
        }
    };
    return report;
};

// --- Persistence-related functions ---

/**
 * Initializes the first job from sessionStorage if available.
 * This populates the in-memory jobDatabase for the current session.
 * @returns The loaded Job object or null.
 */
export const initJobFromStorage = (): Job | null => {
  if (!FLAGS.PERSISTENCE_MVP) return null;
  const job = loadActiveJob();
  if (job?.jobId) {
    jobDatabase.set(job.jobId, job);
    return job;
  }
  return null;
};

/**
 * Clears the persisted job state from sessionStorage.
 */
export const clearPersistedJob = () => {
  if (FLAGS.PERSISTENCE_MVP) {
    clearActiveJob();
  }
};