import React from 'react';
import type { ValidationError, Warning } from '../types';
import { focusAndScrollTo } from '../services/domFocus';
import { toId } from '../services/fieldPath';
import { t } from '../i18n';

interface ErrorSummaryProps {
  errors: ValidationError[];
  warnings: Warning[];
  firstErrorId: string | null;
}

export const ErrorSummary: React.FC<ErrorSummaryProps> = ({ errors, warnings, firstErrorId }) => {
  if (errors.length === 0 && warnings.length === 0) {
    return null;
  }

  const handleJumpToFirst = () => {
    focusAndScrollTo(firstErrorId);
  };
  
  const handleJumpTo = (path: string) => {
    focusAndScrollTo(toId(path));
  };
  
  const getHeading = () => {
    if (errors.length > 0 && warnings.length > 0) {
      const key = `sum.headingWithWarnings.${errors.length === 1 ? 'oneError' : 'otherErrors'}.${warnings.length === 1 ? 'oneWarning' : 'otherWarnings'}`;
      return t(key, { errorCount: errors.length, warnCount: warnings.length });
    }
    if (errors.length > 0) {
      return t('sum.heading', { count: errors.length });
    }
    // This will only be reached if there are warnings but no errors.
    const key = `sum.headingWarningsOnly.${warnings.length === 1 ? 'one' : 'other'}`;
    return t(key, { count: warnings.length });
  };

  return (
    <div className={`p-4 mb-6 border rounded-lg ${errors.length > 0 ? 'bg-red-900/50 border-red-700 text-red-200' : 'bg-yellow-900/50 border-yellow-700 text-yellow-200'}`} role="alert" aria-live="polite">
      <h3 className="font-bold text-lg mb-2">
        {getHeading()}
      </h3>
      
      {errors.length > 0 && (
        <>
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
            {errors.map((error, index) => (
              <li key={`err-${error.path}-${index}`}>
                <button 
                  type="button"
                  onClick={() => handleJumpTo(error.path)}
                  className="text-left text-red-200 hover:text-white underline"
                >
                  {t(error.message, error.params)}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      
      {warnings.length > 0 && (
          <div className={errors.length > 0 ? 'mt-6 pt-4 border-t border-yellow-700/50' : ''}>
              <p className="text-sm mb-4">{t('sum.warningsIntro')}</p>
              <ul className="space-y-2 list-disc list-inside text-sm">
                {warnings.map((warning, index) => (
                  <li key={`warn-${warning.path}-${index}`}>
                    <button 
                      type="button"
                      onClick={() => handleJumpTo(warning.path)}
                      className="text-left text-yellow-200 hover:text-white underline"
                    >
                      {t(warning.messageKey, warning.params)}
                    </button>
                  </li>
                ))}
              </ul>
          </div>
      )}
    </div>
  );
};