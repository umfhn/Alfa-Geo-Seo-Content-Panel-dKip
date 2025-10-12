// hooks/useAutosave.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import { saveDraft, loadDraft, clearDraft } from '../services/persistence';
import type { FormDraftData, FormDraft } from '../types';

type DraftStatus = 'idle' | 'saving' | 'saved' | 'found' | 'incompatible' | 'too_large' | 'error';

const debounce = (fn: Function, ms = 800) => {
    let timeoutId: ReturnType<typeof setTimeout>;
    return function (this: any, ...args: any[]) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), ms);
    };
};

export const useAutosave = (formState: FormDraftData, slug: string) => {
    const [status, setStatus] = useState<DraftStatus>('idle');
    const [draft, setDraft] = useState<FormDraft | null>(null);

    const debouncedSave = useCallback(debounce((data: FormDraftData, currentSlug: string) => {
        setStatus('saving');
        const saveResult = saveDraft(currentSlug, data);
        if (saveResult.status === 'saved') {
            setStatus('saved');
        } else if (saveResult.status === 'too_large') {
            setStatus('too_large');
        } else {
            setStatus('error');
        }
    }), 800);

    useEffect(() => {
        // Only autosave if there's a slug to associate with
        if (slug) {
            debouncedSave(formState, slug);
        }
    }, [formState, slug, debouncedSave]);
    
    useEffect(() => {
        // On initial mount or when slug changes, check for an existing draft
        if (slug) {
            const { draft: loadedDraft, status: loadStatus } = loadDraft(slug);
            if (loadStatus === 'valid' || loadStatus === 'incompatible') {
                setDraft(loadedDraft);
                setStatus(loadStatus);
            } else {
                setDraft(null);
                setStatus('idle');
            }
        }
    }, [slug]);

    const restore = useCallback((): FormDraftData | null => {
        if (draft) {
            setStatus('idle');
            return draft.formData;
        }
        return null;
    }, [draft]);

    const discard = useCallback(() => {
        if (slug) {
            clearDraft(slug);
            setDraft(null);
            setStatus('idle');
        }
    }, [slug]);
    
    const lastSavedTime = useMemo(() => {
        if (status === 'saved' || status === 'found' || status === 'incompatible') {
            return new Date(draft?.timestamp || Date.now()).toLocaleTimeString();
        }
        return null;
    }, [status, draft]);

    return { status, restore, discard, lastSavedTime, draft };
};
