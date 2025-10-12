import React, { useState, useCallback, useRef } from 'react';
import type { LayoutConfig, LayoutButton, LayoutTokens } from '../types';
import { FrameVariant, ContentVariant, ButtonVariant, ButtonPosition } from '../types';
import LayoutPreview from './LayoutPreview';
import { IconLayoutFrame, IconLayoutStack, IconLayoutSplit, IconLayoutGrid, IconLayoutAccordion, IconTrash, IconPlusCircle } from './Icons';

const defaultLayoutConfig: LayoutConfig = {
  module_label: "Neues Modul",
  frame_variant: FrameVariant.F1,
  content_variant: ContentVariant.L1,
  show_header: true,
  show_footer: true,
  tokens: {
    gap_px: 12,
    radius_px: 8,
    primary: '#1F51FF',
    surface: '#1A1A2E',
    text: '#EAEAEA',
    border: '#4A7BFF',
  },
  buttons: [
    { id: 'btn1', label: 'Mehr erfahren', url: '#', variant: ButtonVariant.PRIMARY, pos: ButtonPosition.CONTENT },
    { id: 'btn2', label: 'Kontakt', url: '#', variant: ButtonVariant.SECONDARY, pos: ButtonPosition.FOOTER },
  ],
};

const VisualSelector: React.FC<{ label: string; value: string; options: { value: string; label: string; icon: React.ReactNode }[]; onChange: (value: any) => void; }> = ({ label, value, options, onChange }) => (
  <div>
    <label className="dkip-layout-editor__label">{label}</label>
    <div className="dkip-layout-editor__visual-group">
      {options.map(opt => (
        <button key={opt.value} onClick={() => onChange(opt.value)} className={`dkip-layout-editor__visual-btn ${value === opt.value ? 'dkip-layout-editor__visual-btn--active' : ''}`} title={opt.label}>
          {opt.icon}
          <span className="dkip-layout-editor__visual-label">{opt.label}</span>
        </button>
      ))}
    </div>
  </div>
);

const TokenInput: React.FC<{ label: string; type: string; name: keyof LayoutTokens; value: string | number; onChange: (name: keyof LayoutTokens, value: string | number) => void; }> = ({ label, type, name, value, onChange }) => (
    <div className="dkip-layout-editor__token">
        <label htmlFor={`token-${name}`} className="dkip-layout-editor__token-label">{label}</label>
        <input id={`token-${name}`} type={type} name={name} value={value} onChange={e => onChange(name, type === 'number' ? parseInt(e.target.value, 10) || 0 : e.target.value)} className="dkip-layout-editor__input dkip-layout-editor__input--token" />
    </div>
);

