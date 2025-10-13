// components/StructuredDataInjector.tsx
import React, { useEffect } from 'react';

interface StructuredDataInjectorProps {
  faqJson: string | null;
  howToJson: string | null;
}

const SCRIPT_ID_FAQ = 'jsonld-faq';
const SCRIPT_ID_HOWTO = 'jsonld-howto';

/**
 * Manages a script tag in the document's head idempotently and safely.
 * @param id The ID of the script tag.
 * @param jsonContent The JSON-LD content. If null, the script will be removed.
 */
const manageScriptTag = (id: string, jsonContent: string | null) => {
  const existingScript = document.getElementById(id);

  if (jsonContent) {
    try {
      // 1. Validate and minify the JSON
      const parsedJson = JSON.parse(jsonContent);
      // 2. Stringify and escape for safety. JSON.stringify already escapes characters
      // like `</script>` inside strings, but this adds an explicit layer for `<`.
      const safeContent = JSON.stringify(parsedJson).replace(/</g, '\\u003c');
      
      // 3. Idempotent check: only update if content has changed
      if (existingScript && existingScript.textContent === safeContent) {
        return;
      }
      
      // Cast to HTMLScriptElement to satisfy TypeScript's type checker for the 'type' property.
      const script = (existingScript || document.createElement('script')) as HTMLScriptElement;
      script.id = id;
      script.type = 'application/ld+json';
      script.textContent = safeContent;
      
      if (!existingScript) {
        document.head.appendChild(script);
      }
    } catch (error) {
      console.error(`[StructuredDataInjector] Invalid JSON provided for script #${id}.`, error);
      // If JSON is invalid, ensure no script (or an old, invalid one) is present.
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    }
  } else {
    // If content is null, remove the script tag
    if (existingScript) {
      document.head.removeChild(existingScript);
    }
  }
};

/**
 * A headless component that injects structured data into the document's head.
 */
export const StructuredDataInjector: React.FC<StructuredDataInjectorProps> = ({ faqJson, howToJson }) => {
  useEffect(() => {
    manageScriptTag(SCRIPT_ID_FAQ, faqJson);
    manageScriptTag(SCRIPT_ID_HOWTO, howToJson);

    // Cleanup function ensures scripts are removed when the component unmounts
    // (e.g., when the toggle is turned off or navigating away).
    return () => {
      manageScriptTag(SCRIPT_ID_FAQ, null);
      manageScriptTag(SCRIPT_ID_HOWTO, null);
    };
  }, [faqJson, howToJson]);

  return null; // This component does not render anything.
};