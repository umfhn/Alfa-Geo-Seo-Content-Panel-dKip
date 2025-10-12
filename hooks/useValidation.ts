import { useState, useEffect, useCallback, useMemo } from 'react';
// FIX: Import types and values correctly from their respective sources.
import { validateForm, type FormState } from '../services/validationService';
import type { ValidationError } from '../types';
import { toId } from '../services/fieldPath';

/**
 * A hook for live, debounced form validation.
 * @param formState The current state of the form to be validated.
 * @returns An object containing the list of errors, a map of errors by path, and a function to trigger immediate validation.
 */
export const useValidation = (formState: FormState) => {
  const [errors, setErrors] = useState<ValidationError[]>([]);

  // Memoize errors mapped by path for quick lookup in the component.
  const errorsByPath = useMemo(() => {
    return errors.reduce((acc, error) => {
      acc.set(error.path, error); // Store the full error object for i18n params
      return acc;
    }, new Map<string, ValidationError>());
  }, [errors]);

  const isValid = useMemo(() => errors.length === 0, [errors]);
  const errorCount = errors.length;
  const warnCount = 0; // Per ticket P0c, warnings are 0 for v0.3
  const firstErrorPath = useMemo(() => errors[0]?.path || null, [errors]);
  const firstErrorId = useMemo(() => firstErrorPath ? toId(firstErrorPath) : null, [firstErrorPath]);
  
  // Debounced validation effect for live feedback.
  useEffect(() => {
    const handler = setTimeout(() => {
      // Don't show errors on a completely pristine form to avoid premature error messages.
      const isDirty = formState.content || formState.geo.companyName || formState.geo.city || formState.geo.slug || formState.topics;
      if (isDirty) {
        setErrors(validateForm(formState));
      } else {
        setErrors([]);
      }
    }, 300); // Debounce time as specified in the ticket.

    return () => {
      clearTimeout(handler);
    };
  }, [formState]);

  // Function to trigger validation immediately, used for form submission.
  const validateNow = useCallback(() => {
    const currentErrors = validateForm(formState);
    setErrors(currentErrors);
    return currentErrors;
  }, [formState]);
  
  return { errors, errorsByPath, validateNow, isValid, errorCount, warnCount, firstErrorPath, firstErrorId };
};