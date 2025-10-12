import { useState, useEffect, useCallback, useRef } from 'react';

const VOICE_STORAGE_KEY = 'tts_selected_voice_uri';

export const useTextToSpeech = (text: string) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentSentence, setCurrentSentence] = useState('');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  const sentencesRef = useRef<string[]>([]);
  const currentSentenceIndexRef = useRef(0);

  // Load voices and ensure they are available before use
  useEffect(() => {
    const loadVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    loadVoices(); // Initial call in case they are already loaded
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, []);

  const stop = useCallback(() => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentSentence('');
    currentSentenceIndexRef.current = 0;
  }, []);

  // Split text into sentences when the input text changes.
  useEffect(() => {
    if (text) {
      // Match sentences ending with a period, question mark, or exclamation mark, including whitespace.
      const matches = text.match(/[^.!?]+[.!?\s]*/g);
      sentencesRef.current = matches ? matches.map(s => s.trim()).filter(Boolean) : [];
    } else {
      sentencesRef.current = [];
    }
    // Reset state when text changes to avoid playing stale content
    stop();
  }, [text, stop]);

  // Cleanup synthesis on component unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  const speakSentence = useCallback((index: number) => {
    if (index >= sentencesRef.current.length) {
      stop(); // All sentences have been spoken
      return;
    }

    const sentence = sentencesRef.current[index];
    setCurrentSentence(sentence);

    const utterance = new SpeechSynthesisUtterance(sentence);
    const selectedVoiceURI = localStorage.getItem(VOICE_STORAGE_KEY);
    
    if (voices.length > 0) {
        const selectedVoice = voices.find(v => v.voiceURI === selectedVoiceURI);
        if (selectedVoice) {
            utterance.voice = selectedVoice;
        } else {
            // Fallback to a default German voice if the stored one isn't found
            const germanVoice = voices.find(v => v.lang.startsWith('de'));
            if (germanVoice) utterance.voice = germanVoice;
        }
    }


    utterance.onend = () => {
      currentSentenceIndexRef.current += 1;
      speakSentence(currentSentenceIndexRef.current);
    };
    
    utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
      // "canceled" is a normal event when we call stop() or play() again.
      // We don't need to log it as an error.
      if (event.error === 'canceled') {
          return;
      }
      console.error(`SpeechSynthesis Error: ${event.error} for sentence: "${sentence}"`);
      stop(); // Stop on any other error
    };

    window.speechSynthesis.speak(utterance);
  }, [stop, voices]);

  const play = useCallback(() => {
    if (isPlaying && isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    } else {
       // It's possible for speech synthesis to be in a "paused" state from a previous session
      // on page load. Resume clears this state. Then we stop to ensure a clean start.
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      stop(); // Stop any previous speech before starting new
      setIsPlaying(true);
      setIsPaused(false);
      currentSentenceIndexRef.current = 0;
      speakSentence(0);
    }
  }, [isPlaying, isPaused, stop, speakSentence]);

  const pause = useCallback(() => {
    if (isPlaying && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, [isPlaying, isPaused]);

  return { isPlaying, isPaused, play, pause, stop, currentSentence };
};