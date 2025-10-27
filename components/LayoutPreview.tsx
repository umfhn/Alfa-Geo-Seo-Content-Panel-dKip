
import React from 'react';
import { type LayoutConfig, ButtonVariant, ButtonPosition } from '../types';

interface LayoutPreviewProps {
  config: LayoutConfig;
}

const previewStyles = `
/* --- Base Structure --- */
.dkip-layout {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background-color: var(--dkip-layout-surface);
  color: var(--dkip-layout-text);
  border-radius: var(--dkip-layout-radius);
  border: 1px solid var(--dkip-layout-border);
}
.dkip-layout__shell {
  width: 320px;
  height: 568px; /* 9:16 aspect ratio */
  background-color: #fff;
  border-radius: 20px;
  border: 8px solid #111;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}
.dkip-layout__app-bar, .dkip-layout__nav-bar {
  background-color: #f0f0f0;
  color: #333;
  text-align: center;
  font-size: 12px;
  padding: 8px 0;
  flex-shrink: 0;
}
.dkip-layout__body {
  flex-grow: 1;
  background-color: var(--dkip-layout-surface);
  color: var(--dkip-layout-text);
  display: flex;
  flex-direction: column;
}
.dkip-layout__header, .dkip-layout__footer {
  flex-shrink: 0;
  padding: var(--dkip-layout-gap);
  background-color: rgba(0,0,0,0.2);
}
.dkip-layout__header-content, .dkip-layout__footer-content {
  border: 1px dashed var(--dkip-layout-border);
  border-radius: calc(var(--dkip-layout-radius) / 2);
  padding: var(--dkip-layout-gap);
  text-align: center;
}
.dkip-layout__content {
  flex-grow: 1;
  padding: var(--dkip-layout-gap);
  overflow-y: auto;
  scrollbar-width: thin;
}

/* --- Frame Variants --- */
.dkip-layout__frame--f2 .dkip-layout__header { flex-basis: 35%; }
.dkip-layout__frame--f3 .dkip-layout__header { display: none; }
.dkip-layout__frame--f3 .dkip-layout__footer { min-height: 25%; }

/* --- Buttons --- */
.dkip-layout__button-group {
  display: flex;
  flex-wrap: wrap;
  gap: calc(var(--dkip-layout-gap) / 2);
  justify-content: center;
  margin-top: var(--dkip-layout-gap);
}
.dkip-layout-btn {
  padding: 0.5rem 1rem;
  border-radius: var(--dkip-layout-radius);
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s;
  border: 2px solid transparent;
}
.dkip-layout-btn-primary {
  background-color: var(--dkip-layout-primary);
  color: var(--dkip-layout-surface);
}
.dkip-layout-btn-secondary {
  background-color: transparent;
  color: var(--dkip-layout-text);
  border-color: var(--dkip-layout-border);
}
.dkip-layout-btn-ghost {
  background-color: transparent;
  color: var(--dkip-layout-text);
  border-color: transparent;
}

/* --- Content Placeholders --- */
.dkip-layout-placeholder { padding: var(--dkip-layout-gap); border: 1px dashed var(--dkip-layout-border); border-radius: calc(var(--dkip-layout-radius) / 2); }
.dkip-layout-placeholder__block { background-color: rgba(255,255,255,0.1); border-radius: 4px; }
.dkip-layout-placeholder--stack { display: flex; flex-direction: column; gap: 8px; height: 150px; }
.dkip-layout-placeholder--stack .dkip-layout-placeholder__block:first-child { height: 40%; }
.dkip-layout-placeholder--stack .dkip-layout-placeholder__block:last-child { height: 60%; }
.dkip-layout-placeholder--split { display: flex; gap: 8px; height: 150px; }
.dkip-layout-placeholder--split .dkip-layout-placeholder__block { flex: 1; }
.dkip-layout-placeholder--grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; height: 150px; }
.dkip-layout-placeholder--accordion { display: flex; flex-direction: column; gap: 8px; height: 150px; }
.dkip-layout-placeholder--accordion .dkip-layout-placeholder__block { height: 33.33%; }

.dkip-layout__module-label {
  margin-top: 0.5rem;
  font-size: 12px;
  font-family: monospace;
  color: var(--dkip-layout-text);
  opacity: 0.7;
}
`;

