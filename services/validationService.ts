// services/validationService.ts
import type { Geo, PanelCount, ValidationError, Warning, Job } from '../types';
import { InputType } from '../types';
import { lintGeoText } from './textLint';

export interface FormState {
    inputType: InputType;
    content: string;
    geo: Geo;
    topics: string;
    panelCount: PanelCount;
}

const MIN_CONTENT_LENGTH = 150;

/**
 * Validates the core form fields.
 * This function is for blocking errors.
 * @param state The current form state.
 * @returns An array of validation errors.
 */
export const validateForm = (state: FormState): ValidationError[] => {
    const errors: ValidationError[] = [];

    // Rule 1: Content validation depends on the input type
    if (state.inputType === InputType.TEXT) {
        if (!state.content || state.content.trim().length < MIN_CONTENT_LENGTH) {
            errors.push({
                path: 'content',
                message: 'val.content.minLength',
                params: { min: MIN_CONTENT_LENGTH },
            });
        }
    } else { // Handles URL and JSON
        if (!state.content || state.content.trim().length === 0) {
            errors.push({
                path: 'content',
                message: 'val.required',
            });
        }
    }


    // Rule 2: Essential GEO fields must be filled
    if (!state.geo.companyName.trim()) {
        errors.push({ path: 'geo.companyName', message: 'val.required' });
    }
    if (!state.geo.city.trim()) {
        errors.push({ path: 'geo.city', message: 'val.required' });
    }
    if (!state.geo.slug.trim()) {
        errors.push({ path: 'geo.slug', message: 'val.required' });
    }

    // Rule 3: Topics must not exceed panel count
    const topicCount = state.topics.trim().split('\n').filter(Boolean).length;
    const maxTopics = parseInt(state.panelCount, 10);
    if (topicCount > maxTopics) {
        errors.push({
            path: 'topics',
            message: 'val.topics.tooMany',
            params: { count: topicCount, max: maxTopics },
        });
    }

    // Rule 4: Validate text structure lengths if they are filled
    const { topAnswer, keyFacts = [] } = state.geo;
    if (topAnswer && (topAnswer.length < 280 || topAnswer.length > 500)) {
        errors.push({ path: 'geo.topAnswer', message: 'val.topAnswer.length' });
    }
    keyFacts.forEach((fact, index) => {
        if (fact && (fact.length < 60 || fact.length > 140)) {
            errors.push({ path: `geo.keyFacts[${index}]`, message: 'val.keyFact.length' });
        }
    });

    return errors;
};

/**
 * Lints the form for non-blocking warnings.
 * @param state The current form state.
 * @returns An array of warnings.
 */
export const lintForm = (state: FormState): Warning[] => {
    return [
        ...lintGeoText(state)
        // ... other linters can be added here
    ];
};

/**
 * Validates the generated job results for JSON-LD requirements.
 * This is intended to be run post-generation.
 * @param job The completed job object.
 * @returns An array of validation errors.
 */
export const validateJsonLd = (job: Job): ValidationError[] => {
    const errors: ValidationError[] = [];
    const { userInput, results } = job;

    if (!results || !userInput.toggles) {
        return errors;
    }

    // FAQPage Validation
    if (userInput.toggles.generateFaqJsonLd) {
        const validFaqs = results.panels
            .filter(p => p.status === 'ok' && p.panel?.faqs)
            .flatMap(p => p.panel!.faqs)
            .filter(faq => faq && faq.q?.trim() && faq.a?.trim());
        
        if (validFaqs.length < 1) {
            errors.push({
                path: 'jsonld.faq',
                message: 'val.jsonld.faq.missing',
            });
        }
    }

    // HowTo Validation
    if (userInput.toggles.generateHowToJsonLd) {
        const validSteps = results.panels
            .filter(p => p.status === 'ok' && p.panel?.sections)
            .flatMap(p => p.panel!.sections)
            .filter(section => section && section.title?.trim() && section.bullets?.length > 0);
        
        if (validSteps.length < 2) {
             errors.push({
                path: 'jsonld.howto',
                message: 'val.jsonld.howto.missing',
            });
        }
    }

    return errors;
};