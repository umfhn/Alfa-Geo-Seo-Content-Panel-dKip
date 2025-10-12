// services/fieldPath.ts
const ID_PREFIX = 'field-';

/**
 * Converts a validation path string (e.g., "geo.companyName", "sections[0].title")
 * into a stable, kebab-case HTML ID.
 * @param path The validation error path.
 * @returns A unique and valid HTML ID string.
 */
export const toId = (path: string): string => {
  if (!path) return '';
  const sanitizedPath = path
    .replace(/\[/g, '-')  // Replace opening bracket with a dash
    .replace(/\]/g, '')   // Remove closing bracket
    .replace(/\./g, '-'); // Replace dots with a dash
  return `${ID_PREFIX}${sanitizedPath}`;
};
