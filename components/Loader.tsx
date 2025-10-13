
import React from 'react';

export const Loader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center my-12">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-brand-accent"></div>
      {/* FIX: Updated loader text to be more generic for different input types. */}
      <p className="mt-4 text-brand-text-secondary text-lg">
        KI analysiert Ihre Eingaben und generiert Inhalte...
      </p>
       <p className="text-sm text-brand-text-secondary/70">
        Dies kann einen Moment dauern, insbesondere bei komplexen Anfragen.
      </p>
    </div>
  );
};
