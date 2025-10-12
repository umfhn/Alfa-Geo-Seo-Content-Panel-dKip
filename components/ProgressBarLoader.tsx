import React from 'react';

interface ProgressBarLoaderProps {
    progress: number;
    stepDescription: string;
    onCancel: () => void;
}

export const ProgressBarLoader: React.FC<ProgressBarLoaderProps> = ({ progress, stepDescription, onCancel }) => {
    return (
        <div className="w-full max-w-md mx-auto space-y-4">
            <div>
                <div className="flex justify-between items-center mb-1">
                    <p className="text-brand-text font-semibold text-sm">
                        {stepDescription}
                    </p>
                    <p className="text-brand-text font-bold text-sm">{progress}%</p>
                </div>
                <div className="w-full bg-brand-primary rounded-full h-2.5 overflow-hidden">
                    <div
                        className="bg-brand-accent h-2.5 rounded-full transition-all duration-300 ease-linear"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </div>
            <div className="text-center">
                <button
                    onClick={onCancel}
                    className="px-4 py-2 text-xs rounded-md bg-red-700/80 hover:bg-red-700 text-white transition-colors"
                >
                    Abbrechen
                </button>
            </div>
        </div>
    );
};
