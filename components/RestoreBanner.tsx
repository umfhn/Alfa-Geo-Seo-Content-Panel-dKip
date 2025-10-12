// components/RestoreBanner.tsx
import React from 'react';
import { t } from '../i18n';
import { IconSave, IconTrash, IconAlertTriangle } from './Icons';

type DraftStatus = 'idle' | 'saving' | 'saved' | 'found' | 'incompatible' | 'too_large' | 'error';

interface RestoreBannerProps {
  status: DraftStatus;
  lastSavedTime: string | null;
  onRestore: () => void;
  onDiscard: () => void;
  onRestoreIncompatible: () => void;
}

export const RestoreBanner: React.FC<RestoreBannerProps> = ({ status, lastSavedTime, onRestore, onDiscard, onRestoreIncompatible }) => {

  const getBannerContent = () => {
    switch (status) {
      case 'found':
        return (
          <div className="bg-blue-900/50 border-blue-700 text-blue-200">
            <div className="flex items-center space-x-2">
                <IconSave className="w-5 h-5" />
                <strong className="font-bold">{t('autosave.found')}</strong>
            </div>
            <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                <button onClick={onRestore} className="px-3 py-1 text-sm rounded-md bg-brand-accent text-white hover:bg-brand-accent-hover transition-colors">{t('autosave.restore')}</button>
                <button onClick={onDiscard} className="px-3 py-1 text-sm rounded-md bg-brand-secondary hover:bg-opacity-80 transition-colors">{t('autosave.discard')}</button>
            </div>
          </div>
        );
      case 'incompatible':
        return (
          <div className="bg-yellow-900/50 border-yellow-700 text-yellow-200">
            <div className="flex items-center space-x-2">
                <IconAlertTriangle className="w-5 h-5" />
                <strong className="font-bold">{t('autosave.incompatible')}</strong>
            </div>
            <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                <button onClick={onRestoreIncompatible} className="px-3 py-1 text-sm rounded-md bg-yellow-600 text-white hover:bg-yellow-700 transition-colors">{t('autosave.incompatible.restoreAnyway')}</button>
                <button onClick={onDiscard} className="px-3 py-1 text-sm rounded-md bg-brand-secondary hover:bg-opacity-80 transition-colors">{t('autosave.discard')}</button>
            </div>
          </div>
        );
      case 'too_large':
         return (
          <div className="bg-red-900/50 border-red-700 text-red-200 justify-center">
            <div className="flex items-center space-x-2">
                <IconAlertTriangle className="w-5 h-5" />
                <p>{t('autosave.tooLarge')}</p>
            </div>
          </div>
        );
       case 'saved':
        return (
          <div className="bg-green-900/50 border-green-700 text-green-200 justify-end">
            <p className="text-sm">{t('autosave.savedAt', { time: lastSavedTime || '' })}</p>
          </div>
        );
      default:
        return null;
    }
  };

  const content = getBannerContent();
  if (!content) return null;
  
  // Base classes are applied to the child div from getBannerContent
  return (
    <div className="p-3 mb-6 border rounded-lg text-sm flex flex-col sm:flex-row justify-between items-center gap-2">
        {content}
    </div>
  );
};