const LayoutPreview: React.FC<LayoutPreviewProps> = ({ config }) => {
  const { frame_variant, content_variant, show_header, show_footer, tokens, buttons, module_label } = config;

  const dynamicStyles: React.CSSProperties = {
    '--dkip-layout-primary': tokens.primary,
    '--dkip-layout-surface': tokens.surface,
    '--dkip-layout-text': tokens.text,
    '--dkip-layout-border': tokens.border,
    '--dkip-layout-gap': `${tokens.gap_px}px`,
    '--dkip-layout-radius': `${tokens.radius_px}px`,
  } as React.CSSProperties;

  const getButtonsForPosition = (pos: ButtonPosition) => {
    return buttons.filter(btn => btn.pos === pos);
  };
  
  const getButtonClass = (variant: ButtonVariant) => {
    switch(variant) {
      case ButtonVariant.PRIMARY:
        return 'dkip-layout-btn-primary';
      case ButtonVariant.SECONDARY:
        return 'dkip-layout-btn-secondary';
      case ButtonVariant.GHOST:
        return 'dkip-layout-btn-ghost';
      default:
        return '';
    }
  };

  const renderButtons = (pos: ButtonPosition) => {
    const posButtons = getButtonsForPosition(pos);
    if (posButtons.length === 0) return null;
    
    return (
      <div className="dkip-layout__button-group">
        {posButtons.map(btn => (
          <a key={btn.id} href={btn.url || '#'} className={`dkip-layout-btn ${getButtonClass(btn.variant)}`}>
            {btn.label}
          </a>
        ))}
      </div>
    );
  };
  
  const renderContentPlaceholder = () => {
    const baseClasses = "dkip-layout-placeholder__block";
    switch(content_variant) {
      case 'L1': // Stack
        return <div className="dkip-layout-placeholder dkip-layout-placeholder--stack"><div className={baseClasses}></div><div className={baseClasses}></div></div>;
      case 'L2': // Split
        return <div className="dkip-layout-placeholder dkip-layout-placeholder--split"><div className={baseClasses}></div><div className={baseClasses}></div></div>;
      case 'L3': // Grid
        return <div className="dkip-layout-placeholder dkip-layout-placeholder--grid"><div className={baseClasses}></div><div className={baseClasses}></div><div className={baseClasses}></div><div className={baseClasses}></div></div>;
      case 'L4': // Accordion
        return <div className="dkip-layout-placeholder dkip-layout-placeholder--accordion"><div className={baseClasses}></div><div className={baseClasses}></div><div className={baseClasses}></div></div>;
      default:
        return null;
    }
  };
  
  const frameClasses = `dkip-layout__shell dkip-layout__frame--${frame_variant.toLowerCase()}`;

  return (
    <div className="dkip-layout" style={dynamicStyles}>
      <style>{previewStyles}</style>
      <div className={frameClasses}>
        <div className="dkip-layout__app-bar">App Bar</div>
        <div className="dkip-layout__body">
          {show_header && (
            <header className="dkip-layout__header">
              <div className="dkip-layout__header-content">
                <p>Header</p>
                {renderButtons(ButtonPosition.HEADER)}
              </div>
            </header>
          )}

          <main className="dkip-layout__content">
            {renderContentPlaceholder()}
            {renderButtons(ButtonPosition.CONTENT)}
          </main>
          
          {show_footer && (
            <footer className="dkip-layout__footer">
               <div className="dkip-layout__footer-content">
                <p>Footer</p>
                 {renderButtons(ButtonPosition.FOOTER)}
               </div>
            </footer>
          )}
        </div>
        <div className="dkip-layout__nav-bar">Nav Bar</div>
      </div>
       <p className="dkip-layout__module-label">{module_label}</p>
    </div>
  );
};

export default LayoutPreview;
