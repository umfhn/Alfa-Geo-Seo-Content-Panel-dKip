import React from 'react';
// FIX: Import ValidationError from its source in types.ts
import type { ValidationError } from '../types';
import { focusAndScrollTo } from '../services/domFocus';
import { toId } from '../services/fieldPath';
import { t } from '../i18n';

interface ErrorSummaryProps {
  errors: ValidationError[];
  firstErrorId: string | null;
}

export const ErrorSummary: React.FC<ErrorSummaryProps> = ({ errors, firstErrorId }) => {
  if (errors.length === 0) {
    return null;
  }

  const handleJumpToFirst = () => {
    focusAndScrollTo(firstErrorId);
  };
  
  const handleJumpToError = (path: string) => {
    focusAndScrollTo(toId(path));
  };

  return (
    <div className="p-4 mb-6 bg-red-900/50 border border-red-700 text-red-200 rounded-lg" role="alert" aria-live="polite">
      <h3 className="font-bold text-lg mb-2">
        {t('sum.heading', { count: errors.length })}
      </h3>
      <p className="text-sm mb-4">{t('sum.pleaseCorrect')}</p>
      
      {firstErrorId && (
        <button 
          type="button" 
          onClick={handleJumpToFirst}
          className="w-full sm:w-auto inline-block mb-4 px-4 py-2 bg-brand-accent text-white font-semibold text-sm rounded-md hover:bg-brand-accent-hover transition-colors"
        >
          {t('sum.firstBtn')}
        </button>
      )}

      <ul className="space-y-2 list-disc list-inside text-sm">
        {errors.slice(0, 8).map((error, index) => (
          <li key={`${error.path}-${index}`}>
            <button 
              type="button"
              onClick={() => handleJumpToError(error.path)}
              className="text-left text-red-200 hover:text-white underline"
            >
              {t(error.message, error.params)}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};