export const LayoutModule: React.FC = () => {
  const [config, setConfig] = useState<LayoutConfig>(defaultLayoutConfig);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleConfigChange = useCallback((key: keyof LayoutConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleTokenChange = useCallback((key: keyof LayoutTokens, value: string | number) => {
    setConfig(prev => ({ ...prev, tokens: { ...prev.tokens, [key]: value } }));
  }, []);

  const handleButtonChange = useCallback((id: string, field: keyof Omit<LayoutButton, 'id'>, value: any) => {
    setConfig(prev => ({
      ...prev,
      buttons: prev.buttons.map(btn => btn.id === id ? { ...btn, [field]: value } : btn),
    }));
  }, []);

  const handleAddButton = useCallback(() => {
    const newId = `btn${Date.now()}`;
    const newButton: LayoutButton = {
      id: newId,
      label: 'Neuer Button',
      url: '#',
      variant: ButtonVariant.PRIMARY,
      pos: ButtonPosition.CONTENT,
    };
    setConfig(prev => ({ ...prev, buttons: [...prev.buttons, newButton] }));
  }, []);

  const handleRemoveButton = useCallback((id: string) => {
    setConfig(prev => ({ ...prev, buttons: prev.buttons.filter(btn => btn.id !== id) }));
  }, []);

  const handleJsonExport = useCallback(() => {
    const jsonString = JSON.stringify(config, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.module_label.replace(/\s+/g, '_').toLowerCase()}_layout.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [config]);
  
  const handleJsonImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedConfig = JSON.parse(e.target?.result as string);
          // Basic validation could be added here
          setConfig(importedConfig); 
        } catch (error) {
          alert('Fehler: Die JSON-Datei ist ungültig.');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <>
    <style>{editorStyles}</style>
    <div className="dkip-layout-editor__container">
      <div className="dkip-layout-editor__controls">
        <h3 className="dkip-layout-editor__title">Layout-Konfiguration</h3>
        <div className="dkip-layout-editor__section">
            <label className="dkip-layout-editor__label" htmlFor="module_label">Modul-Beschriftung</label>
            <input type="text" id="module_label" value={config.module_label} onChange={e => handleConfigChange('module_label', e.target.value)} className="dkip-layout-editor__input" />
        </div>

        <div className="dkip-layout-editor__section">
            <VisualSelector label="Frame-Variante" value={config.frame_variant} onChange={v => handleConfigChange('frame_variant', v)} options={[
                { value: FrameVariant.F1, label: 'Standard', icon: <IconLayoutFrame variant="F1" /> },
                { value: FrameVariant.F2, label: 'Header-Fokus', icon: <IconLayoutFrame variant="F2" /> },
                { value: FrameVariant.F3, label: 'Footer-Fokus', icon: <IconLayoutFrame variant="F3" /> },
            ]} />
        </div>
        <div className="dkip-layout-editor__section">
            <VisualSelector label="Content-Variante" value={config.content_variant} onChange={v => handleConfigChange('content_variant', v)} options={[
                { value: ContentVariant.L1, label: 'Stack', icon: <IconLayoutStack /> },
                { value: ContentVariant.L2, label: 'Split', icon: <IconLayoutSplit /> },
                { value: ContentVariant.L3, label: 'Grid', icon: <IconLayoutGrid /> },
                { value: ContentVariant.L4, label: 'Accordion', icon: <IconLayoutAccordion /> },
            ]} />
        </div>
        
        <div className="dkip-layout-editor__section dkip-layout-editor__toggles">
          <label className="dkip-layout-editor__toggle">
            <input type="checkbox" checked={config.show_header} onChange={e => handleConfigChange('show_header', e.target.checked)} />
            <span>Header anzeigen</span>
          </label>
          <label className="dkip-layout-editor__toggle">
            <input type="checkbox" checked={config.show_footer} onChange={e => handleConfigChange('show_footer', e.target.checked)} />
            <span>Footer anzeigen</span>
          </label>
        </div>

        <div className="dkip-layout-editor__section">
            <h4 className="dkip-layout-editor__subtitle">Design Tokens</h4>
            <div className="dkip-layout-editor__token-grid">
                <TokenInput label="Gap (px)" type="number" name="gap_px" value={config.tokens.gap_px} onChange={handleTokenChange} />
                <TokenInput label="Radius (px)" type="number" name="radius_px" value={config.tokens.radius_px} onChange={handleTokenChange} />
                <TokenInput label="Primär" type="color" name="primary" value={config.tokens.primary} onChange={handleTokenChange} />
                <TokenInput label="Surface" type="color" name="surface" value={config.tokens.surface} onChange={handleTokenChange} />
                <TokenInput label="Text" type="color" name="text" value={config.tokens.text} onChange={handleTokenChange} />
                <TokenInput label="Border" type="color" name="border" value={config.tokens.border} onChange={handleTokenChange} />
            </div>
        </div>

        <div className="dkip-layout-editor__section">
            <h4 className="dkip-layout-editor__subtitle">Buttons</h4>
            <div className="dkip-layout-editor__repeater">
              {config.buttons.map(btn => (
                <div key={btn.id} className="dkip-layout-editor__repeater-item">
                  <input type="text" value={btn.label} onChange={e => handleButtonChange(btn.id, 'label', e.target.value)} placeholder="Label" className="dkip-layout-editor__input" />
                  <input type="text" value={btn.url} onChange={e => handleButtonChange(btn.id, 'url', e.target.value)} placeholder="URL" className="dkip-layout-editor__input" />
                  <select value={btn.variant} onChange={e => handleButtonChange(btn.id, 'variant', e.target.value)} className="dkip-layout-editor__input">
                    {Object.values(ButtonVariant).map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                   <select value={btn.pos} onChange={e => handleButtonChange(btn.id, 'pos', e.target.value)} className="dkip-layout-editor__input">
                    {Object.values(ButtonPosition).map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <button onClick={() => handleRemoveButton(btn.id)} className="dkip-layout-editor__btn-icon"><IconTrash className="w-5 h-5" /></button>
                </div>
              ))}
            </div>
            <button onClick={handleAddButton} className="dkip-layout-editor__btn-add"><IconPlusCircle className="w-5 h-5" /> Button hinzufügen</button>
        </div>
         <div className="dkip-layout-editor__section dkip-layout-editor__io">
            <button onClick={handleJsonExport} className="dkip-layout-editor__btn">Export JSON</button>
            <button onClick={() => fileInputRef.current?.click()} className="dkip-layout-editor__btn">Import JSON</button>
            <input type="file" ref={fileInputRef} onChange={handleJsonImport} accept=".json" style={{ display: 'none' }} />
        </div>
      </div>
      <div className="dkip-layout-editor__preview">
        <LayoutPreview config={config} />
      </div>
    </div>
    </>
  );
};

const editorStyles = `
.dkip-layout-editor__container {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 2rem;
  background-color: var(--brand-primary);
  padding: 1rem;
  border-radius: 1rem;
}
.dkip-layout-editor__controls {
  background-color: var(--brand-secondary);
  padding: 1.5rem;
  border-radius: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  height: 80vh;
  overflow-y: auto;
}
.dkip-layout-editor__title { font-size: 1.5rem; font-weight: bold; text-align: center; }
.dkip-layout-editor__subtitle { font-size: 1.1rem; font-weight: 600; margin-bottom: 0.75rem; border-bottom: 1px solid var(--brand-primary); padding-bottom: 0.5rem; }
.dkip-layout-editor__label { display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.5rem; color: var(--brand-text-secondary); }
.dkip-layout-editor__input {
  width: 100%;
  background-color: var(--brand-primary);
  border: 1px solid var(--brand-accent-hover);
  border-radius: 0.375rem;
  padding: 0.5rem 0.75rem;
  color: var(--brand-text);
  transition: all 0.2s;
}
.dkip-layout-editor__input:focus { outline: none; ring: 2px; border-color: var(--brand-accent); box-shadow: 0 0 0 2px var(--brand-accent); }
.dkip-layout-editor__visual-group { display: flex; gap: 0.5rem; }
.dkip-layout-editor__visual-btn { background-color: var(--brand-primary); border: 2px solid transparent; border-radius: 0.375rem; padding: 0.5rem; cursor: pointer; transition: all 0.2s; flex: 1; display: flex; flex-direction: column; align-items: center; gap: 0.25rem; }
.dkip-layout-editor__visual-btn svg { width: 32px; height: 32px; }
.dkip-layout-editor__visual-btn:hover { border-color: var(--brand-accent-hover); }
.dkip-layout-editor__visual-btn--active { border-color: var(--brand-accent); background-color: var(--brand-accent-hover); }
.dkip-layout-editor__visual-label { font-size: 0.75rem; color: var(--brand-text-secondary); }
.dkip-layout-editor__visual-btn--active .dkip-layout-editor__visual-label { color: var(--brand-text); }
.dkip-layout-editor__toggles { display: flex; gap: 1rem; align-items: center; justify-content: center; }
.dkip-layout-editor__toggle { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; }
.dkip-layout-editor__token-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
.dkip-layout-editor__token { display: flex; align-items: center; justify-content: space-between; }
.dkip-layout-editor__token-label { font-size: 0.8rem; color: var(--brand-text-secondary); }
.dkip-layout-editor__input--token { width: auto; max-width: 100px; }
input[type="color"] { padding: 2px; height: 38px; }
.dkip-layout-editor__repeater { display: flex; flex-direction: column; gap: 0.75rem; }
.dkip-layout-editor__repeater-item { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; align-items: center; background-color: var(--brand-primary); padding: 0.5rem; border-radius: 0.25rem; }
.dkip-layout-editor__repeater-item > input:nth-child(1), .dkip-layout-editor__repeater-item > input:nth-child(2) { grid-column: span 2; }
.dkip-layout-editor__btn-icon { background: none; border: none; color: var(--brand-text-secondary); cursor: pointer; padding: 0.5rem; }
.dkip-layout-editor__btn-icon:hover { color: var(--brand-accent); }
.dkip-layout-editor__btn-add { display: flex; align-items: center; justify-content: center; gap: 0.5rem; width: 100%; padding: 0.5rem; margin-top: 0.5rem; background-color: var(--brand-accent-hover); border-radius: 0.25rem; }
.dkip-layout-editor__io { display: flex; gap: 1rem; }
.dkip-layout-editor__btn { flex: 1; padding: 0.75rem; background-color: var(--brand-accent); color: white; border: none; border-radius: 0.375rem; font-weight: bold; cursor: pointer; }
.dkip-layout-editor__preview { display: flex; align-items: center; justify-content: center; background-color: var(--brand-secondary); border-radius: 0.5rem; }
`;