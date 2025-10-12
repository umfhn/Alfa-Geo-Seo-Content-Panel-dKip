import React, { useState, useCallback, useEffect, useMemo } from 'react';
import type { Job, CIColors, Panel, SectionLabels, ExportProfile, PanelResult, LintIssue, SeoData } from '../types';
import AccordionPanel from './AccordionPanel';
import { AddPanelModal } from './AddPanelModal';
import { PanelPlaceholder } from './PanelPlaceholder';
import { ExplainabilityCard } from './ExplainabilityCard';
import { IconJson, IconCopy, IconDownload, IconInfo, IconCss, IconEdit, IconShieldCheck, IconMonitor, IconTablet, IconPhone, IconArrowUp, IconArrowDown, IconPlusCircle, IconTrash } from './Icons';
import { generateExportBundle, ExportBundle, generateSeoData, generateOnePageHtml } from '../services/exportService';
import { defaultCIColors, designPresets, getContrastRatio, getWcagRating } from '../services/exportService';

// --- Start of in-file component: DesignPresetModal ---
const DesignPresetModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onApplyPreset: (colors: CIColors) => void;
  setToast: (toast: { message: string; type: 'success' | 'warning' | 'error' } | null) => void;
}> = ({ isOpen, onClose, onApplyPreset, setToast }) => {

    const copyToClipboard = (text: string, successMessage: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setToast({ message: successMessage, type: 'success' });
        }).catch(() => {
            setToast({ message: 'Kopieren fehlgeschlagen.', type: 'error' });
        });
    };

    const handleCopyCss = (colors: CIColors) => {
        const cssVars = `
:root {
  --dkip-primary: ${colors.primary};
  --dkip-secondary: ${colors.secondary};
  --dkip-accent: ${colors.accent};
  --dkip-text-primary: ${colors.text_primary};
  --dkip-text-secondary: ${colors.text_secondary};
}`.trim();
        copyToClipboard(cssVars, 'CSS-Variablen kopiert!');
    };
    
    const handleCopyJson = (colors: CIColors) => {
        const jsonString = JSON.stringify({
            primary: colors.primary,
            secondary: colors.secondary,
            accent: colors.accent,
            text_primary: colors.text_primary,
            text_secondary: colors.text_secondary,
        }, null, 2);
        copyToClipboard(jsonString, 'JSON-Tokens kopiert!');
    };

    const ContrastBadge: React.FC<{ label: string; color1: string; color2: string }> = ({ label, color1, color2 }) => {
        const ratio = getContrastRatio(color1, color2);
        const { level, color } = getWcagRating(ratio);
        return (
            <div className="text-xs flex items-center justify-between">
                <span className="text-brand-text-secondary">{label}</span>
                <span className={`font-bold px-1.5 py-0.5 rounded ${color}`}>
                    {level} ({ratio.toFixed(2)})
                </span>
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-brand-primary/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-brand-secondary rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-brand-accent/20">
                    <h2 className="text-xl font-bold">Design-Presets wählen</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-brand-primary text-2xl" aria-label="Schließen">&times;</button>
                </div>
                <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {designPresets.map(preset => (
                        <div key={preset.name} className="bg-brand-primary rounded-lg p-4 flex flex-col space-y-4 border border-brand-accent/20">
                            <h3 className="font-bold text-center">{preset.name}</h3>
                            <div className="flex justify-center space-x-2">
                                {Object.entries(preset.colors).map(([key, value]) => {
                                    if (typeof value !== 'string' || !value.startsWith('#')) return null;
                                    return (
                                        <div 
                                            key={key} 
                                            className="w-8 h-8 rounded-full border-2 border-brand-secondary" 
                                            style={{ backgroundColor: value }}
                                            title={`${key}: ${value}`}
                                            onClick={() => copyToClipboard(value, `${value} kopiert!`)}
                                        />
                                    );
                                })}
                            </div>
                            <div className="bg-brand-secondary p-3 rounded-md space-y-2">
                                <h4 className="text-sm font-semibold text-center mb-2">WCAG Kontrast</h4>
                                <ContrastBadge label="Text auf Hintergrund" color1={preset.colors.text_primary} color2={preset.colors.secondary} />
                                <ContrastBadge label="Button auf Hintergrund" color1={preset.colors.primary} color2={preset.colors.secondary} />
                            </div>
                            <div className="flex flex-col space-y-2 pt-2">
                                <button onClick={() => onApplyPreset(preset.colors)} className="w-full text-sm bg-brand-accent text-white px-4 py-2 rounded-md hover:bg-brand-accent-hover transition-colors">
                                    Übernehmen
                                </button>
                                <div className="flex space-x-2">
                                    <button onClick={() => handleCopyCss(preset.colors)} className="flex-1 text-xs bg-brand-secondary px-3 py-1.5 rounded-md hover:bg-opacity-70 transition-colors">CSS</button>
                                    <button onClick={() => handleCopyJson(preset.colors)} className="flex-1 text-xs bg-brand-secondary px-3 py-1.5 rounded-md hover:bg-opacity-70 transition-colors">JSON</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
// --- End of in-file component ---


interface SixpackRendererProps {
  job: Job;
  onUpdatePanelSummary: (panelIndex: number, newSummary: string) => void;
  onUpdatePanelTitle: (panelIndex: number, newTitle: string) => void;
  onUpdateCIColors: (newColors: CIColors) => void;
  onUpdateSectionLabels: (newName: SectionLabels) => void;
  onRegeneratePanel: (panelIndex: number) => void;
  onRegeneratePanelSegment: (panelIndex: number, segment: string) => void;
  onTogglePanelLock: (panelIndex: number) => void;
  onJobControl: (action: 'resume' | 'pause' | 'next' | 'cancel' | 'regenerate_panel' | 'regenerate_panel_segment' | 'run_linter', panelIndex?: number) => void;
  onAddNewPanel: (topic: string) => void;
  onOpenAddPanelModal: () => void;
  topicSuggestions: string[];
}

type Viewport = 'desktop' | 'tablet' | 'mobile';

const defaultLabels: SectionLabels = { summary: 'Überblick', sections: 'Inhalte', faq: 'Häufige Fragen', keywords: 'Stichwörter' };
const legacyProfileOptions: { value: ExportProfile; label: string; description: string }[] = [
    { value: 'gutenberg', label: 'Gutenberg (Custom HTML)', description: 'Ein Block mit HTML und CSS, optimiert für den Gutenberg Custom HTML Block.' },
    { value: 'classic_inline', label: 'Klassischer Editor (Inline)', description: 'Ein Block mit CSS und HTML für den klassischen Text/HTML-Editor.' },
    { value: 'classic_split', label: 'Klassischer Editor (Split)', description: 'Getrenntes CSS und HTML für maximale Kompatibilität (z.B. für Redakteurs-Rollen).' },
    { value: 'raw_html', label: 'Raw HTML (ohne CSS)', description: 'Nur das HTML-Markup, für Seiten mit globaler CSS-Einbindung.' },
];
type PanelStatus = 'ok' | 'warn' | 'error' | 'stale';
type PanelStatusInfo = {
    status: PanelStatus;
    primaryReason: LintIssue | { code: 'HASH_MISMATCH' | 'NEVER_LINTED', message: string, severity: 'ERROR' } | null;
};
const simpleHash = (str: string): string => { let hash = 0; for (let i = 0; i < str.length; i++) { const char = str.charCodeAt(i); hash = (hash << 5) - hash + char; hash |= 0; } return hash.toString(); };
const calculatePanelContentHash = (panel: Panel): string => { const content = JSON.stringify({ title: panel.title, summary: panel.summary, sections: panel.sections, faqs: panel.faqs, keywords: panel.keywords }); return simpleHash(content); };


const ColorInput: React.FC<{ label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; disabled: boolean }> = ({ label, value, onChange, disabled }) => (
    <div className="flex items-center justify-between">
        <label className="text-sm text-brand-text-secondary">{label}</label>
        <div className={`flex items-center space-x-2 px-2 py-1 border rounded-md transition-colors duration-200 focus-within:ring-2 focus-within:ring-brand-accent ${disabled ? 'border-gray-600 bg-gray-700 cursor-not-allowed' : 'border-brand-accent/50 bg-brand-primary'}`}>
            <div className="relative w-6 h-6 flex-shrink-0">
                <div className="w-full h-full rounded-sm border border-white/20" style={{ backgroundColor: value }} aria-hidden="true" />
                <input type="color" value={value} onChange={onChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" disabled={disabled} aria-label={`${label} Farbwähler`} />
            </div>
            <input type="text" value={value.toUpperCase()} onChange={onChange} className="w-24 bg-transparent text-sm focus:outline-none disabled:cursor-not-allowed" disabled={disabled} aria-label={`${label} Hex-Code`} />
        </div>
    </div>
);
const NumberInput: React.FC<{ label: string; value: number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; disabled: boolean }> = ({ label, value, onChange, disabled }) => (
    <div className="flex items-center justify-between">
        <label className="text-sm text-brand-text-secondary">{label}</label>
        <input type="number" value={value} onChange={onChange} className={`w-24 border rounded-md px-2 py-1 text-sm text-right focus:ring-2 focus:ring-brand-accent focus:outline-none transition ${disabled ? 'bg-gray-700 border-gray-600' : 'bg-brand-primary border-brand-accent/50'}`} disabled={disabled} />
    </div>
);

export const SixpackRenderer: React.FC<SixpackRendererProps> = ({ 
    job, onUpdatePanelSummary, onUpdatePanelTitle, onUpdateCIColors, onUpdateSectionLabels, onRegeneratePanel, onRegeneratePanelSegment, onTogglePanelLock, onJobControl, onAddNewPanel, onOpenAddPanelModal, topicSuggestions,
}) => {
  const [showJson, setShowJson] = useState(false);
  const [exportSelection, setExportSelection] = useState<string>('all');
  const [includeContainer, setIncludeContainer] = useState(true);
  const [legacyExportProfile, setLegacyExportProfile] = useState<ExportProfile>('gutenberg');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' | 'error' } | null>(null);
  const [activeExplainabilityPanelIndex, setActiveExplainabilityPanelIndex] = useState<number | null>(null);
  const [editableLabels, setEditableLabels] = useState<SectionLabels | undefined>(job.results.section_labels);
  const [isAddPanelModalOpen, setIsAddPanelModalOpen] = useState(false);
  const [generatedExport, setGeneratedExport] = useState<ExportBundle | null>(null);
  const [editableColors, setEditableColors] = useState<CIColors | undefined>(job.results.ci_colors);
  const [isDesignDirty, setIsDesignDirty] = useState(false);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [isLinting, setIsLinting] = useState(false);
  
  const [viewport, setViewport] = useState<Viewport>('desktop');
  const [seoData, setSeoData] = useState<SeoData | null>(null);
  const [isJsonLdVisible, setIsJsonLdVisible] = useState(false);
  const [isSeoLoading, setIsSeoLoading] = useState(false);


  const { results } = job;
  const { topic, geo, panels: panelResults, section_labels, lintSummary } = results;
  const labels = section_labels || defaultLabels;
  
  useEffect(() => {
    if (!isDesignDirty) {
      setEditableColors(job.results.ci_colors);
    }
  }, [job.results.ci_colors, isDesignDirty]);
  useEffect(() => { setEditableLabels(section_labels); }, [section_labels]);

  useEffect(() => {
    if (job.state === 'done' && !seoData && !isSeoLoading) {
        const fetchSeoData = async () => {
            setIsSeoLoading(true);
            try {
                // Pass the whole job object to generateSeoData
                const generatedSeo = await generateSeoData(job);
                job.results.meta = { ...job.results.meta, title: generatedSeo.title, description: generatedSeo.description };
                setSeoData(generatedSeo);
            } catch (error) {
                console.error("Failed to fetch SEO data:", error);
            } finally {
                setIsSeoLoading(false);
            }
        };
        fetchSeoData();
    }
  }, [job, seoData, isSeoLoading]);

  const sectionIds = useMemo(() => [
    'design-section',
    'labels-section',
    'seo-section',
    'preview-section',
    'export-section',
    'json-section'
  ], []);

  const handleScrollToSection = useCallback((direction: 'up' | 'down') => {
    const sectionElements = sectionIds.map(id => document.getElementById(id)).filter(el => el !== null) as HTMLElement[];
    if (sectionElements.length === 0) return;

    if (direction === 'down') {
      const nextSection = sectionElements.find(el => el.getBoundingClientRect().top > 85);
      if (nextSection) {
        nextSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        sectionElements[sectionElements.length - 1]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      const prevSection = sectionElements.slice().reverse().find(el => el.getBoundingClientRect().top < 75);
      if (prevSection) {
        prevSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        sectionElements[0]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [sectionIds]);

  const getPanelStatus = useCallback((panelResult: PanelResult): PanelStatusInfo => {
    if (!panelResult.panel || panelResult.status !== 'ok') {
        return { status: 'error', primaryReason: { code: 'MISSING_TITLE_OR_SLUG', message: 'Panel-Inhalte fehlen oder sind fehlerhaft.', severity: 'ERROR' } };
    }
    const lint = panelResult.linting_results;
    if (!lint || lint.issues.some(i => i.code === 'NEVER_LINTED')) {
        return { status: 'stale', primaryReason: { code: 'NEVER_LINTED', message: 'Panel wurde noch nie geprüft.', severity: 'ERROR' } };
    }
    const currentHash = calculatePanelContentHash(panelResult.panel);
    if (currentHash !== lint.content_hash) {
        return { status: 'stale', primaryReason: { code: 'HASH_MISMATCH', message: 'Inhalt geändert, erneuter Linter nötig.', severity: 'ERROR' } };
    }
    if (!lint.passed) {
        return { status: 'error', primaryReason: lint.issues.find(i => i.severity === 'ERROR') || null };
    }
    if (lint.has_warnings) {
        return { status: 'warn', primaryReason: lint.issues.find(i => i.severity === 'WARN') || null };
    }
    return { status: 'ok', primaryReason: null };
  }, []);

  const successfulPanels = useMemo(() => panelResults.filter(pr => pr.status === 'ok' && pr.panel).map(pr => pr!), [panelResults]);
  
  const expectedPanelCount = useMemo(() => {
      if (job?.userInput?.panelCount) {
          return parseInt(job.userInput.panelCount, 10);
      }
      return job?.step?.of || panelResults.length || 6;
  }, [job, panelResults.length]);

  const gridContainerClasses = useMemo(() => {
    return 'grid grid-cols-1 gap-8';
  }, []);
  
  const viewportWrapperClasses = useMemo(() => {
    switch (viewport) {
        case 'tablet': return 'max-w-3xl mx-auto transition-all duration-300 ease-in-out';
        case 'mobile': return 'max-w-sm mx-auto transition-all duration-300 ease-in-out';
        default: return 'transition-all duration-300 ease-in-out';
    }
  }, [viewport]);

  const activeExplainabilityPanel = useMemo(() => { if (activeExplainabilityPanelIndex === null) return null; return panelResults.find(p => p.index === activeExplainabilityPanelIndex) || null; }, [activeExplainabilityPanelIndex, panelResults]);

  const exportStatus = useMemo(() => {
    const selectedIndexes = exportSelection === 'all' ? successfulPanels.map(p => p.index) : [successfulPanels[parseInt(exportSelection, 10)]?.index];
    const selectedPanelResults = successfulPanels.filter(p => selectedIndexes.includes(p.index));
    
    if (selectedPanelResults.length === 0) return { status: 'ERROR', errorCount: 0, staleCount: 0, warnCount: 0, okCount: 0, totalCount: 0 };
    
    let staleCount = 0, errorCount = 0, warnCount = 0, okCount = 0;
    
    selectedPanelResults.forEach(p => {
        const panelStatus = getPanelStatus(p);
        if (panelStatus.status === 'stale') staleCount++;
        else if (panelStatus.status === 'error') errorCount++;
        else if (panelStatus.status === 'warn') warnCount++;
        else okCount++;
    });

    const totalCount = selectedPanelResults.length;
    if (errorCount > 0) return { status: 'ERROR', errorCount, staleCount, warnCount, okCount, totalCount };
    if (staleCount > 0) return { status: 'STALE', errorCount, staleCount, warnCount, okCount, totalCount };
    if (warnCount > 0) return { status: 'WARN', errorCount, staleCount, warnCount, okCount, totalCount };
    return { status: 'OK', errorCount, staleCount, warnCount, okCount, totalCount };
  }, [exportSelection, successfulPanels, getPanelStatus]);

  const isExportAllowed = exportStatus.status === 'OK' || exportStatus.status === 'WARN';

  useEffect(() => { if (toast) { const timer = setTimeout(() => setToast(null), 5000); return () => clearTimeout(timer); } }, [toast]);

  useEffect(() => {
    if (job.userInput.outputFormat === 'legacy') {
        if (!editableColors || successfulPanels.length === 0) { setGeneratedExport(null); return; }
        const panelsToExport = exportSelection === 'all' ? successfulPanels.map(pr => pr.panel!) : [successfulPanels[parseInt(exportSelection, 10)]?.panel!];
        if (!panelsToExport || panelsToExport.length === 0 || !panelsToExport[0]) { setGeneratedExport(null); return; }
        const bundle = generateExportBundle(panelsToExport, includeContainer, legacyExportProfile, editableColors, labels);
        setGeneratedExport(bundle);
    }
  }, [legacyExportProfile, exportSelection, includeContainer, successfulPanels, editableColors, labels, job.userInput.outputFormat]);

  const handleCopy = useCallback((content: string | undefined, message: string) => {
    if (!isExportAllowed) { setToast({ message: 'Export blockiert: Bitte zuerst Linter-Probleme beheben.', type: 'warning' }); return; }
    if (!content) { setToast({ message: 'Kein Inhalt zum Kopieren verfügbar.', type: 'error' }); return; }
    navigator.clipboard.writeText(content).then(() => { setToast({ message, type: 'success' }); }).catch(err => { console.error('Kopieren fehlgeschlagen: ', err); setToast({ message: 'Kopieren fehlgeschlagen.', type: 'error' }); });
  }, [isExportAllowed]);

  const handleQuickLinter = useCallback(async () => {
    setIsLinting(true);
    setToast({ message: 'Linter-Prüfung wird ausgeführt...', type: 'success' });
    try {
        await onJobControl('run_linter');
        setToast({ message: 'Linter-Prüfung abgeschlossen.', type: 'success' });
    } catch (error) {
        console.error("Linter run failed:", error);
        setToast({ message: 'Linter-Prüfung fehlgeschlagen.', type: 'error' });
    } finally {
        setIsLinting(false);
    }
  }, [onJobControl]);

  const jobJson = JSON.stringify(job, null, 2);
  const handleCopyJson = useCallback(() => { navigator.clipboard.writeText(jobJson).then(() => { setToast({ message: 'Job-JSON in die Zwischenablage kopiert!', type: 'success' }); }).catch(err => { console.error('Kopieren fehlgeschlagen: ', err); setToast({ message: 'Kopieren fehlgeschlagen.', type: 'error' }); }); }, [jobJson]);
  const handleColorChange = useCallback((key: keyof CIColors, value: string | number) => { setEditableColors(prev => { if (!prev) return undefined; setIsDesignDirty(true); return { ...prev, [key]: value }; }); }, []);
  const handleApplyDesignChanges = useCallback(() => { if (editableColors) { onUpdateCIColors(editableColors); setIsDesignDirty(false); setToast({ message: 'Design wurde aktualisiert.', type: 'success' }); localStorage.setItem('dkip:lastDesign', JSON.stringify(editableColors)); } }, [editableColors, onUpdateCIColors]);
  const handleDiscardDesignChanges = useCallback(() => { setEditableColors(job.results.ci_colors); setIsDesignDirty(false); }, [job.results.ci_colors]);
  const handleApplyPreset = useCallback((colors: CIColors) => { setEditableColors(colors); setIsDesignDirty(true); setToast({ message: 'Preset geladen. Klicken Sie auf „Änderungen anwenden“, um die Vorschau zu aktualisieren.', type: 'success' }); setIsPresetModalOpen(false); }, []);
  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (editableLabels) { setEditableLabels({ ...editableLabels, [e.target.name]: e.target.value }); } };
  const handleSaveLabels = () => { if (editableLabels) onUpdateSectionLabels(editableLabels); };
  const handleResetDesignToDefault = useCallback(() => { const defaultPreset = designPresets[0]; if (defaultPreset) { onUpdateCIColors(defaultPreset.colors); setToast({ message: 'Design auf Standard zurückgesetzt.', type: 'success' }); } }, [onUpdateCIColors]);
  const handleGenerateNewPanel = (topic: string) => { onAddNewPanel(topic); setIsAddPanelModalOpen(false); };
  const handleOpenModal = () => { onOpenAddPanelModal(); setIsAddPanelModalOpen(true); };
  const handleSeoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!seoData) return;
    setSeoData({ ...seoData, [e.target.name]: e.target.value });
  };
    const handleDownloadSinglePanel = useCallback((panelIndex: number) => {
    // This function becomes less relevant in one-page mode, but we keep it for individual panel inspection.
    setToast({ message: `Einzel-Download im One-Page-Modus nicht vorgesehen. Nutzen Sie den Gesamt-Export.`, type: 'warning' });
  }, []);

  const handleOnePageExport = useCallback((options: { includeCss: boolean, forWp: boolean }) => {
    const htmlContent = generateOnePageHtml(job, options);
    
    if(options.forWp) {
        navigator.clipboard.writeText(htmlContent).then(() => {
            setToast({ message: 'WordPress HTML-Block in die Zwischenablage kopiert!', type: 'success' });
        }).catch(() => {
            setToast({ message: 'Kopieren fehlgeschlagen.', type: 'error' });
        });
        return;
    }

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const fileName = `onepage_${geo?.companyName.toLowerCase().replace(/\s/g, '-') || 'export'}.html`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setToast({ message: 'One-Page HTML wird heruntergeladen.', type: 'success' });

  }, [job, geo]);


  if (!geo || !topic) return null;

  const renderExportBanner = () => {
    switch (exportStatus.status) {
        case 'OK':
            return <div className="flex justify-end items-center"><span className="text-xs font-bold uppercase px-2 py-1 rounded bg-green-500/20 text-green-300">Linter: OK</span></div>;
        case 'WARN':
            return <div className="p-3 rounded-lg bg-yellow-900/50 border border-yellow-700 text-yellow-200 text-sm"><strong className="font-bold">Linter-Warnungen vorhanden.</strong> Export ist möglich. Prüfen Sie die Hinweise in der Liste.</div>;
        case 'ERROR':
            return <div className="p-3 rounded-lg bg-red-900/50 border border-red-700 text-red-200 text-sm"><strong className="font-bold">Export blockiert.</strong> {exportStatus.errorCount} Panel(s) mit Fehlern. Bitte beheben und erneut prüfen.</div>;
        case 'STALE':
            return (
                <div className="p-3 rounded-lg bg-gray-700/50 border border-gray-500 text-gray-300 text-sm flex flex-col sm:flex-row justify-between items-center gap-3">
                    <div>
                        <strong className="font-bold">Linter-Check fehlt.</strong>
                        <p>Für {exportStatus.staleCount} von {exportStatus.totalCount} ausgewählten Panels liegt kein passender Linter-Report vor.</p>
                    </div>
                    <button onClick={handleQuickLinter} disabled={isLinting} className="px-4 py-2 text-sm rounded-md bg-brand-accent text-white hover:bg-brand-accent-hover transition-colors disabled:bg-gray-500 flex-shrink-0">
                        {isLinting ? 'Prüfe...' : 'Jetzt Linter für Auswahl ausführen'}
                    </button>
                </div>
            );
        default: return null;
    }
  };

  const mobileFontSize = Math.round(Math.max(18, (editableColors?.fontSizeTitle || 24) * 0.85));
  const desktopFontSize = editableColors?.fontSizeTitle || 24;

  const dynamicTitleStyles = `
      .dkip-panel__title {
          font-size: ${mobileFontSize}px;
          line-height: 1.2;
      }

      @media (min-width: 768px) {
          .dkip-panel__title {
              font-size: ${desktopFontSize}px;
          }
      }
  `;

  return (
    <>
    <style>{dynamicTitleStyles}</style>
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-brand-text">Content für: {topic}</h2>
        <p className="text-brand-text-secondary">{geo.branch && `${geo.branch} | `}{geo.street && `${geo.street}, `}{geo.zip} {geo.city} {geo.region && `(${geo.region})`}</p>
      </div>

      <div id="design-section" className="bg-brand-secondary rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Design-Anpassung</h3>
            <div className="flex items-center space-x-2">
                 <button onClick={() => setIsPresetModalOpen(true)} className="px-3 py-1 text-xs rounded-md bg-brand-accent text-white hover:bg-brand-accent-hover transition-colors">Design-Presets</button>
                <button onClick={handleResetDesignToDefault} className="px-3 py-1 text-xs rounded-md bg-brand-primary text-brand-text-secondary hover:bg-opacity-70 transition-colors" title="Design auf Standardwerte zurücksetzen">Zurücksetzen</button>
            </div>
        </div>
        {editableColors ? ( <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
             <div className="space-y-3">
                <ColorInput label="Primär (Buttons)" value={editableColors.primary} onChange={(e) => handleColorChange('primary', e.target.value)} disabled={!editableColors} />
                <ColorInput label="Sekundär (Hintergründe)" value={editableColors.secondary} onChange={(e) => handleColorChange('secondary', e.target.value)} disabled={!editableColors} />
                <ColorInput label="Akzent (Hervorhebung)" value={editableColors.accent} onChange={(e) => handleColorChange('accent', e.target.value)} disabled={!editableColors} />
                <ColorInput label="Text Primär" value={editableColors.text_primary} onChange={(e) => handleColorChange('text_primary', e.target.value)} disabled={!editableColors} />
                <ColorInput label="Text Sekundär" value={editableColors.text_secondary} onChange={(e) => handleColorChange('text_secondary', e.target.value)} disabled={!editableColors} />
            </div>
             <div className="space-y-3">
                 <NumberInput label="Schriftgröße Titel (px)" value={editableColors.fontSizeTitle} onChange={(e) => handleColorChange('fontSizeTitle', parseInt(e.target.value, 10) || 0)} disabled={!editableColors} />
                 <NumberInput label="Schriftgröße Akkordeon-Titel (px)" value={editableColors.fontSizeAccordionTitle} onChange={(e) => handleColorChange('fontSizeAccordionTitle', parseInt(e.target.value, 10) || 0)} disabled={!editableColors} />
                 <NumberInput label="Schriftgröße Inhalt (px)" value={editableColors.fontSizeContent} onChange={(e) => handleColorChange('fontSizeContent', parseInt(e.target.value, 10) || 0)} disabled={!editableColors} />
            </div>
          </div>
          {isDesignDirty && ( <div className="mt-6 flex flex-col sm:flex-row justify-end items-center gap-3 bg-brand-primary p-3 rounded-lg border border-brand-accent/30"> <p className="text-sm text-yellow-300">Sie haben ungespeicherte Design-Änderungen.</p> <div className="flex gap-2"> <button onClick={handleDiscardDesignChanges} className="px-4 py-2 text-xs rounded-md bg-brand-secondary hover:bg-opacity-80 transition-colors">Verwerfen</button> <button onClick={handleApplyDesignChanges} className="px-4 py-2 text-xs rounded-md bg-brand-accent text-white hover:bg-brand-accent-hover transition-colors">Änderungen anwenden</button> </div> </div> )}
            </> ) : <p className="text-brand-text-secondary">CI-Farben werden extrahiert...</p>}
      </div>

       <div id="labels-section" className="bg-brand-secondary rounded-xl shadow-lg">
          <details className="p-6 group">
              <summary className="text-xl font-bold list-none cursor-pointer flex justify-between items-center"> Sektions-Überschriften anpassen <span className="text-brand-accent group-open:rotate-90 transition-transform">&#10148;</span> </summary>
              <div className="mt-4 space-y-4">
                  {editableLabels && Object.entries(editableLabels).map(([key, value]) => ( <div key={key}> <label htmlFor={`label-${key}`} className="block text-sm font-medium text-brand-text-secondary capitalize mb-1">{key === 'faq' ? 'FAQ' : key}</label> <input id={`label-${key}`} type="text" name={key} value={value} onChange={handleLabelChange} className="w-full bg-brand-primary border border-brand-accent/50 rounded-md p-2 focus:ring-2 focus:ring-brand-accent focus:outline-none transition" /> </div> ))}
                   <div className="flex justify-end pt-2"> <button onClick={handleSaveLabels} className="px-4 py-2 text-sm rounded-md bg-brand-accent text-white hover:bg-brand-accent-hover transition-colors">Überschriften speichern</button> </div>
              </div>
          </details>
      </div>

      <div id="seo-section" className="bg-brand-secondary rounded-xl shadow-lg">
          <details className="p-6 group" open>
              <summary className="text-xl font-bold list-none cursor-pointer flex justify-between items-center"> SEO Metadaten &amp; JSON-LD <span className="text-brand-accent group-open:rotate-90 transition-transform">&#10148;</span> </summary>
              {isSeoLoading ? (
                  <div className="mt-4 text-center text-sm text-brand-text-secondary">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-brand-accent mx-auto mb-2"></div>
                      <p>Generiere SEO-Metadaten mit KI...</p>
                  </div>
              ) : seoData ? (
                <div className="mt-6 space-y-6">
                    <div>
                        <label htmlFor="seo-title" className="flex justify-between items-center text-sm font-medium text-brand-text-secondary mb-1">
                            <span>SEO Title (max. 60 Zeichen)</span>
                            <span className={`font-mono text-xs ${seoData.title.length > 60 ? 'text-red-400' : ''}`}>{seoData.title.length}/60</span>
                        </label>
                        <input id="seo-title" type="text" name="title" value={seoData.title} onChange={handleSeoChange} maxLength={60} className="w-full bg-brand-primary border border-brand-accent/50 rounded-md p-2 focus:ring-2 focus:ring-brand-accent focus:outline-none transition" />
                    </div>
                     <div>
                        <label htmlFor="seo-description" className="flex justify-between items-center text-sm font-medium text-brand-text-secondary mb-1">
                            <span>Meta Description (max. 155 Zeichen)</span>
                             <span className={`font-mono text-xs ${seoData.description.length > 155 ? 'text-red-400' : ''}`}>{seoData.description.length}/155</span>
                        </label>
                        <textarea id="seo-description" name="description" value={seoData.description} onChange={handleSeoChange} maxLength={155} rows={3} className="w-full bg-brand-primary border border-brand-accent/50 rounded-md p-2 focus:ring-2 focus:ring-brand-accent focus:outline-none transition" />
                    </div>
                     <div>
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-medium text-brand-text-secondary">Generiertes JSON-LD</label>
                            <div className="flex items-center space-x-2">
                                <button onClick={() => handleCopy(seoData.jsonLd, 'JSON-LD kopiert!')} className="p-1.5 rounded-full text-brand-text-secondary hover:bg-brand-primary transition-colors" title="JSON-LD kopieren"><IconCopy className="w-4 h-4" /></button>
                                <button onClick={() => setIsJsonLdVisible(!isJsonLdVisible)} className="p-1.5 rounded-full text-brand-text-secondary hover:bg-brand-primary transition-colors" title="Anzeigen/Verbergen"><IconJson className="w-4 h-4" /></button>
                            </div>
                        </div>
                        {isJsonLdVisible && (
                             <pre className="bg-brand-primary p-4 mt-2 rounded-lg text-xs text-brand-text-secondary overflow-x-auto"><code>{seoData.jsonLd || 'Keine strukturierten Daten generiert.'}</code></pre>
                        )}
                    </div>
                </div>
              ) : <p className="mt-4 text-sm text-brand-text-secondary">SEO-Daten werden nach Abschluss des Jobs generiert...</p>}
          </details>
      </div>
      
      <div className="bg-brand-secondary rounded-lg p-2 flex justify-center items-center space-x-2 my-4 sticky top-20 z-10">
        <button onClick={() => handleScrollToSection('up')} className="p-2 rounded-md transition-colors text-brand-text-secondary hover:bg-brand-primary" title="Zum vorherigen Bereich scrollen">
            <IconArrowUp className="w-6 h-6" />
        </button>
        <button onClick={() => handleScrollToSection('down')} className="p-2 rounded-md transition-colors text-brand-text-secondary hover:bg-brand-primary" title="Zum nächsten Bereich scrollen">
            <IconArrowDown className="w-6 h-6" />
        </button>
        <div className="h-6 w-px bg-brand-primary mx-2"></div>
        {(['desktop', 'tablet', 'mobile'] as const).map(v => (
            <button key={v} onClick={() => setViewport(v)} className={`p-2 rounded-md transition-colors ${viewport === v ? 'bg-brand-accent text-white' : 'text-brand-text-secondary hover:bg-brand-primary'}`} title={`Vorschau: ${v.charAt(0).toUpperCase() + v.slice(1)}`}>
                {v === 'desktop' && <IconMonitor className="w-6 h-6" />}
                {v === 'tablet' && <IconTablet className="w-6 h-6" />}
                {v === 'mobile' && <IconPhone className="w-6 h-6" />}
            </button>
        ))}
      </div>
      
      <div id="preview-section">
        <div className={viewportWrapperClasses}>
          <div className={gridContainerClasses}>
              {Array.from({ length: expectedPanelCount }).map((_, index) => {
              const panelResult = panelResults.find(p => p.index === index);
              if (panelResult && panelResult.status === 'ok' && panelResult.panel) {
                  return <AccordionPanel key={`${panelResult.panel.slug}-${index}`} panelResult={panelResult} ciColors={editableColors} sectionLabels={section_labels} job={job} onUpdateSummary={onUpdatePanelSummary} onUpdateTitle={onUpdatePanelTitle} onShowExplainability={() => setActiveExplainabilityPanelIndex(index)} onRegenerate={onRegeneratePanel} onRegeneratePanelSegment={onRegeneratePanelSegment} onToggleLock={onTogglePanelLock} onDownloadPanel={handleDownloadSinglePanel} />;
              }
              const currentStatus = panelResult?.status || 'pending';
              const placeholderStatus = currentStatus === 'ok' ? 'failed' : currentStatus;
              const placeholderError = currentStatus === 'ok' ? 'Panel-Daten sind inkonsistent (Status \'ok\', aber keine Inhalte).' : panelResult?.error;
              return <PanelPlaceholder key={`placeholder-${index}`} index={index} status={placeholderStatus} error={placeholderError} job={job} onRegeneratePanel={onRegeneratePanel} onJobControl={onJobControl} />;
              })}
          </div>
        </div>
      </div>


      {job.state === 'done' && (
        <div className="text-center pt-4">
          <button onClick={handleOpenModal} className="inline-flex items-center justify-center px-8 py-4 bg-brand-secondary text-brand-text font-bold rounded-lg border-2 border-dashed border-brand-accent/50 hover:border-brand-accent hover:bg-brand-primary transition-colors duration-300 shadow-lg"> <span className="text-2xl mr-3">+</span> Neues Panel hinzufügen </button>
        </div>
      )}

      <div className="text-center text-sm text-brand-text-secondary px-6"> <p><strong>Hinweis:</strong> Die Sektion "Stichwörter" wird beim HTML-Export standardmäßig eingeklappt, um die Nutzererfahrung zu optimieren.</p> </div>

      <div id="export-section" className="bg-brand-secondary rounded-xl shadow-lg p-6">
        {job.userInput.outputFormat === 'onepage' ? (
          <div>
            <h3 className="text-xl font-bold mb-4">One-Page Export</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button onClick={() => handleOnePageExport({ includeCss: true, forWp: false })} className="w-full inline-flex items-center justify-center px-6 py-3 bg-brand-accent text-white font-bold rounded-lg hover:bg-brand-accent-hover transition-colors">
                  <IconDownload className="w-5 h-5 mr-2" /> HTML (mit CSS)
              </button>
              <button onClick={() => handleOnePageExport({ includeCss: false, forWp: false })} className="w-full inline-flex items-center justify-center px-6 py-3 bg-brand-secondary text-brand-text font-bold rounded-lg hover:bg-brand-primary transition-colors">
                  <IconDownload className="w-5 h-5 mr-2" /> HTML (ohne CSS)
              </button>
              <button onClick={() => handleOnePageExport({ includeCss: true, forWp: true })} className="w-full inline-flex items-center justify-center px-6 py-3 bg-brand-secondary text-brand-text font-bold rounded-lg hover:bg-brand-primary transition-colors">
                  <IconCopy className="w-5 h-5 mr-2" /> WP HTML-Block
              </button>
            </div>
            <p className="text-xs text-brand-text-secondary mt-3 text-center">Exportiert die gesamte Seite als einzelne Datei oder kopiert den Inhalt für einen WordPress Custom HTML Block (erfordert `unfiltered_html` Rechte).</p>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-2"> <h3 className="text-xl font-bold">WordPress-Export (Legacy)</h3> </div>
            <p className="text-sm text-brand-text-secondary/80 mb-4">Exportiert einzelne Sektionen für den klassischen Gebrauch.</p>
            {renderExportBanner()}
            <div className="space-y-4 mt-4">
              <div>
                <label htmlFor="export-selection" className="block text-sm font-medium text-brand-text-secondary mb-1">Panel wählen</label>
                <select id="export-selection" value={exportSelection} onChange={(e) => setExportSelection(e.target.value)} className="w-full bg-brand-primary border border-brand-accent/50 rounded-md p-3 focus:ring-2 focus:ring-brand-accent focus:outline-none transition" disabled={successfulPanels.length === 0}>
                  <option value="all">Alle fertigen Panels exportieren ({successfulPanels.length})</option>
                  {successfulPanels.map((panelResult, index) => {
                      const { status } = getPanelStatus(panelResult);
                      const statusIcon = { ok: '✅', warn: '⚠️', error: '❌', stale: '❌' }[status];
                      return (
                        <option key={panelResult.panel!.slug + index} value={index}>
                          {statusIcon} Panel {panelResult.index + 1}: {panelResult.panel?.title || '(ohne Titel)'}
                        </option>
                      );
                  })}
                </select>
              </div>
               <div>
                  <label htmlFor="export-profile" className="block text-sm font-medium text-brand-text-secondary mb-1">Export-Profil</label>
                  <select id="export-profile" value={legacyExportProfile} onChange={(e) => setLegacyExportProfile(e.target.value as ExportProfile)} className="w-full bg-brand-primary border border-brand-accent/50 rounded-md p-3 focus:ring-2 focus:ring-brand-accent focus:outline-none transition">
                      {legacyProfileOptions.map(opt => ( <option key={opt.value} value={opt.value}>{opt.label}</option> ))}
                  </select>
                  <p className="text-xs text-brand-text-secondary mt-2 px-1">{legacyProfileOptions.find(p => p.value === legacyExportProfile)?.description}</p>
              </div>
              <div className="pt-2">
                {legacyExportProfile === 'classic_split' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button onClick={() => handleCopy(generatedExport?.css, 'CSS-Code kopiert!')} disabled={!isExportAllowed} className="w-full inline-flex items-center justify-center px-6 py-3 bg-brand-accent text-white font-bold rounded-lg hover:bg-brand-accent-hover transition-colors disabled:bg-gray-500"> <IconCss className="w-5 h-5 mr-2"/> CSS </button>
                        <button onClick={() => handleCopy(generatedExport?.html, 'HTML-Code kopiert!')} disabled={!isExportAllowed} className="w-full inline-flex items-center justify-center px-6 py-3 bg-brand-secondary text-brand-text font-bold rounded-lg hover:bg-brand-primary transition-colors disabled:bg-gray-500"> <IconCopy className="w-5 h-5 mr-2"/> HTML </button>
                    </div>
                ) : (
                    <button onClick={() => handleCopy(generatedExport?.combined || generatedExport?.html, 'Code kopiert!')} disabled={!isExportAllowed} className="w-full inline-flex items-center justify-center px-6 py-3 bg-brand-accent text-white font-bold rounded-lg hover:bg-brand-accent-hover transition-colors disabled:bg-gray-500"> <IconCopy className="w-5 h-5 mr-2"/> Code kopieren </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div id="json-section" className="bg-brand-secondary rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Job-JSON</h3>
            <div className="flex items-center space-x-2">
                 <button onClick={handleCopyJson} className="p-2 rounded-full text-brand-text-secondary hover:bg-brand-primary hover:text-white transition-colors" aria-label="JSON kopieren"> <IconCopy className="w-5 h-5" /> </button>
                <button onClick={() => setShowJson(!showJson)} className="p-2 rounded-full text-brand-text-secondary hover:bg-brand-primary hover:text-white transition-colors" aria-label="JSON anzeigen/verbergen"> <IconJson className="w-5 h-5" /> </button>
            </div>
        </div>
        {showJson && ( <pre className="bg-brand-primary p-4 rounded-lg text-xs text-brand-text-secondary overflow-x-auto"><code>{jobJson}</code></pre> )}
      </div>

       {activeExplainabilityPanel && ( <ExplainabilityCard panelResult={activeExplainabilityPanel} onClose={() => setActiveExplainabilityPanelIndex(null)} /> )}
      {toast && (
          <div aria-live="polite" className={`fixed bottom-5 right-5 max-w-sm w-full p-4 rounded-lg shadow-lg text-white z-50 ${ toast.type === 'success' ? 'bg-green-600' : toast.type === 'warning' ? 'bg-yellow-600' : 'bg-red-600' }`}>
            <div className="flex items-start">
              <div className="flex-1">
                <p className="text-sm font-semibold">{toast.type === 'success' && 'Erfolgreich'} {toast.type === 'warning' && 'Warnung'} {toast.type === 'error' && 'Fehler'}</p>
                <p className="text-sm mt-1">{toast.message}</p>
              </div>
              <button onClick={() => setToast(null)} className="ml-4 -mt-1 -mr-1 p-1 rounded-full hover:bg-black/20 text-xl leading-none">&times;</button>
            </div>
          </div>
      )}
    </div>
    <AddPanelModal isOpen={isAddPanelModalOpen} onClose={() => setIsAddPanelModalOpen(false)} onGenerate={handleGenerateNewPanel} suggestions={topicSuggestions} />
    <DesignPresetModal isOpen={isPresetModalOpen} onClose={() => setIsPresetModalOpen(false)} onApplyPreset={handleApplyPreset} setToast={setToast} />
    </>
  );
};