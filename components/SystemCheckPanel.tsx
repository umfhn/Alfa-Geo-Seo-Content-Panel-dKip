import React, { useState, useCallback } from 'react';
import { runHealthCheck } from '../services/jobService';
import type { HealthReport, HealthStatus, HealthCheckResult, RunHistory, SystemInfo } from '../types';
import { IconShieldCheck, IconCopy, IconJson, IconBeaker } from './Icons';

const getInitialReport = (): HealthReport => ({
  timestamp: new Date().toISOString(),
  status: 'neutral',
  summary: 'Noch keine Tests ausgeführt. Klicken Sie auf einen Button, um den System-Check zu starten.',
  checks: {
    backend: { ok: false, status: 'neutral', message: 'Nicht getestet' },
    mini_prompt: { ok: false, status: 'neutral', message: 'Nicht getestet' },
    placeholders: { ok: false, status: 'neutral', message: 'Nicht getestet' },
    keywords: { ok: false, status: 'neutral', message: 'Nicht getestet' },
    rate_limit: { ok: false, status: 'neutral', message: 'Nicht getestet' },
    runs: [],
    system: { app_version: "?.?.?", build_hash: "????????", env: "development", feature_flags: [] }
  }
});

const StatusIndicator: React.FC<{ status: HealthStatus }> = ({ status }) => {
    const statusConfig = {
        green: { text: 'OK', color: 'bg-green-500/20 text-green-300' },
        yellow: { text: 'Warnung', color: 'bg-yellow-500/20 text-yellow-300' },
        red: { text: 'Fehler', color: 'bg-red-500/20 text-red-300' },
        neutral: { text: 'N/A', color: 'bg-gray-500/20 text-gray-400' },
    };
    const { text, color } = statusConfig[status] || statusConfig.neutral;
    return <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${color}`}>{text}</span>;
};

const SourceBadge: React.FC<{ source?: 'live' | 'mock' }> = ({ source }) => {
    if (!source) return null;
    const config = source === 'mock'
      ? { text: 'Simuliert', color: 'bg-yellow-500/20 text-yellow-300' }
      : { text: 'Live', color: 'bg-green-500/20 text-green-300' };
    return <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${config.color}`}>{config.text}</span>;
};

const CheckRow: React.FC<{ label: string; result: HealthCheckResult }> = ({ label, result }) => (
    <div className="flex justify-between items-center py-2 border-b border-brand-primary/50">
        <span className="text-brand-text-secondary">{label}</span>
        <div className="flex items-center space-x-2">
            <SourceBadge source={result.source} />
            {result.latency_ms && <span className="text-sm">{result.latency_ms} ms</span>}
            <StatusIndicator status={result.status} />
        </div>
    </div>
);

