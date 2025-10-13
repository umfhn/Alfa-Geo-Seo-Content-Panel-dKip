import React from 'react';
import { IconSeo, IconSixpack, IconSettings, IconShieldCheck } from './Icons';

interface HeaderProps {
  onSettingsClick: () => void;
  onSystemCheckClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onSettingsClick, onSystemCheckClick }) => {
  return (
    <header className="bg-brand-secondary/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
             <div className="bg-brand-accent p-2 rounded-lg">
                <IconSixpack className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-brand-text">
              Geo-SEO Content Panel Creator
            </h1>
          </div>
           <div className="flex items-center space-x-2">
            <div className="hidden sm:flex items-center space-x-2 text-brand-text-secondary">
              <IconSeo className="w-5 h-5 text-brand-accent" />
              <span>AI-Powered GEO Content</span>
            </div>
            <button 
                onClick={onSettingsClick} 
                className="p-2 rounded-full text-brand-text-secondary hover:bg-brand-secondary hover:text-white transition-colors" 
                aria-label="Einstellungen öffnen"
                title="Einstellungen"
            >
              <IconSettings className="w-6 h-6" />
            </button>
            <button 
                onClick={onSystemCheckClick} 
                className="p-2 rounded-full text-brand-text-secondary hover:bg-brand-secondary hover:text-white transition-colors" 
                aria-label="System-Check öffnen"
                title="System-Check"
            >
              <IconShieldCheck className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};