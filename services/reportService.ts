import type { UserInput, ValidationReport, Warning } from '../types';

const SCHEMA_VERSION = "0.1";
// In a real Vite project, this would be: import.meta.env.VITE_APP_VERSION || 'dev'
const APP_VERSION = "0.3.0"; 

/**
 * Builds a validation report object.
 * @param userInput The user input from the form/job.
 * @param errorCount The number of validation errors.
 * @param warnings An array of validation warnings.
 * @returns A ValidationReport object.
 */
export const buildValidationReport = (
  userInput: UserInput,
  errorCount: number,
  warnings: Warning[]
): ValidationReport => {
  const report: ValidationReport = {
    schemaVersion: SCHEMA_VERSION,
    appVersion: APP_VERSION,
    timestamp: new Date().toISOString(),
    counts: {
      errors: errorCount,
      warnings: warnings.length,
    },
    page: {
      title: userInput.geo.companyName,
      slug: userInput.geo.slug,
      sectionCount: parseInt(userInput.panelCount, 10),
    },
  };

  if (userInput.toggles) {
    report.toggles = userInput.toggles;
  }
  
  if (warnings.length > 0) {
    report.warnings = warnings.map(({ path, code }) => ({ path, code }));
  }

  return report;
};

/**
 * Triggers a browser download for a given object as a JSON file.
 * @param filename The desired filename for the download.
 * @param data The JavaScript object to download.
 */
export const downloadJson = (filename: string, data: object) => {
  try {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Failed to download JSON file:", error);
    alert("Fehler beim Herunterladen des Reports.");
  }
};