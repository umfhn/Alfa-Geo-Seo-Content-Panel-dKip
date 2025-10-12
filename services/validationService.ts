import type { Geo, ValidationError } from '../types';
import { PanelCount } from '../types';

// This interface defines the shape of the form state for validation purposes.
export interface FormState {
  content: string;
  geo: Geo;
  topics: string; // The raw textarea content
  panelCount: PanelCount;
}

const slugRegex = /^[a-z0-9-]+$/;

/**
 * Validates the state of the input form.
 * @param formState The current state of the form.
 * @returns An array of validation errors with i18n keys.
 */
export const validateForm = (formState: FormState): ValidationError[] => {
  const errors: ValidationError[] = [];
  const { content, geo, topics, panelCount } = formState;

  // 1. Content validation
  if (!content.trim()) {
    errors.push({ path: 'content', message: 'val.contentRequired' });
  }

  // 2. GEO validation
  if (!geo.companyName.trim()) {
    errors.push({ path: 'geo.companyName', message: 'val.required', params: { field: 'Firma / Unternehmensname' } });
  } else if (geo.companyName.trim().length < 3 || geo.companyName.trim().length > 120) {
    errors.push({ path: 'geo.companyName', message: 'val.companyNameLength' });
  }

  if (!geo.city.trim()) {
    errors.push({ path: 'geo.city', message: 'val.required', params: { field: 'Stadt' } });
  }
  
  if (!geo.slug || !geo.slug.trim()) {
    errors.push({ path: 'geo.slug', message: 'val.required', params: { field: 'SEO-Slug' } });
  } else if (!slugRegex.test(geo.slug.trim())) {
    errors.push({ path: 'geo.slug', message: 'val.slugInvalid' });
  }

  // 3. Topics validation
  const topicList = topics.trim() ? topics.trim().split('\n').filter(Boolean) : [];
  const maxTopics = parseInt(panelCount, 10);
  if (topicList.length > maxTopics) {
    errors.push({ path: 'topics', message: 'val.topicsMax', params: { count: maxTopics } });
  }
  
  return errors;
};