export const SystemCheckPanel: React.FC = () => {
    const [report, setReport] = useState<HealthReport>(getInitialReport());
    const [isLoading, setIsLoading] = useState<'connection' | 'dry-run' | null>(null);
    const [toast, setToast] = useState<string | null>(null);

    const handleRunCheck = useCallback(async (type: 'connection' | 'dry-run') => {
        setIsLoading(type);
        setToast(null);
        try {
            const result = await runHealthCheck(type);
            setReport(result);
            setToast(`Test '${type === 'connection' ? 'Verbindung' : 'KI-Verbindung'}' wurde erfolgreich abgeschlossen.`);
        } catch (error) {
            console.error(`Health check failed for type: ${type}`, error);
            const newReport = getInitialReport();
            newReport.status = 'red';
            newReport.summary = `Der Test ist mit einem unerwarteten Fehler fehlgeschlagen.`;
            setReport(newReport);
            setToast('Test fehlgeschlagen. Details in der Konsole.');
        } finally {
            setIsLoading(null);
            setTimeout(() => setToast(null), 3000);
        }
    }, []);

    const copyToClipboard = (text: string, message: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setToast(message);
        }).catch(() => {
            setToast('Kopieren fehlgeschlagen.');
        });
        setTimeout(() => setToast(null), 3000);
    };

    const statusConfig = {
        green: { text: 'Alle Systeme OK', color: 'bg-green-500 border-green-400' },
        yellow: { text: 'Warnungen vorhanden', color: 'bg-yellow-500 border-yellow-400' },
        red: { text: 'Kritischer Fehler', color: 'bg-red-500 border-red-400' },
        neutral: { text: 'System-Check', color: 'bg-gray-500 border-gray-400' },
    };
    const currentStatus = statusConfig[report.status];

    return (
        <div className="max-w-4xl mx-auto bg-brand-secondary rounded-2xl shadow-2xl overflow-hidden">
            <div className={`p-4 flex justify-between items-center border-b-4 ${currentStatus.color}`}>
                <div className="flex items-center space-x-3">
                    <IconShieldCheck className="w-8 h-8"/>
                    <div>
                        <h2 className="text-xl font-bold">{currentStatus.text}</h2>
                        <p className="text-sm text-brand-text-secondary">{report.summary}</p>
                    </div>
                </div>
                 <div className="flex items-center space-x-2">
                    <button 
                        onClick={() => copyToClipboard(report.summary, 'Kurzfazit kopiert!')}
                        className="p-2 rounded-full text-brand-text-secondary hover:bg-brand-primary transition-colors"
                        title="Kurzfazit kopieren"
                    >
                        <IconCopy className="w-5 h-5"/>
                    </button>
                    <button 
                        onClick={() => copyToClipboard(JSON.stringify(report, null, 2), 'JSON-Report kopiert!')}
                        className="p-2 rounded-full text-brand-text-secondary hover:bg-brand-primary transition-colors"
                        title="JSON-Report kopieren"
                    >
                        <IconJson className="w-5 h-5"/>
                    </button>
                </div>
            </div>

            <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                        onClick={() => handleRunCheck('connection')}
                        disabled={!!isLoading}
                        className="w-full px-4 py-3 bg-brand-accent/80 text-white font-bold rounded-lg hover:bg-brand-accent transition-colors disabled:bg-gray-600 disabled:cursor-wait flex items-center justify-center space-x-2"
                    >
                        {isLoading === 'connection' && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                        <IconBeaker className="w-5 h-5"/>
                        <span>KI-Verbindung testen</span>
                    </button>
                     <button
                        onClick={() => handleRunCheck('dry-run')}
                        disabled={!!isLoading}
                        className="w-full px-4 py-3 bg-brand-accent/80 text-white font-bold rounded-lg hover:bg-brand-accent transition-colors disabled:bg-gray-600 disabled:cursor-wait flex items-center justify-center space-x-2"
                    >
                        {isLoading === 'dry-run' && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                        <span>Trocken-Generierung (Mock)</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <details open className="space-y-2">
                        <summary className="font-semibold text-lg cursor-pointer list-none">KI-Pfad & Latenz</summary>
                        <CheckRow label="KI-Backend Ping" result={report.checks.backend} />
                        <CheckRow label="Test-Prompt Roundtrip" result={report.checks.mini_prompt} />
                        <CheckRow label="Rate Limit" result={report.checks.rate_limit} />
                    </details>
                    
                     <details open className="space-y-2">
                        <summary className="font-semibold text-lg cursor-pointer list-none">Daten-Integrität</summary>
                        <CheckRow label="Platzhalter-Auflösung" result={report.checks.placeholders} />
                        {report.checks.placeholders.unresolved?.length && (
                            <div className="text-xs text-red-300 bg-red-500/10 p-2 rounded-md">Unaufgelöst: {report.checks.placeholders.unresolved.join(', ')}</div>
                        )}
                        <CheckRow label="Keyword-Deduplizierung" result={report.checks.keywords} />
                        {report.checks.keywords.duplicates?.length && (
                             <div className="text-xs text-yellow-300 bg-yellow-500/10 p-2 rounded-md">Duplikate: {report.checks.keywords.duplicates.join(', ')}</div>
                        )}
                    </details>
                </div>

                <details open>
                     <summary className="font-semibold text-lg cursor-pointer list-none">Letzte Läufe & IDs</summary>
                     <div className="mt-2 space-y-2 text-sm">
                        {report.checks.runs.length > 0 ? report.checks.runs.map(run => (
                            <div key={run.id} className="bg-brand-primary p-2 rounded-md flex justify-between items-center flex-wrap gap-2">
                                <span className="font-mono text-xs">{run.id}</span>
                                <div className="flex items-center space-x-3 text-xs text-brand-text-secondary">
                                    <span>{run.panels} Panels</span>
                                    <span>{run.tone}</span>
                                    <span>{run.detail}</span>
                                    <span>{new Date(run.timestamp).toLocaleTimeString()}</span>
                                </div>
                            </div>
                        )) : <p className="text-brand-text-secondary text-sm">Noch keine Läufe in dieser Sitzung gestartet.</p>}
                     </div>
                </details>

                 <details open>
                     <summary className="font-semibold text-lg cursor-pointer list-none">System-Information</summary>
                      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm border-b border-brand-primary/50 pb-3 mb-3">
                        <div className="text-brand-text-secondary">
                            <span>Build: </span>
                            <code className="text-brand-text font-mono bg-brand-primary px-1.5 py-0.5 rounded">{report.checks.system.build_hash}</code>
                        </div>
                        {report.checks.system.lastRunId && (
                            <div className="text-brand-text-secondary">
                                <span>Letzte Run-ID: </span>
                                <code className="text-brand-text font-mono bg-brand-primary px-1.5 py-0.5 rounded">{report.checks.system.lastRunId}</code>
                            </div>
                        )}
                    </div>
                     <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-center text-sm">
                        <div className="bg-brand-primary p-2 rounded-md">
                            <div className="text-xs text-brand-text-secondary">App-Version</div>
                            <div className="font-bold">{report.checks.system.app_version}</div>
                        </div>
                        <div className="bg-brand-primary p-2 rounded-md">
                             <div className="text-xs text-brand-text-secondary">Umgebung</div>
                            <div className="font-bold capitalize">{report.checks.system.env}</div>
                        </div>
                         <div className="bg-brand-primary p-2 rounded-md">
                             <div className="text-xs text-brand-text-secondary">Feature Flags</div>
                            <div className="text-xs truncate">{report.checks.system.feature_flags.join(', ')}</div>
                        </div>
                     </div>
                </details>

            </div>
             {toast && (
                <div className="fixed bottom-5 right-5 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50">
                    {toast}
                </div>
            )}
        </div>
    );
};