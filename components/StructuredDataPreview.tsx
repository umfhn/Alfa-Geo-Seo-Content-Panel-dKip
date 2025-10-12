// components/StructuredDataPreview.tsx
import React, { useState, useEffect } from 'react';
import { IconCopy, IconDownload, IconJson } from './Icons';
import { StructuredDataInjector } from './StructuredDataInjector';
import { t } from '../i18n';

interface StructuredDataPreviewProps {
  faqJson: string | null;
  howToJson: string | null;
}

type ActiveTab = 'faq' | 'howto';
const SIZE_WARNING_THRESHOLD = 100_000; // 100 KB

export const StructuredDataPreview: React.FC<StructuredDataPreviewProps> = ({ faqJson, howToJson }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('faq');
  const [toast, setToast] = useState<string | null>(null);
  const [embedInPage, setEmbedInPage] = useState(false);

  useEffect(() => {
    // Set initial active tab to the first available one
    if (faqJson) {
      setActiveTab('faq');
    } else if (howToJson) {
      setActiveTab('howto');
    }
  }, [faqJson, howToJson]);
  
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  if (!faqJson && !howToJson) {
    return null;
  }

  const handleCopy = (content: string | null) => {
    if (!content) return;
    navigator.clipboard.writeText(content).then(() => {
      setToast(t('jsonld.copy.success'));
    }).catch(() => {
      setToast(t('jsonld.copy.error'));
    });
  };

  const handleDownload = (content: string | null, filename: string) => {
    if (!content) return;
    const blob = new Blob([content], { type: 'application/ld+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const faqSize = faqJson?.length || 0;
  const howToSize = howToJson?.length || 0;

  const renderContent = (content: string | null, type: 'faq' | 'howto', size: number) => {
    if (!content) return null;
    return (
      <div>
        <div className="flex justify-end items-center space-x-2 mb-2">
          <button onClick={() => handleCopy(content)} title={t('jsonld.copy')} className="p-2 rounded-full text-brand-text-secondary hover:bg-brand-primary transition-colors"><IconCopy className="w-5 h-5"/></button>
          <button onClick={() => handleDownload(content, `${type}.json`)} title={t('jsonld.download')} className="p-2 rounded-full text-brand-text-secondary hover:bg-brand-primary transition-colors"><IconDownload className="w-5 h-5"/></button>
        </div>
        {size > SIZE_WARNING_THRESHOLD && (
             <div className="p-2 mb-2 rounded-md bg-yellow-900/50 border border-yellow-700 text-yellow-200 text-xs">
                 {t('jsonld.tooLarge', { type })}
            </div>
        )}
        <pre className="bg-brand-primary p-4 rounded-lg text-xs text-brand-text-secondary overflow-x-auto max-h-96"><code>{content}</code></pre>
      </div>
    );
  };

  return (
    <>
      {embedInPage && <StructuredDataInjector faqJson={faqJson} howToJson={howToJson} />}
      <div className="bg-brand-primary/50 p-4 rounded-lg mt-6">
        <h4 className="font-semibold text-brand-text mb-4 flex items-center space-x-2">
            <IconJson className="w-5 h-5 text-brand-accent"/>
            <span>{t('jsonld.preview.title')}</span>
        </h4>
        
        <div className="flex items-center justify-between bg-brand-primary p-3 rounded-md mb-4">
            <div>
                <span className="text-sm font-medium">{t('jsonld.embed.toggle')}</span>
                <p className="text-xs text-brand-text-secondary/70">{t('jsonld.embed.description')}</p>
            </div>
            <label htmlFor="toggle-embed-jsonld" className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input type="checkbox" id="toggle-embed-jsonld" className="sr-only peer" checked={embedInPage} onChange={() => setEmbedInPage(prev => !prev)} />
                <div className="w-11 h-6 bg-brand-secondary peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-accent rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-accent"></div>
            </label>
        </div>

        <div className="flex space-x-1 border-b border-brand-accent/20 mb-4">
          {faqJson && (
            <button onClick={() => setActiveTab('faq')} className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${activeTab === 'faq' ? 'bg-brand-primary text-brand-text' : 'text-brand-text-secondary hover:bg-brand-primary/50'}`}>
              FAQPage
            </button>
          )}
          {howToJson && (
            <button onClick={() => setActiveTab('howto')} className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${activeTab === 'howto' ? 'bg-brand-primary text-brand-text' : 'text-brand-text-secondary hover:bg-brand-primary/50'}`}>
              HowTo
            </button>
          )}
        </div>

        <div>
          {activeTab === 'faq' && renderContent(faqJson, 'faq', faqSize)}
          {activeTab === 'howto' && renderContent(howToJson, 'howto', howToSize)}
        </div>

        {toast && (
          <div className="fixed bottom-5 right-5 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in-out">
            {toast}
          </div>
        )}
      </div>
    </>
  );
};
