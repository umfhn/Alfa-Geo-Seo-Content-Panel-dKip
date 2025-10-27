// services/structuredData.ts
import type { PanelResult } from '../types';

/**
 * Builds a schema.org FAQPage JSON-LD string from panel data.
 * @param panels The array of PanelResult from the job.
 * @returns A formatted JSON string or null if no valid FAQs are found.
 */
export const buildFaqJsonLd = (panels: PanelResult[]): string | null => {
  const validFaqs = panels
    .filter(p => p.status === 'ok' && p.panel?.faqs)
    .flatMap(p => p.panel!.faqs)
    .filter(faq => faq && faq.q?.trim() && faq.a?.trim());

  if (validFaqs.length === 0) {
    return null;
  }

  const faqPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: validFaqs.map(faq => ({
      '@type': 'Question',
      name: faq.q.trim(),
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a.trim(),
      },
    })),
  };

  return JSON.stringify(faqPageSchema, null, 2);
};

/**
 * Builds a schema.org HowTo JSON-LD string from panel data.
 * @param panels The array of PanelResult from the job.
 * @param jobTopic The main topic of the job, used as a fallback name.
 * @returns A formatted JSON string or null if not enough valid steps are found.
 */
export const buildHowToJsonLd = (panels: PanelResult[], jobTopic: string): string | null => {
  const validSteps = panels
    .filter(p => p.status === 'ok' && p.panel?.sections)
    .flatMap(p => p.panel!.sections)
    .filter(section => section && section.heading?.trim() && section.bullets?.length > 0)
    .map(section => ({
      '@type': 'HowToStep',
      name: section.heading.trim(),
      text: section.bullets.map(b => b.trim()).join('\n'),
    }));

  if (validSteps.length < 2) {
    return null;
  }

  const firstPanelTitle = panels.find(p => p.status === 'ok' && p.panel)?.panel?.title;

  const howToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: firstPanelTitle || `${jobTopic} – Anleitung`,
    step: validSteps,
  };

  return JSON.stringify(howToSchema, null, 2);
};