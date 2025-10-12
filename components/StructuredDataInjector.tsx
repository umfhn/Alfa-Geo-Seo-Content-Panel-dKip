// components/StructuredDataInjector.tsx
// FIX: Add React and useEffect import for the component and hook.
import React, { useEffect } from 'react';

interface StructuredDataInjectorProps {
  faqJson: string | null;
  howToJson: string | null;
}

const SCRIPT_ID_FAQ = 'jsonld-faq';
const SCRIPT_ID_HOWTO = 'jsonld-howto';

/**
 * Manages a script tag in the document's head.
 * @param id The ID of the script tag.
 * @param content The JSON-LD content. If null, the script will be removed.
 */
const manageScriptTag = (id: string, content: string | null) => {
  const existingScript = document.getElementById(id);

  if (content) {
    // FIX: Cast the element to HTMLScriptElement to access script-specific properties like 'type'.
    const script = (existingScript || document.createElement('script')) as HTMLScriptElement;
    script.id = id;
    script.type = 'application/ld+json';
    // Use textContent for security, and minify JSON by default.
    script.textContent = JSON.stringify(JSON.parse(content));
    
    if (!existingScript) {
      document.head.appendChild(script);
    }
  } else {
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

    // Cleanup function to remove scripts when the component unmounts
    // or when the props that enable it are turned off.
    return () => {
      manageScriptTag(SCRIPT_ID_FAQ, null);
      manageScriptTag(SCRIPT_ID_HOWTO, null);
    };
  }, [faqJson, howToJson]);

  return null; // This component does not render anything.
};
