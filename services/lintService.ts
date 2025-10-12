import type { Panel, LintIssue } from '../types';

const PLACEHOLDER_RE = /\{\s*[a-zA-Z0-9_]+\s*\}/i;

// Normalizes string for comparison (lowercase, no diacritics, trim)
const normalize = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim();

// Escapes string for RegExp
const rxEscape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Checks if a geo term is in the title, handling variations in spacing/casing
const geoMatch = (title: string, term?: string): boolean => {
  if (!term || !term.trim()) return false;
  const normalizedTitle = normalize(title);
  const normalizedTerm = normalize(term);
  // Create a regex that looks for the term as a whole word, allowing for flexible separators
  const termRx = new RegExp(`\\b${rxEscape(normalizedTerm).replace(/[-\s]+/g, '[-\\s]+')}\\b`, 'i');
  return termRx.test(normalizedTitle);
};

export function lintPanel(p: Panel, city?: string, region?: string): LintIssue[] {
  const issues: LintIssue[] = [];
  
  // Stringify all relevant text content to check for placeholders
  const contentBlob = JSON.stringify({
    title: p.title,
    summary: p.summary,
    sections: p.sections,
    faqs: p.faqs
  });

  if (PLACEHOLDER_RE.test(contentBlob)) {
    issues.push({
      code: 'PLACEHOLDER_LEAK',
      severity: 'ERROR',
      message: 'Unaufgelöste Platzhalter (z.B. {city}) im Inhalt gefunden.'
    });
  }

  const title = p.title || '';
  if (!geoMatch(title, city) && !geoMatch(title, region)) {
    issues.push({
      code: 'TITLE_NO_GEO',
      severity: 'WARN',
      message: 'Der Titel der Sektion sollte den Ort oder die Region enthalten.'
    });
  }

  return issues;
}

export function lintSetKeywordDups(panels: Panel[]): LintIssue[] {
  const frequencyMap = new Map<string, number>();
  
  // Collect and count all keywords from all panels
  for (const p of panels) {
    for (const k of (p.keywords || [])) {
      const normalizedKey = normalize(k);
      if (normalizedKey) {
        frequencyMap.set(normalizedKey, (frequencyMap.get(normalizedKey) || 0) + 1);
      }
    }
  }

  // Find keywords that appear more than twice
  const duplicates = [...frequencyMap.entries()]
    .filter(([, count]) => count > 2)
    .map(([keyword]) => keyword);

  if (duplicates.length > 0) {
    return [{
      code: 'KEYWORD_OVERLAP_WARN',
      severity: 'WARN',
      message: `Folgende Schlüsselwörter werden sehr häufig verwendet: ${duplicates.join(', ')}. Dies kann die Themenvielfalt reduzieren.`
    }];
  }
  
  return [];
}