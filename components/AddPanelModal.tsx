import React, { useState, useEffect } from 'react';

interface AddPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (topic: string) => void;
  suggestions: string[];
}

export const AddPanelModal: React.FC<AddPanelModalProps> = ({ isOpen, onClose, onGenerate, suggestions }) => {
  const [topic, setTopic] = useState('');

  // Reset topic when modal is opened/closed
  useEffect(() => {
    if (!isOpen) {
      setTopic('');
    }
  }, [isOpen]);

  const handleGenerate = () => {
    if (topic.trim()) {
      onGenerate(topic);
      setTopic(''); // Reset after generation
    }
  };
  
  const handleSuggestionClick = (suggestion: string) => {
    setTopic(suggestion);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-brand-primary/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" 
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-brand-secondary rounded-2xl shadow-2xl w-full max-w-lg" 
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 space-y-6">
          <div>
              <h2 className="text-xl font-bold text-brand-text mb-2">Neues Panel hinzufügen</h2>
              <p className="text-sm text-brand-text-secondary">
                Wählen Sie einen Vorschlag oder geben Sie ein eigenes Thema an, um Duplikate zu vermeiden.
              </p>
          </div>
          
          {suggestions && suggestions.length > 0 && (
            <div>
                <h3 className="text-sm font-semibold text-brand-text-secondary mb-3">Themen-Vorschläge</h3>
                <div className="flex flex-wrap gap-2">
                    {suggestions.map((suggestion, index) => (
                        <button
                            key={index}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="px-3 py-1.5 text-sm rounded-full bg-brand-primary border border-brand-accent/30 hover:bg-brand-accent hover:text-white transition-colors"
                        >
                           + {suggestion}
                        </button>
                    ))}
                </div>
            </div>
          )}

          <div>
             <h3 className="text-sm font-semibold text-brand-text-secondary mb-3">Benutzerdefiniertes Thema</h3>
            <textarea
              id="new-panel-topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="z.B. 'Nachhaltigkeit im Gartenbau' oder 'Unsere SEO-Strategie für lokale Unternehmen'"
              rows={3}
              className="w-full bg-brand-primary border border-brand-accent/50 rounded-md p-3 focus:ring-2 focus:ring-brand-accent focus:outline-none transition"
            />
          </div>
        </div>
        <div className="flex justify-end space-x-3 bg-brand-primary/50 p-4 rounded-b-2xl">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-md bg-brand-secondary hover:bg-opacity-80 transition-colors"
          >
            Abbrechen
          </button>
          <button 
            onClick={handleGenerate}
            disabled={!topic.trim()}
            className="px-4 py-2 text-sm rounded-md bg-brand-accent text-white hover:bg-brand-accent-hover transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            Panel generieren
          </button>
        </div>
      </div>
    </div>
  );
};
