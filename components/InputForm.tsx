import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type { UserInput, Geo, JobMedia, GalleryMediaItem } from '../types';
import { InputType, Tone, PanelCount, ContentDepth } from '../types';
import { IconGenerate, IconSparkles, IconPlusCircle, IconTrash } from './Icons';
import { useValidation } from '../hooks/useValidation';
// FIX: The ValidationError type is not directly used in this component; it's inferred from the useValidation hook.
import type { FormState } from '../services/validationService';
import { ErrorSummary } from './ErrorSummary';
import { toId } from '../services/fieldPath';
import { focusAndScrollTo } from '../services/domFocus';
import { t } from '../i18n';

interface InputFormProps {
  onGenerate: (input: UserInput) => void;
  isLoading: boolean;
  onValidationChange?: (validationState: { isValid: boolean; errorCount: number; warnCount: number }) => void;
}

const initialMediaState: JobMedia = {
    hero: { avif1280: '', avif1920: '', webp1280: '', webp1920: '', jpg: '', alt: '', headline: '', subtitle: '', ctaUrl: '' },
    gallery: [],
    logoUrl: ''
};

export const InputForm: React.FC<InputFormProps> = ({ onGenerate, isLoading, onValidationChange }) => {
  const [inputType, setInputType] = useState<InputType>(InputType.TEXT);
  const [content, setContent] = useState<string>('');
  const [geo, setGeo] = useState<Geo>({ companyName: '', city: '', region: '', zip: '', branch: '', street: '', slug: '', phone: '', email: '', website: '' });
  const [tone, setTone] = useState<Tone>(Tone.NEUTRAL);
  const [panelCount, setPanelCount] = useState<PanelCount>(PanelCount.SIX);
  const [contentDepth, setContentDepth] = useState<ContentDepth>(ContentDepth.STANDARD);
  const [keepDesign, setKeepDesign] = useState<boolean>(false);
  const [topics, setTopics] = useState<string>('');
  const [outputFormat, setOutputFormat] = useState<'onepage' | 'legacy'>('onepage');
  const [media, setMedia] = useState<JobMedia>(initialMediaState);

  const formRef = useRef<HTMLFormElement>(null);

  // --- New Validation Hook ---
  const formStateForValidation = useMemo<FormState>(() => ({
    content,
    geo,
    topics,
    panelCount,
  }), [content, geo, topics, panelCount]);

  const { errors, errorsByPath, validateNow, isValid, errorCount, warnCount, firstErrorId } = useValidation(formStateForValidation);

  useEffect(() => {
    if (onValidationChange) {
      onValidationChange({ isValid, errorCount, warnCount });
    }
  }, [isValid, errorCount, warnCount, onValidationChange]);


  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateNow();

    if (validationErrors.length > 0) {
        const firstId = toId(validationErrors[0].path);
        focusAndScrollTo(firstId);
        return;
    }
    
    const finalTopics = topics.trim() ? topics.trim().split('\n').filter(Boolean) : undefined;
    onGenerate({ inputType, content, geo, tone, panelCount, contentDepth, keepDesign, topics: finalTopics, outputFormat, media });
  }, [onGenerate, validateNow, inputType, content, geo, tone, panelCount, contentDepth, keepDesign, topics, outputFormat, media]);
  
  const handleFillWithDummyData = useCallback(() => {
    setInputType(InputType.TEXT);
    setContent(
      "Grünwalds Gartenzauber ist ein führender Garten- und Landschaftsbau-Betrieb in Musterstadt, Bayern. Seit 2005 gestalten wir private Gärten und öffentliche Grünanlagen. Unser Team aus erfahrenen Gärtnern und Landschaftsarchitekten bietet alles aus einer Hand: von der Planung über die Bepflanzung bis zur regelmäßigen Pflege, inklusive Teichbau und Baumschnitt. Wir legen Wert auf nachhaltige Materialien und heimische Pflanzen."
    );
    setGeo({
      companyName: "Grünwalds Gartenzauber",
      branch: "Garten- und Landschaftsbau",
      street: "Ahornweg 12",
      city: "Musterstadt",
      zip: "12345",
      region: "Bayern",
      slug: "gruenwalds-gartenzauber-musterstadt",
      phone: "0123 456789",
      email: "info@gruenwalds-gartenzauber.de",
      website: "https://www.gruenwalds-gartenzauber.de"
    });
    setMedia({
        hero: {
            avif1280: 'https://placehold.co/1280x427/228B22/FFFFFF/avif?text=Hero-Banner',
            avif1920: 'https://placehold.co/1920x640/228B22/FFFFFF/avif?text=Hero-Banner',
            webp1280: 'https://placehold.co/1280x427/228B22/FFFFFF/webp?text=Hero-Banner',
            webp1920: 'https://placehold.co/1920x640/228B22/FFFFFF/webp?text=Hero-Banner',
            jpg: 'https://placehold.co/1920x640/228B22/FFFFFF/jpeg?text=Hero-Banner',
            alt: 'Ein wunderschöner, von Grünwalds Gartenzauber gestalteter Garten',
            headline: 'Willkommen bei Grünwalds Gartenzauber',
            subtitle: 'Ihr Experte für Traumgärten in Musterstadt und Umgebung.',
            ctaUrl: '#kontakt',
        },
        gallery: [
            { id: 'gal1', thumb: 'https://placehold.co/400x400/228B22/FFFFFF/jpeg?text=Projekt+1', full: 'https://placehold.co/800x600/228B22/FFFFFF/jpeg?text=Projekt+1', alt: 'Gartenprojekt 1', caption: 'Moderner Stadtgarten' },
            { id: 'gal2', thumb: 'https://placehold.co/400x400/228B22/FFFFFF/jpeg?text=Projekt+2', full: 'https://placehold.co/800x600/228B22/FFFFFF/jpeg?text=Projekt+2', alt: 'Gartenprojekt 2', caption: 'Ländlicher Teich' },
            { id: 'gal3', thumb: 'https://placehold.co/400x400/228B22/FFFFFF/jpeg?text=Projekt+3', full: 'https://placehold.co/800x600/228B22/FFFFFF/jpeg?text=Projekt+3', alt: 'Gartenprojekt 3', caption: 'Professioneller Baumschnitt' },
        ],
        logoUrl: 'https://placehold.co/150x50/FFFFFF/228B22/png?text=Logo'
    });
    setTone(Tone.WERBLICH);
    setPanelCount(PanelCount.SIX);
    setContentDepth(ContentDepth.STANDARD);
    setOutputFormat('onepage');
  }, []);

  const handleGeoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setGeo(prev => ({ ...prev, [name]: value }));
  };
  
  const handleContentChange = (value: string) => {
    setContent(value);
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const [category, field] = name.split('.');
    if (category === 'hero') {
        setMedia(prev => ({ ...prev, hero: { ...prev.hero, [field]: value }}));
    } else {
        setMedia(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleGalleryChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setMedia(prev => ({
          ...prev,
          gallery: prev.gallery.map(item => item.id === id ? { ...item, [name]: value } : item)
      }));
  };

  const addGalleryItem = () => {
      const newItem: GalleryMediaItem = { id: `gal${Date.now()}`, thumb: '', full: '', alt: '', caption: '' };
      setMedia(prev => ({ ...prev, gallery: [...prev.gallery, newItem] }));
  };

  const removeGalleryItem = (id: string) => {
      setMedia(prev => ({ ...prev, gallery: prev.gallery.filter(item => item.id !== id)}));
  };
  
  const topicList = topics.trim() ? topics.trim().split('\n').filter(Boolean) : [];
  const maxTopics = parseInt(panelCount, 10);

  const renderInputContent = () => {
    const errorObj = errorsByPath.get('content');
    const error = errorObj ? t(errorObj.message, errorObj.params) : undefined;
    const errorClass = error ? 'border-red-500 ring-red-500' : 'border-brand-accent/50 focus:ring-brand-accent';
    const baseClass = 'w-full bg-brand-primary border rounded-md p-3 focus:ring-2 focus:outline-none transition';
    const finalClass = `${baseClass} ${errorClass}`;

    const errorElement = error ? <p id="content-error" className="text-red-400 text-sm mt-1" role="alert">{error}</p> : null;

    const commonProps = {
        value: content,
        onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => handleContentChange(e.target.value),
        className: finalClass,
        name: "content",
        'aria-invalid': !!error,
        'aria-describedby': error ? "content-error" : undefined,
    };

    switch (inputType) {
      case InputType.URL:
        return <div>
            <input type="url" {...commonProps} placeholder="https://beispiel-unternehmen.de" />
            {errorElement}
        </div>;
      case InputType.TEXT:
        return <div>
            <textarea {...commonProps} placeholder="Beschreiben Sie hier Ihr Unternehmen, Ihre Leistungen und Vorteile..." rows={6} />
            {errorElement}
        </div>;
      case InputType.JSON:
        return <div>
            <textarea {...commonProps} placeholder={`{\n  "topic": "Beispiel GmbH",\n  "geo": { "city": "Berlin" },\n  "bullets": ["Punkt 1", "Punkt 2"]\n}`} rows={8} className={`${finalClass} font-mono text-sm`} />
            {errorElement}
        </div>;
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6" noValidate>
       <ErrorSummary errors={errors} firstErrorId={firstErrorId} />
       <div className="text-center -mt-2 mb-6">
          <button 
            type="button" 
            onClick={handleFillWithDummyData}
            className="inline-flex items-center space-x-2 text-brand-accent hover:text-brand-accent-hover transition-colors text-sm font-medium"
            aria-label="Formular mit Beispieldaten füllen"
          >
            <IconSparkles className="w-5 h-5" />
            <span>Mit Beispieldaten füllen</span>
          </button>
        </div>

      <div>
        <label className="block text-lg font-semibold mb-3">1. Input-Quelle wählen</label>
        <div className="flex space-x-2 bg-brand-primary p-1 rounded-lg">
          {(Object.values(InputType)).map(type => (
            <button key={type} type="button" onClick={() => { setInputType(type); handleContentChange(''); }} className={`w-full py-2 px-4 rounded-md text-sm font-medium transition ${inputType === type ? 'bg-brand-accent text-white shadow' : 'text-brand-text-secondary hover:bg-brand-secondary'}`}>
              {type.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      
      <div id={toId('content')}>{renderInputContent()}</div>

      <div>
        <label className="block text-lg font-semibold mb-3">2. Ausgabeformat</label>
        <div className="flex space-x-2 bg-brand-primary p-1 rounded-lg">
            <button type="button" onClick={() => setOutputFormat('onepage')} className={`w-full py-2 px-4 rounded-md text-sm font-medium transition ${outputFormat === 'onepage' ? 'bg-brand-accent text-white shadow' : 'text-brand-text-secondary hover:bg-brand-secondary'}`}>
                One-Page (HTML)
            </button>
            <button type="button" onClick={() => setOutputFormat('legacy')} className={`w-full py-2 px-4 rounded-md text-sm font-medium transition ${outputFormat === 'legacy' ? 'bg-brand-accent text-white shadow' : 'text-brand-text-secondary hover:bg-brand-secondary'}`}>
                Module/Panels (Legacy)
            </button>
        </div>
      </div>

      <div>
        <label className="block text-lg font-semibold mb-3">3. GEO-Metadaten</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(() => {
            const errorObj = errorsByPath.get('geo.companyName');
            const error = errorObj ? t(errorObj.message, errorObj.params) : undefined;
            return (
              <div id={toId('geo.companyName')}>
                <input type="text" name="companyName" value={geo.companyName} onChange={handleGeoChange} placeholder="Firma / Unternehmensname" aria-invalid={!!error} aria-describedby={error ? "companyName-error" : undefined} className={`w-full bg-brand-primary border rounded-md p-3 focus:ring-2 focus:outline-none transition ${error ? 'border-red-500 ring-red-500' : 'border-brand-accent/50 focus:ring-brand-accent'}`} />
                {error && <p id="companyName-error" className="text-red-400 text-sm mt-1" role="alert">{error}</p>}
              </div>
            );
          })()}
          {(() => {
              const errorObj = errorsByPath.get('geo.slug');
              const error = errorObj ? t(errorObj.message, errorObj.params) : undefined;
              return (
                <div id={toId('geo.slug')}>
                    <input type="text" name="slug" value={geo.slug} onChange={handleGeoChange} placeholder="SEO-Slug (z.b. firmenname-stadt)" aria-invalid={!!error} aria-describedby={error ? "slug-error" : undefined} className={`w-full bg-brand-primary border rounded-md p-3 focus:ring-2 focus:outline-none transition ${error ? 'border-red-500 ring-red-500' : 'border-brand-accent/50 focus:ring-brand-accent'}`} />
                    {error && <p id="slug-error" className="text-red-400 text-sm mt-1" role="alert">{error}</p>}
                </div>
              );
          })()}
          <input type="text" name="branch" value={geo.branch} onChange={handleGeoChange} placeholder="Branche (z.B. Webdesign)" className="bg-brand-primary border border-brand-accent/50 rounded-md p-3 focus:ring-2 focus:ring-brand-accent focus:outline-none transition" />
          <input type="text" name="street" value={geo.street} onChange={handleGeoChange} placeholder="Straße & Hausnummer" className="bg-brand-primary border border-brand-accent/50 rounded-md p-3 focus:ring-2 focus:ring-brand-accent focus:outline-none transition" />
          <div id={toId('geo.city')}>
             {(() => {
                const errorObj = errorsByPath.get('geo.city');
                const error = errorObj ? t(errorObj.message, errorObj.params) : undefined;
                return (
                    <>
                        <input type="text" name="city" value={geo.city} onChange={handleGeoChange} placeholder="Stadt (z.B. Hamburg)" aria-invalid={!!error} aria-describedby={error ? "city-error" : undefined} className={`w-full bg-brand-primary border rounded-md p-3 focus:ring-2 focus:outline-none transition ${error ? 'border-red-500 ring-red-500' : 'border-brand-accent/50 focus:ring-brand-accent'}`} />
                        {error && <p id="city-error" className="text-red-400 text-sm mt-1" role="alert">{error}</p>}
                    </>
                );
             })()}
          </div>
          <input type="text" name="zip" value={geo.zip} onChange={handleGeoChange} placeholder="PLZ (z.B. 20095)" className="bg-brand-primary border border-brand-accent/50 rounded-md p-3 focus:ring-2 focus:ring-brand-accent focus:outline-none transition" />
          <input type="text" name="region" value={geo.region} onChange={handleGeoChange} placeholder="Landkreis / Region" className="bg-brand-primary border border-brand-accent/50 rounded-md p-3 focus:ring-2 focus:ring-brand-accent focus:outline-none transition" />
          <input type="tel" name="phone" value={geo.phone} onChange={handleGeoChange} placeholder="Telefonnummer" className="bg-brand-primary border border-brand-accent/50 rounded-md p-3 focus:ring-2 focus:ring-brand-accent focus:outline-none transition" />
          <input type="email" name="email" value={geo.email} onChange={handleGeoChange} placeholder="E-Mail-Adresse" className="bg-brand-primary border border-brand-accent/50 rounded-md p-3 focus:ring-2 focus:ring-brand-accent focus:outline-none transition" />
          <input type="url" name="website" value={geo.website} onChange={handleGeoChange} placeholder="Webseite (URL)" className="bg-brand-primary border border-brand-accent/50 rounded-md p-3 focus:ring-2 focus:ring-brand-accent focus:outline-none transition sm:col-span-2" />
        </div>
      </div>
      
       {outputFormat === 'onepage' && (
        <details className="bg-brand-primary/50 p-4 rounded-lg group">
            <summary className="text-lg font-semibold list-none cursor-pointer flex justify-between items-center">4. Bilder &amp; Medien <span className="text-brand-accent group-open:rotate-90 transition-transform">&#10148;</span></summary>
            <div className="mt-6 space-y-6">
                <div>
                    <h4 className="font-semibold text-brand-text mb-2">Hero Banner</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input type="text" name="hero.headline" value={media.hero.headline} onChange={handleMediaChange} placeholder="Hero: Headline" className="bg-brand-primary border border-brand-accent/50 rounded-md p-3 focus:ring-2 focus:ring-brand-accent focus:outline-none transition" />
                        <input type="text" name="hero.subtitle" value={media.hero.subtitle} onChange={handleMediaChange} placeholder="Hero: Subtitle" className="bg-brand-primary border border-brand-accent/50 rounded-md p-3 focus:ring-2 focus:ring-brand-accent focus:outline-none transition" />
                        <input type="text" name="hero.alt" value={media.hero.alt} onChange={handleMediaChange} placeholder="Hero: Alt-Text (wichtig für SEO!)" className="bg-brand-primary border border-brand-accent/50 rounded-md p-3 sm:col-span-2 focus:ring-2 focus:ring-brand-accent focus:outline-none transition" />
                        <input type="url" name="hero.jpg" value={media.hero.jpg} onChange={handleMediaChange} placeholder="Hero: URL zu JPG/PNG (Fallback)" className="bg-brand-primary border border-brand-accent/50 rounded-md p-3 sm:col-span-2 focus:ring-2 focus:ring-brand-accent focus:outline-none transition" />
                    </div>
                </div>

                 <div>
                    <h4 className="font-semibold text-brand-text mb-2">Bildergalerie</h4>
                    <div className="space-y-4">
                        {media.gallery.map((item, index) => (
                             <div key={item.id} className="bg-brand-primary p-3 rounded-md grid grid-cols-1 sm:grid-cols-2 gap-3 relative">
                                <input type="url" name="thumb" value={item.thumb} onChange={(e) => handleGalleryChange(item.id, e)} placeholder={`Vorschau-URL ${index + 1}`} className="bg-brand-secondary border border-brand-accent/50 rounded-md p-2 text-sm focus:ring-2 focus:ring-brand-accent focus:outline-none transition" />
                                <input type="url" name="full" value={item.full} onChange={(e) => handleGalleryChange(item.id, e)} placeholder={`Vollbild-URL ${index + 1}`} className="bg-brand-secondary border border-brand-accent/50 rounded-md p-2 text-sm focus:ring-2 focus:ring-brand-accent focus:outline-none transition" />
                                <input type="text" name="alt" value={item.alt} onChange={(e) => handleGalleryChange(item.id, e)} placeholder={`Alt-Text ${index + 1}`} className="bg-brand-secondary border border-brand-accent/50 rounded-md p-2 text-sm sm:col-span-2 focus:ring-2 focus:ring-brand-accent focus:outline-none transition" />
                                <button type="button" onClick={() => removeGalleryItem(item.id)} className="absolute -top-2 -right-2 p-1 bg-red-600 rounded-full text-white hover:bg-red-700" aria-label="Galerie-Eintrag entfernen"><IconTrash className="w-4 h-4" /></button>
                             </div>
                        ))}
                    </div>
                    <button type="button" onClick={addGalleryItem} className="mt-4 flex items-center space-x-2 text-sm text-brand-accent hover:text-brand-accent-hover font-medium">
                        <IconPlusCircle className="w-5 h-5"/>
                        <span>Galerie-Eintrag hinzufügen</span>
                    </button>
                </div>
            </div>
        </details>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
            <label htmlFor="panelCount" className="block text-lg font-semibold mb-3">5. Anzahl der Sektionen</label>
            <select 
              id="panelCount" 
              name="panelCount"
              value={panelCount} 
              onChange={e => setPanelCount(e.target.value as PanelCount)} 
              className="w-full bg-brand-primary border border-brand-accent/50 rounded-md p-3 focus:ring-2 focus:ring-brand-accent focus:outline-none transition"
            >
              <option value={PanelCount.ONE}>1 Sektion (Fokus)</option>
              <option value={PanelCount.THREE}>3 Sektionen (Kompakt)</option>
              <option value={PanelCount.SIX}>6 Sektionen (Standard)</option>
              <option value={PanelCount.NINE}>9 Sektionen (Umfassend)</option>
              <option value={PanelCount.TWELVE}>12 Sektionen (Maximal)</option>
            </select>
        </div>
        <div>
            <label htmlFor="contentDepth" className="block text-lg font-semibold mb-3">6. Detailgrad</label>
            <select 
              id="contentDepth" 
              name="contentDepth"
              value={contentDepth} 
              onChange={e => setContentDepth(e.target.value as ContentDepth)} 
              className="w-full bg-brand-primary border border-brand-accent/50 rounded-md p-3 focus:ring-2 focus:ring-brand-accent focus:outline-none transition"
            >
              <option value={ContentDepth.COMPACT}>Kompakt (wenige Akkordeons)</option>
              <option value={ContentDepth.STANDARD}>Standard (mittel)</option>
              <option value={ContentDepth.DETAILED}>Detailliert (viele Akkordeons)</option>
            </select>
        </div>
      </div>

       <div id={toId('topics')}>
          <label htmlFor="topics" className="block text-lg font-semibold mb-3">7. Themen-Vorgaben (Optional)</label>
          {(() => {
            const errorObj = errorsByPath.get('topics');
            const error = errorObj ? t(errorObj.message, errorObj.params) : undefined;
            return (
              <>
                <div className="relative">
                  <textarea
                    id="topics"
                    name="topics"
                    value={topics}
                    onChange={e => setTopics(e.target.value)}
                    placeholder="Ein Thema pro Zeile. Fehlende Themen werden automatisch ergänzt."
                    rows={4}
                    className={`w-full bg-brand-primary border rounded-md p-3 focus:ring-2 focus:outline-none transition ${error ? 'border-red-500 ring-red-500' : 'border-brand-accent/50 focus:ring-brand-accent'}`}
                    aria-describedby="topics-helper topics-error"
                    aria-invalid={!!error}
                  />
                  <span id="topics-helper" className={`absolute bottom-2 right-2 text-xs font-mono px-2 py-1 rounded ${error ? 'bg-red-900/80 text-red-200' : 'bg-brand-primary text-brand-text-secondary'}`}>
                    {topicList.length}/{maxTopics}
                  </span>
                </div>
                {error && <p id="topics-error" className="text-red-400 text-sm mt-2" role="alert">{error}</p>}
              </>
            );
          })()}
      </div>

      <div>
        <label htmlFor="tone" className="block text-lg font-semibold mb-3">8. Tonfall</label>
        <select id="tone" name="tone" value={tone} onChange={e => setTone(e.target.value as Tone)} className="w-full bg-brand-primary border border-brand-accent/50 rounded-md p-3 focus:ring-2 focus:ring-brand-accent focus:outline-none transition">
          {Object.values(Tone).map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </select>
      </div>

      <div className="pt-4 space-y-4">
         <div className="flex items-center justify-center space-x-3">
            <label htmlFor="keep-design" className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" id="keep-design" className="sr-only peer" checked={keepDesign} onChange={() => setKeepDesign(prev => !prev)} />
                <div className="w-11 h-6 bg-brand-primary peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-accent rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-accent"></div>
            </label>
            <span className="text-sm text-brand-text-secondary">Design vom letzten Job übernehmen</span>
        </div>
        <div className="text-center">
            <button type="submit" disabled={isLoading || !isValid} className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 bg-brand-accent text-white font-bold rounded-lg hover:bg-brand-accent-hover disabled:bg-gray-500 disabled:opacity-70 disabled:cursor-not-allowed transition-colors duration-300 shadow-lg transform hover:scale-105">
              <IconGenerate className="w-5 h-5 mr-2"/>
              {isLoading ? t('form.jobRunning') : (!isValid ? t('gate.fixErrors') : t('form.startGeneration'))}
            </button>
        </div>
      </div>
    </form>
  );
};