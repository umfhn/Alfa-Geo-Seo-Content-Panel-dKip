import { useState, useEffect } from 'react';

export const useSpeechVoices = () => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        // Prefer German voices, but include all if no German voices are found
        const germanVoices = availableVoices.filter(voice => voice.lang.startsWith('de'));
        setVoices(germanVoices.length > 0 ? germanVoices : availableVoices);
      }
    };

    // The 'voiceschanged' event is crucial as voices may load asynchronously.
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    loadVoices(); // Initial call in case they are already loaded.

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, []);

  return voices;
};
