import type { Job } from '../types';
import { FLAGS } from '../flags';

const STORAGE_KEY = 'dkip_active_job_v1';

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
