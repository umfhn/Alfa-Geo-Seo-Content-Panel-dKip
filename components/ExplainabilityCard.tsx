import React from 'react';
import type { PanelResult } from '../types';
import { IconShieldCheck, IconLock } from './Icons';

interface ExplainabilityCardProps {
  panelResult: PanelResult;
  onClose: () => void;
}

const CheckListItem: React.FC<{ label: string, passed: boolean, details?: string }> = ({ label, passed, details }) => (
    <li className={`flex items-start justify-between p-2 rounded-md ${passed ? 'bg-green-500/10 text-green-300' : 'bg-red-500/10 text-red-300'}`}>
        <div className="flex items-center space-x-3">
            <span className={`w-5 h-5 flex-shrink-0 font-bold text-sm rounded-full flex items-center justify-center ${passed ? 'bg-green-500/50' : 'bg-red-500/50'}`}>
                {passed ? '✓' : '✗'}
            </span>
            <span className="flex-1">{label}</span>
        </div>
        {details && (
             <span className="text-xs text-brand-text-secondary flex-shrink-0 ml-2 text-right">{details}</span>
        )}
    </li>
);

const QualityScoreBreakdown: React.FC<{ breakdown: PanelResult['linting_results']['quality_score_breakdown'] }> = ({ breakdown }) => {
    if (!breakdown || Object.keys(breakdown).length === 0) return null;

    const labels: { [key: string]: string } = {
        completeness: 'Vollständigkeit',
        variance: 'Einzigartigkeit',
        geo_integration: 'GEO-Bezug',
        readability: 'Lesbarkeit',
        keywords: 'Keywords',
    };

    return (
        <div className="space-y-2">
            {Object.entries(breakdown).map(([key, value]) => {
                // The value of an optional property can be undefined.
                if (!value) {
                    return null;
                }

                // FIX: The value from Object.entries can be inferred as 'unknown' or a wide union.
                // We cast it to its known type to access its properties safely.
                const breakdownValue = value as { score: number; weight: number };

                return (
                    <div key={key} className="text-sm">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-brand-text-secondary">{labels[key] || key}</span>
                            <span className="font-semibold">{breakdownValue.score}/100</span>
                        </div>
                        <div className="w-full bg-brand-primary rounded-full h-2">
                            <div
                                className="bg-brand-accent h-2 rounded-full"
                                style={{ width: `${breakdownValue.score}%` }}
                                title={`Gewichtung: ${breakdownValue.weight * 100}%`}
                            ></div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export const ExplainabilityCard: React.FC<ExplainabilityCardProps> = ({ panelResult, onClose }) => {
    const { explainability, linting_results, index, panel, segment_locks } = panelResult;

    if (!explainability || !linting_results) return null;

    const varianceDetails = linting_results.similarity_score > 0 
        ? `(Ähnlichkeit: ${(linting_results.similarity_score * 100).toFixed(1)}%)`
        : '';
    
    const allErrors = linting_results.issues.filter(i => i.severity === 'ERROR');
    const allWarnings = linting_results.issues.filter(i => i.severity === 'WARN');
    
    const hasLowVariance = !!allErrors.find(e => e.code === 'LOW_VARIANCE');
    const hasPlaceholder = !!allErrors.find(e => e.code === 'PLACEHOLDER_LEAK');
    const hasLowKeywords = !!allWarnings.find(w => w.code === 'LOW_KEYWORD_COUNT');
    const hasNoGeo = !!allWarnings.find(w => w.code === 'TITLE_NO_GEO');

    return (
        <div 
            className="fixed inset-0 bg-brand-primary/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" 
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-brand-secondary rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-brand-accent/30" 
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 border-b border-brand-accent/20">
                    <div className="flex items-center space-x-3">
                        <IconShieldCheck className="w-6 h-6 text-brand-accent" />
                        <h2 className="text-xl font-bold">Qualitäts-Pipeline: Panel {index + 1}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-brand-primary text-2xl" aria-label="Schließen">&times;</button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6">
                    <div>
                        <h3 className="font-semibold text-brand-text mb-2">Panel-Titel</h3>
                        <p className="bg-brand-primary p-3 rounded-md text-brand-text-secondary">{panel?.title || 'N/A'}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column */}
                        <div className="space-y-6">
                             <div>
                                <h3 className="font-semibold text-brand-text mb-3">Gesamt-Qualitätsscore</h3>
                                <div className="flex items-center space-x-4">
                                    <div className="w-24 h-24 rounded-full flex items-center justify-center bg-brand-primary border-4 border-brand-accent">
                                        <span className="text-4xl font-bold">{panelResult.quality_score || 0}</span>
                                    </div>
                                    <div className="flex-1">
                                       <QualityScoreBreakdown breakdown={linting_results.quality_score_breakdown} />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h3 className="font-semibold text-brand-text mb-2">Linter-Checkliste</h3>
                                <ul className="space-y-2 text-sm">
                                   <CheckListItem label="Inhaltliche Einzigartigkeit" passed={!hasLowVariance} details={varianceDetails} />
                                   <CheckListItem label="Titel enthält GEO-Bezug" passed={!hasNoGeo} />
                                   <CheckListItem label="Keine offenen Platzhalter" passed={!hasPlaceholder} />
                                   <CheckListItem label="Keyword-Anzahl (≥ 5)" passed={!hasLowKeywords} />
                                </ul>
                            </div>
                            {segment_locks && (
                                <div>
                                    <h3 className="font-semibold text-brand-text mb-2">Status der Segmentsperren</h3>
                                    <div className="flex flex-wrap gap-2 text-xs">
                                        {Object.entries(segment_locks).map(([key, locked]) => (
                                            <span key={key} className={`flex items-center space-x-1 px-2.5 py-1 rounded-full ${locked ? 'bg-blue-500/20 text-blue-300' : 'bg-gray-500/20 text-gray-400'}`}>
                                                {locked && <IconLock className="w-3 h-3"/>}
                                                <span className="capitalize">{key}</span>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Column */}
                        <div className="space-y-6">
                             <div>
                                <h3 className="font-semibold text-brand-text mb-2">Datenbasis & Metriken</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="bg-brand-primary p-2 rounded-md flex justify-between">
                                        <span className="text-xs text-brand-text-secondary/70">Quelle</span>
                                        <span className="font-semibold">{explainability.source_info}</span>
                                    </div>
                                    <div className="bg-brand-primary p-2 rounded-md flex justify-between">
                                        <span className="text-xs text-brand-text-secondary/70">Dauer</span>
                                        <span className="font-semibold">{explainability.duration_ms} ms</span>
                                    </div>
                                    <div className="bg-brand-primary p-2 rounded-md">
                                        <p className="text-xs text-brand-text-secondary/70 mb-1">Payload Hash</p>
                                        <p className="font-mono text-xs break-all">{explainability.payload_hash}</p>
                                    </div>
                                </div>
                            </div>
                            
                            {allErrors.length > 0 && (
                                 <div>
                                    <h3 className="font-semibold text-red-400 mb-2">Fehler (Export blockiert)</h3>
                                    <div className="bg-red-900/50 border border-red-700 text-red-200 p-3 rounded-lg text-sm space-y-1">
                                        {allErrors.map((error, i) => <p key={`err-${i}`}>- {error.message}</p>)}
                                    </div>
                                </div>
                            )}
                            {allWarnings.length > 0 && (
                                 <div>
                                    <h3 className="font-semibold text-yellow-400 mb-2">Warnungen</h3>
                                    <div className="bg-yellow-900/50 border border-yellow-700 text-yellow-200 p-3 rounded-lg text-sm space-y-1">
                                        {allWarnings.map((warn, i) => <p key={`warn-${i}`}>- {warn.message}</p>)}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                 <div className="p-4 border-t border-brand-accent/20 text-right">
                    <button 
                        onClick={onClose} 
                        className="px-6 py-2 bg-brand-accent text-white font-bold rounded-lg hover:bg-brand-accent-hover transition-colors"
                    >
                        Schließen
                    </button>
                </div>
            </div>
        </div>
    );
};
