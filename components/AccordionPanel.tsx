import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { PanelResult, CIColors, SectionLabels, PanelSegmentsLockState, Job } from '../types';
import { IconPlay, IconPause, IconStop, IconEdit, IconClipboardList, IconShieldCheck, IconRefresh, IconLock, IconUnlock, IconDownload } from './Icons';
import { useTextToSpeech } from '../hooks/useTextToSpeech';

interface AccordionPanelProps {
  panelResult: PanelResult;
  ciColors?: CIColors;
  sectionLabels?: SectionLabels;
  job: Job;
  onUpdateSummary: (panelIndex: number, newSummary: string) => void;
  onUpdateTitle: (panelIndex: number, newTitle: string) => void;
  onShowExplainability: () => void;
  onRegenerate: (panelIndex: number) => void;
  onRegeneratePanelSegment: (panelIndex: number, segment: string) => void;
  onToggleLock: (panelIndex: number) => void;
  onDownloadPanel: (panelIndex: number) => void;
}

const defaultLabels: SectionLabels = {
    summary: 'Überblick',
    sections: 'Inhalte',
    faq: 'Häufige Fragen',
    keywords: 'Stichwörter',
};

const hexToRgba = (hex: string, alpha: number): string => {
  if (!hex || !/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
    // Fallback to a default color if hex is invalid
    return `rgba(74, 123, 255, ${alpha})`; 
  }
  let c = hex.substring(1).split('');
  if (c.length === 3) {
    c = [c[0], c[0], c[1], c[1], c[2], c[2]];
  }
  const i = parseInt(c.join(''), 16);
  const r = (i >> 16) & 255;
  const g = (i >> 8) & 255;
  const b = i & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const QualityScoreBadge: React.FC<{ score: number }> = ({ score }) => {
    const getColor = () => {
        if (score >= 90) return 'bg-green-500 text-white';
        if (score >= 75) return 'bg-yellow-500 text-black';
        return 'bg-red-500 text-white';
    };
    return (
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${getColor()}`}>
            {score}
        </div>
    );
};

const AccordionPanel: React.FC<AccordionPanelProps> = ({ 
    panelResult, 
    ciColors, 
    sectionLabels, 
    job,
    onUpdateSummary, 
    onUpdateTitle, 
    onShowExplainability,
    onRegenerate,
    onRegeneratePanelSegment,
    onToggleLock,
    onDownloadPanel
}) => {
  const { panel, index: panelIndex, quality_score = 0, is_locked = false, segment_locks } = panelResult;

  if (!panel) return null; // Should not happen if status is 'ok'

  const labels = sectionLabels || defaultLabels;
  const [openSection, setOpenSection] = useState<number | null>(0);
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isRegenDropdownOpen, setIsRegenDropdownOpen] = useState(false);

  const [editableSummary, setEditableSummary] = useState(panel.summary);
  const [editableTitle, setEditableTitle] = useState(panel.title);
  
  const isRegeneratingSegment = job.state === 'running' && job.step.kind === 'panel_segment' && job.step.index === panelIndex;
  const regeneratingSegmentName = isRegeneratingSegment ? job.step.segment : null;

  const allIssues = useMemo(() => {
    return panelResult.linting_results?.issues || [];
  }, [panelResult.linting_results]);
  const hasError = useMemo(() => allIssues.some(i => i.severity === 'ERROR'), [allIssues]);

  const regenOptions: { key: keyof PanelSegmentsLockState, label: string }[] = [
    { key: 'title', label: 'Nur Titel' },
    { key: 'summary', label: 'Nur Überblick' },
    { key: 'sections', label: 'Nur Inhalt' },
    { key: 'faq', label: 'Nur FAQ' },
    { key: 'keywords', label: 'Nur Stichwörter' },
  ];

  const handleRegenOptionClick = (key: string) => {
    onRegeneratePanelSegment(panelIndex, key);
    setIsRegenDropdownOpen(false);
  };

  useEffect(() => {
    if (!isEditingSummary) {
        setEditableSummary(panel.summary);
    }
  }, [panel.summary, isEditingSummary]);

  useEffect(() => {
    if (!isEditingTitle) {
        setEditableTitle(panel.title);
    }
  }, [panel.title, isEditingTitle]);


  const { isPlaying, isPaused, play, pause, stop, currentSentence } = useTextToSpeech(editableSummary);

  const toggleSection = (index: number) => {
    setOpenSection(openSection === index ? null : index);
  };

  const handleSummaryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditableSummary(e.target.value);
  };

  const handleSaveSummary = () => {
    onUpdateSummary(panelIndex, editableSummary);
    setIsEditingSummary(false);
  };
  
  const handleCancelEditSummary = () => {
    setEditableSummary(panel.summary);
    setIsEditingSummary(false);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditableTitle(e.target.value);
  };

  const handleSaveTitle = () => {
    onUpdateTitle(panelIndex, editableTitle);
    setIsEditingTitle(false);
  };
  
  const handleCancelEditTitle = () => {
    setEditableTitle(panel.title);
    setIsEditingTitle(false);
  };


  const keywordsText = useMemo(() => panel.keywords.join(', '), [panel.keywords]);

  const copyKeywords = useCallback(() => {
    navigator.clipboard.writeText(keywordsText).then(() => {
        alert('Keywords in die Zwischenablage kopiert!');
    }).catch(err => {
        console.error('Kopieren fehlgeschlagen: ', err);
        alert('Kopieren fehlgeschlagen.');
    });
  }, [keywordsText]);

  // Dynamic Styles from CI Colors
  const panelStyle = {
    backgroundColor: ciColors?.secondary || '#1A1A2E',
    border: is_locked ? `2px solid ${ciColors?.accent || '#4A7BFF'}` : 'none',
    boxShadow: is_locked ? `0 0 15px ${hexToRgba(ciColors?.accent || '#4A7BFF', 0.5)}` : 'none',
  };

  const titleStyle = {
    color: ciColors?.text_primary || '#EAEAEA',
  };
  
  const accordionTitleStyle = {
    fontSize: `${ciColors?.fontSizeAccordionTitle || 16}px`,
  };

  const contentStyle = {
    fontSize: `${ciColors?.fontSizeContent || 14}px`,
    color: ciColors?.text_secondary || '#A9A9A9',
  };

  const accordionBorderStyle = {
      borderColor: ciColors?.accent ? hexToRgba(ciColors.accent, 0.2) : 'rgba(74, 123, 255, 0.2)',
  };

  const keywordStyle = {
      backgroundColor: ciColors?.primary || '#1F51FF',
      color: '#FFFFFF',
  };


  return (
    <div style={panelStyle} className="rounded-xl shadow-lg overflow-hidden transition-all duration-300">
      <div className="p-4 sm:p-6 bg-brand-primary/50 flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex items-center gap-4 w-full">
            <QualityScoreBadge score={quality_score} />
            <div className="flex-grow">
                {isEditingTitle ? (
                    <div>
                        <input 
                            type="text"
                            value={editableTitle}
                            onChange={handleTitleChange}
                            style={{...titleStyle, lineHeight: '1.2'}}
                            className="w-full bg-brand-primary border border-brand-accent/50 rounded-md p-2 font-bold focus:ring-2 focus:ring-brand-accent focus:outline-none transition dkip-panel-title"
                        />
                         <div className="flex justify-end space-x-2 mt-3">
                            <button onClick={handleCancelEditTitle} className="px-3 py-1 text-xs rounded-md bg-brand-secondary hover:bg-opacity-80 transition-colors">Abbrechen</button>
                            <button onClick={handleSaveTitle} className="px-3 py-1 text-xs rounded-md bg-brand-accent text-white hover:bg-brand-accent-hover transition-colors">Speichern</button>
                        </div>
                    </div>
                ) : (
                     <h3 style={titleStyle} className="dkip-panel-title font-bold flex items-center gap-3">
                        {is_locked && <span title="Gesperrt" className="text-brand-accent"><IconLock className="w-5 h-5" /></span>}
                        <span>{editableTitle}</span>
                        {allIssues.length > 0 && (
                            <div 
                                className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-sm ${hasError ? 'bg-red-500' : 'bg-yellow-500'}`}
                                title={allIssues.map(i => `(${i.severity}) ${i.message}`).join('\n')}
                            >
                                !
                            </div>
                        )}
                    </h3>
                )}
            </div>
        </div>
        
        <div className="flex-shrink-0 flex items-center space-x-1 bg-brand-primary p-1 rounded-full">
            <div className="relative inline-flex" onMouseLeave={() => setIsRegenDropdownOpen(false)}>
                <button
                    onClick={() => onRegenerate(panelIndex)}
                    className="p-2 rounded-l-full text-brand-text-secondary hover:bg-brand-secondary hover:text-white transition-colors"
                    aria-label="Panel vollständig neu generieren"
                    title={is_locked ? "Panel ist gesperrt und kann nicht regeneriert werden." : "Panel vollständig neu generieren"}
                    disabled={is_locked}
                >
                    <IconRefresh className={`w-5 h-5 ${is_locked ? 'opacity-50' : ''}`} />
                </button>
                <button
                    onClick={() => setIsRegenDropdownOpen(prev => !prev)}
                    className="p-2 rounded-r-full text-brand-text-secondary hover:bg-brand-secondary hover:text-white transition-colors border-l border-brand-accent/20"
                    aria-haspopup="true"
                    aria-expanded={isRegenDropdownOpen}
                    title="Segmentweise neu generieren"
                    disabled={is_locked}
                >
                    <span className={`transform transition-transform duration-200 text-xs ${isRegenDropdownOpen ? 'rotate-180' : ''}`}>▼</span>
                </button>
                {isRegenDropdownOpen && !is_locked && (
                <div className="origin-top-right absolute right-0 mt-10 w-56 rounded-md shadow-lg bg-brand-secondary z-20 ring-1 ring-brand-accent/20">
                    <div className="py-1" role="menu" aria-orientation="vertical">
                    {regenOptions.map(opt => (
                        <button
                            key={opt.key}
                            // FIX: Cast opt.key to string to satisfy the handler's signature.
                            // The key is from `keyof PanelSegmentsLockState` which is always a string.
                            onClick={() => handleRegenOptionClick(opt.key as string)}
                            disabled={segment_locks?.[opt.key]}
                            title={segment_locks?.[opt.key] ? 'Segment gesperrt (manuell bearbeitet)' : `Nur '${opt.label}' neu generieren`}
                            className="block w-full text-left px-4 py-2 text-sm text-brand-text hover:bg-brand-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                            role="menuitem"
                        >
                        {opt.label}
                        </button>
                    ))}
                    </div>
                </div>
                )}
            </div>
             <button 
                onClick={() => onToggleLock(panelIndex)}
                className="p-2 rounded-full text-brand-text-secondary hover:bg-brand-secondary hover:text-white transition-colors"
                aria-label={is_locked ? "Panel entsperren" : "Panel sperren"}
                title={is_locked ? "Panel entsperren" : "Panel sperren"}
            >
                {is_locked ? <IconUnlock className="w-5 h-5 text-brand-accent" /> : <IconLock className="w-5 h-5" />}
            </button>
            <button 
                onClick={onShowExplainability}
                className="p-2 rounded-full text-brand-text-secondary hover:bg-brand-secondary hover:text-white transition-colors"
                aria-label="Qualitäts-Pipeline anzeigen"
                title="Qualitäts-Pipeline anzeigen"
            >
                <IconShieldCheck className="w-5 h-5" />
            </button>
            <button 
                onClick={() => onDownloadPanel(panelIndex)}
                className="p-2 rounded-full text-brand-text-secondary hover:bg-brand-secondary hover:text-white transition-colors"
                aria-label="Panel als HTML herunterladen"
                title="Panel als HTML herunterladen"
            >
                <IconDownload className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setIsEditingTitle(true)}
              className="p-2 rounded-full text-brand-text-secondary hover:bg-brand-secondary hover:text-white transition-colors"
              aria-label="Titel bearbeiten"
              title="Titel bearbeiten"
            >
              <IconEdit className="w-5 h-5" />
            </button>
        </div>
      </div>
      
      {isRegeneratingSegment && (
        <div className="p-2 bg-brand-accent/10 text-brand-accent text-sm text-center border-t border-b border-brand-accent/20">
            <span className="animate-pulse font-semibold">
                {`Generiere '${regeneratingSegmentName}' neu...`}
            </span>
        </div>
      )}

      <div className="p-6 space-y-6">
        
        {/* Summary Section */}
        <div>
          <h4 className="text-lg font-semibold text-brand-text mb-3 flex justify-between items-center">
            <span>{labels.summary}</span>
            <button 
              onClick={() => setIsEditingSummary(!isEditingSummary)}
              className="p-2 rounded-full text-brand-text-secondary hover:bg-brand-primary hover:text-white transition-colors"
              aria-label="Zusammenfassung bearbeiten"
            >
              <IconEdit className="w-5 h-5" />
            </button>
          </h4>
          {isEditingSummary ? (
            <div className="space-y-3">
              <textarea 
                value={editableSummary}
                onChange={handleSummaryChange}
                rows={6}
                className="w-full bg-brand-primary border border-brand-accent/50 rounded-md p-3 text-sm focus:ring-2 focus:ring-brand-accent focus:outline-none transition"
              />
              <div className="flex justify-end space-x-2">
                <button onClick={handleCancelEditSummary} className="px-4 py-2 text-sm rounded-md bg-brand-primary hover:bg-opacity-80 transition-colors">Abbrechen</button>
                <button onClick={handleSaveSummary} className="px-4 py-2 text-sm rounded-md bg-brand-accent text-white hover:bg-brand-accent-hover transition-colors">Speichern</button>
              </div>
            </div>
          ) : (
            <div>
                <div style={contentStyle} className="whitespace-pre-wrap leading-relaxed relative group">
                    {editableSummary.split('\n').map((paragraph, pIndex) => (
                        <p key={pIndex} className="mb-2">
                        {paragraph.split(/([.!?\s]+)/).filter(Boolean).map((part, partIndex) => {
                            const isCurrent = isPlaying && currentSentence.includes(part.trim()) && part.trim() !== '';
                            const highlightStyle = {
                                backgroundColor: hexToRgba(ciColors?.accent || '#4A7BFF', 0.5),
                                borderRadius: '3px'
                            };
                            return (
                                <span key={partIndex} style={isCurrent ? highlightStyle : {}} className="transition-colors duration-200">
                                    {part}
                                </span>
                            );
                        })}
                        </p>
                    ))}
                </div>
                <div className="flex items-center space-x-2 mt-4">
                    <button onClick={play} disabled={isPlaying && !isPaused} className="p-2 rounded-full bg-brand-primary hover:bg-brand-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        <IconPlay className="w-5 h-5" />
                    </button>
                    <button onClick={pause} disabled={!isPlaying || isPaused} className="p-2 rounded-full bg-brand-primary hover:bg-brand-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        <IconPause className="w-5 h-5" />
                    </button>
                    <button onClick={stop} disabled={!isPlaying} className="p-2 rounded-full bg-brand-primary hover:bg-brand-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        <IconStop className="w-5 h-5" />
                    </button>
                </div>
            </div>
          )}
        </div>

        {/* Sections (Accordions) */}
        <div>
          <h4 className="text-lg font-semibold text-brand-text mb-3">{labels.sections}</h4>
          <div className="space-y-2">
            {panel.sections.map((section, index) => (
              <div key={index} style={accordionBorderStyle} className="border rounded-lg overflow-hidden">
                <details className="dkip-accordion" open>
                    <summary onClick={(e) => { e.preventDefault(); toggleSection(index); }} className="dkip-accordion__summary w-full flex justify-between items-center text-left p-4 bg-brand-primary/30 hover:bg-brand-primary/60 transition-colors">
                      <span style={accordionTitleStyle} className="font-semibold text-brand-text">{section.title}</span>
                      <span className={`transform transition-transform duration-300 ${openSection === index ? 'rotate-180' : ''}`}>
                        &#9660;
                      </span>
                    </summary>
                    {openSection === index && (
                      <div style={contentStyle} className="p-4 bg-brand-primary/10">
                        <ul className="list-disc list-inside space-y-2 pl-4">
                          {section.bullets.map((bullet, bIndex) => <li key={bIndex}>{bullet}</li>)}
                        </ul>
                      </div>
                    )}
                </details>
              </div>
            ))}
          </div>
        </div>
        
        {/* FAQs */}
        {panel.faqs && panel.faqs.length > 0 && (
          <div>
            <h4 className="text-lg font-semibold text-brand-text mb-3">{labels.faq}</h4>
            <div className="space-y-4">
              {panel.faqs.map((faq, index) => (
                <div key={index} className="bg-brand-primary/30 p-4 rounded-lg">
                  <p style={accordionTitleStyle} className="font-semibold text-brand-text mb-1">{faq.q}</p>
                  <p style={contentStyle}>{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Keywords */}
        {panel.keywords && panel.keywords.length > 0 && (
            <details className="group">
                <summary className="list-none cursor-pointer flex justify-between items-center">
                    <h4 className="text-sm font-medium text-brand-text-secondary/80">{labels.keywords}</h4>
                    <div className="flex items-center">
                        <button 
                            onClick={copyKeywords}
                            className="p-2 rounded-full text-brand-text-secondary hover:bg-brand-primary hover:text-white transition-colors"
                            aria-label="Keywords kopieren"
                        >
                            <IconClipboardList className="w-5 h-5" />
                        </button>
                        <span className="text-brand-accent transform transition-transform duration-300 group-open:rotate-90 ml-2">
                            &#10148;
                        </span>
                    </div>
                </summary>
                <div className="flex flex-wrap gap-2 mt-3">
                    {panel.keywords.map((keyword, index) => (
                        <span key={index} style={keywordStyle} className="text-xs font-medium px-2.5 py-1 rounded-full">
                            {keyword}
                        </span>
                    ))}
                </div>
            </details>
        )}
      </div>
    </div>
  );
};

export default AccordionPanel;