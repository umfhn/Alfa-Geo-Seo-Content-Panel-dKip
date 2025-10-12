import type { Job, FormDraft, FormDraftData } from '../types';
import { FLAGS } from '../flags';
import { APP_VERSION, SCHEMA_VERSION } from './config';

const STORAGE_KEY = 'dkip_active_job_v1';
const DRAFT_PREFIX = 'dkip_draft_v1';
const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_DRAFT_SIZE_BYTES = 1 * 1024 * 1024; // 1 MB

/**
 * Saves the active job to sessionStorage if the feature flag is enabled.
 * The entire job object is serialized to preserve its complete state.
 * @param job The job object to save.
 */
export function saveActiveJob(job: Job | null) {
  if (!FLAGS.PERSISTENCE_MVP || !job) {
    return;
  }
  try {
    const jobStateJson = JSON.stringify(job);
    sessionStorage.setItem(STORAGE_KEY, jobStateJson);
  } catch (error) {
    console.warn('Failed to save job to sessionStorage:', error);
  }
}

/**
 * Loads the active job from sessionStorage if the feature flag is enabled.
 * @returns The parsed job object or null if not found or on error.
 */
export function loadActiveJob(): Job | null {
  if (!FLAGS.PERSISTENCE_MVP) {
    return null;
  }
  try {
    const rawJobState = sessionStorage.getItem(STORAGE_KEY);
    return rawJobState ? JSON.parse(rawJobState) : null;
  } catch (error) {
    console.warn('Failed to load job from sessionStorage:', error);
    // Clear potentially corrupted data
    sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

/**
 * Clears the active job from sessionStorage if the feature flag is enabled.
 */
export function clearActiveJob() {
  if (!FLAGS.PERSISTENCE_MVP) {
    return;
  }
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear job from sessionStorage:', error);
  }
}

// --- Draft Persistence ---

const getDraftKey = (slug: string): string => `${DRAFT_PREFIX}:${slug}`;

/**
 * Saves a form draft to localStorage.
 * @param slug The page slug to associate the draft with.
 * @param formData The form data to save.
 * @returns Status of the save operation.
 */
export const saveDraft = (slug: string, formData: FormDraftData): { status: 'saved' | 'too_large' | 'error' } => {
  if (!slug) return { status: 'error' };
  try {
    const draft: FormDraft = {
      formData,
      timestamp: Date.now(),
      appVersion: APP_VERSION,
      schemaVersion: SCHEMA_VERSION,
    };
    const jsonString = JSON.stringify(draft);
    if (jsonString.length > MAX_DRAFT_SIZE_BYTES) {
      console.warn('Draft size exceeds 1MB limit. Not saving.');
      return { status: 'too_large' };
    }
    localStorage.setItem(getDraftKey(slug), jsonString);
    return { status: 'saved' };
  } catch (error) {
    console.warn('Failed to save draft to localStorage:', error);
    return { status: 'error' };
  }
};

/**
 * Loads a form draft from localStorage.
 * @param slug The page slug of the draft to load.
 * @returns An object with the draft and its status.
 */
export const loadDraft = (slug: string): { draft: FormDraft | null, status: 'valid' | 'incompatible' | 'expired' | 'not_found' | 'error' } => {
  if (!slug) return { draft: null, status: 'not_found' };
  try {
    const rawDraft = localStorage.getItem(getDraftKey(slug));
    if (!rawDraft) {
      return { draft: null, status: 'not_found' };
    }
    const draft: FormDraft = JSON.parse(rawDraft);
    if (Date.now() - draft.timestamp > DRAFT_TTL_MS) {
      clearDraft(slug); // Clean up expired draft
      return { draft: null, status: 'expired' };
    }
    if (draft.appVersion !== APP_VERSION || draft.schemaVersion !== SCHEMA_VERSION) {
      return { draft, status: 'incompatible' };
    }
    return { draft, status: 'valid' };
  } catch (error) {
    console.warn('Failed to load draft from localStorage:', error);
    return { draft: null, status: 'error' };
  }
};

/**
 * Clears a form draft from localStorage.
 * @param slug The page slug of the draft to clear.
 */
export const clearDraft = (slug: string): void => {
  if (!slug) return;
  try {
    localStorage.removeItem(getDraftKey(slug));
  } catch (error) {
    console.warn('Failed to clear draft from localStorage:', error);
  }
};
