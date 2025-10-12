// hooks/useValidation.ts
import { useState, useEffect, useMemo, useCallback } from 'react';
import type { ValidationError, Warning } from '../types';
import { validateForm, lintForm, FormState } from '../services/validationService';
import { toId } from '../services/fieldPath';

const buildErrorMap = (errors: ValidationError[]): Map<string, ValidationError> => {
    return new Map(errors.map(err => [err.path, err]));
};

export const useValidation = (formState: FormState) => {
    const [errors, setErrors] = useState<ValidationError[]>([]);
    const [warnings, setWarnings] = useState<Warning[]>([]);

    // Memoize the validation results to avoid re-calculating on every render
    const validationResult = useMemo(() => {
        const currentErrors = validateForm(formState);
        const currentWarnings = lintForm(formState);
        return { errors: currentErrors, warnings: currentWarnings };
    }, [formState]);

    useEffect(() => {
        setErrors(validationResult.errors);
        setWarnings(validationResult.warnings);
    }, [validationResult]);
    
    const errorsByPath = useMemo(() => buildErrorMap(errors), [errors]);
    
    const firstErrorId = useMemo(() => {
        return errors.length > 0 ? toId(errors[0].path) : null;
    }, [errors]);

    const isValid = errors.length === 0;
    const errorCount = errors.length;
    const warnCount = warnings.length;

    /**
     * A function to manually trigger validation and update state.
     * Useful for running validation on form submission.
     * @returns The list of errors found.
     */
    const validateNow = useCallback(() => {
        const currentErrors = validateForm(formState);
        setErrors(currentErrors);
        return currentErrors;
    }, [formState]);
    
    return {
        errors,
        warnings,
        errorsByPath,
        isValid,
        errorCount,
        warnCount,
        firstErrorId,
        validateNow,
    };
};
