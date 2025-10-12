// services/textLint.ts
import type { FormState } from './validationService';
import type { Warning } from '../types';

const URL_REGEX = /\b(?:https?:\/\/|mailto:|tel:)/i;
const BOOSTER_WORDS = ["sehr", "extrem", "unglaublich", "weltweit führend", "state of the art"];
const BOOSTER_REGEX = new RegExp(`\\b(${BOOSTER_WORDS.join('|')})\\b`, 'giu');

/**
 * Normalizes a key fact string for robust duplicate checking.
 * It trims, lowercases, collapses whitespace, and removes trailing punctuation.
 * @param s The string to normalize.
 * @returns The normalized string.
 */
const normalizeKeyFact = (s: string): string =>
  s.trim()
   .toLowerCase()
   .replace(/\s+/g, ' ')
   .replace(/[.,!?;:„“”"]+$/, ''); // remove trailing punctuation including various quotes

/**
 * Lints the GEO text fields for stylistic and qualitative issues.
 * These are non-blocking warnings.
 * @param formState The current state of the form.
 * @returns An array of warnings.
 */
export function lintGeoText(formState: FormState): Warning[] {
  const warnings: Warning[] = [];
  const { geo } = formState;

  // Rule 1: URL in short texts (only topAnswer exists in form)
  if (geo.topAnswer && URL_REGEX.test(geo.topAnswer)) {
    warnings.push({
      path: 'geo.topAnswer',
      code: 'NO_LINKS_IN_SHORT',
      messageKey: 'warn.noLinksInShort',
    });
  }

  // Rule 2: Booster/filler words
  if (geo.topAnswer && BOOSTER_REGEX.test(geo.topAnswer)) {
    // Reset regex state to avoid issues with global flag
    BOOSTER_REGEX.lastIndex = 0;
    // Avoid duplicate warnings for the same field
    if (!warnings.some(w => w.path === 'geo.topAnswer' && w.code === 'BOOSTER_WORDS')) {
        warnings.push({
            path: 'geo.topAnswer',
            code: 'BOOSTER_WORDS',
            messageKey: 'warn.boosterWords',
        });
    }
  }

  (geo.keyFacts || []).forEach((fact, index) => {
    if (fact && BOOSTER_REGEX.test(fact)) {
      BOOSTER_REGEX.lastIndex = 0; // Reset regex state
      warnings.push({
        path: `geo.keyFacts[${index}]`,
        code: 'BOOSTER_WORDS',
        messageKey: 'warn.boosterWords',
      });
    }
  });

  // Rule 3: Duplicate Key-Facts
  const seenFacts = new Map<string, number>();
  (geo.keyFacts || []).forEach((fact, index) => {
    if (!fact) return;
    const normalized = normalizeKeyFact(fact);
    if (normalized) {
      if (seenFacts.has(normalized)) {
        // Mark the current one as a duplicate
        warnings.push({
          path: `geo.keyFacts[${index}]`,
          code: 'DUPLICATE_KEY_FACT',
          messageKey: 'warn.duplicateKeyFact',
        });
        // If the first occurrence hasn't been marked yet, mark it too
        const firstIndex = seenFacts.get(normalized)!;
        if (!warnings.some(w => w.path === `geo.keyFacts[${firstIndex}]` && w.code === 'DUPLICATE_KEY_FACT')) {
          warnings.push({
            path: `geo.keyFacts[${firstIndex}]`,
            code: 'DUPLICATE_KEY_FACT',
            messageKey: 'warn.duplicateKeyFact',
          });
        }
      } else {
        seenFacts.set(normalized, index);
      }
    }
  });

  // Rule 4 (CTA in Body) is out of scope as 'text.body' does not exist in the form state.

  return warnings;
}
