

import type { Panel, CIColors, Geo, SectionLabels, ExportProfile, Job, SeoData, Faq } from '../types';
import { generateSeoMetadataFromContent } from './geminiService';

// --- HSL/Contrast Utility Functions ---

const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    if (!hex) return null;
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
        : null;
};

const getLuminance = (r: number, g: number, b: number): number => {
    const a = [r, g, b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
};

export const getContrastRatio = (hex1: string, hex2: string): number => {
    const rgb1 = hexToRgb(hex1);
    const rgb2 = hexToRgb(hex2);
    if (!rgb1 || !rgb2) return 1;
    const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
};

export const getWcagRating = (ratio: number): { level: 'AAA' | 'AA' | 'Fail', color: string } => {
    if (ratio >= 7) return { level: 'AAA', color: 'text-green-400' };
    if (ratio >= 4.5) return { level: 'AA', color: 'text-green-400' };
    return { level: 'Fail', color: 'text-red-400' };
};

// --- Design Presets & Default ---
const BASE_STYLES = {
  fontSizeTitle: 24,
  fontSizeAccordionTitle: 16,
  fontSizeContent: 14,
  scrollbarPosition: 'right' as const,
  radius_px: 8,
  blur_px: 0,
};

export const designPresets: { name: string; colors: CIColors }[] = [
    {
        name: 'Slate Blue (Corporate)',
        colors: {
            ...BASE_STYLES,
            primary: '#2D6CDF',
            secondary: '#0F172A',
            accent: '#60A5FA',
            text_primary: '#E5E7EB',
            text_secondary: '#9CA3AF',
        }
    },
    {
        name: 'Neutral Dark',
        colors: {
            ...BASE_STYLES,
            primary: '#3B82F6',
            secondary: '#0F172A',
            accent: '#22D3EE',
            text_primary: '#E5E7EB',
            text_secondary: '#94A3B8',
        }
    },
    // ... other presets
];

export const defaultCIColors: CIColors = designPresets[0].colors;

// --- HTML & CSS Generation ---

const CSS_PREFIX = 'dkip-';

function escapeHtml(unsafe: string | undefined): string {
    if(unsafe === undefined) return '';
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

function slugify(str: string) {
    return (str||'').toLowerCase()
      .replace(/[ä]/g,'ae').replace(/[ö]/g,'oe').replace(/[ü]/g,'ue').replace(/[ß]/g,'ss')
      .replace(/[^a-z0-9\s-]/g,'').trim().replace(/\s+/g,'-').replace(/-+/g,'-');
}

function getBaseCssRules(ciColors: CIColors): string {
    const p = CSS_PREFIX; // shorthand
    return `
.${p}panel {
    background-color: var(--${p}secondary, ${defaultCIColors.secondary});
    border-radius: var(--${p}border-radius, 12px); overflow: hidden;
    border: 1px solid var(--${p}accent, ${defaultCIColors.accent});
    font-family: var(--${p}font-family, sans-serif);
}
.${p}panel__title {
    font-size: ${ciColors.fontSizeTitle}px;
    background-color: rgba(0,0,0,0.2); padding: 1.5rem; margin: 0;
    color: var(--${p}text-primary, ${defaultCIColors.text_primary});
}
.${p}panel__content { padding: 1.5rem; display: flex; flex-direction: column; gap: 2rem; }
.${p}section-title {
    font-size: 1.1em; font-weight: bold; margin: 0 0 1rem 0;
    color: var(--${p}text-primary, ${defaultCIColors.text_primary});
    border-bottom: 1px solid var(--${p}accent, ${defaultCIColors.accent}); padding-bottom: 0.5rem;
}
.${p}section-title--muted {
    font-weight: 500;
    color: var(--${p}text-secondary, ${defaultCIColors.text_secondary});
    border-bottom: 1px dashed rgba(127,127,127,0.3);
}
.${p}summary {
    white-space: pre-wrap; font-size: ${ciColors.fontSizeContent}px;
    color: var(--${p}text-secondary, ${defaultCIColors.text_secondary}); line-height: 1.6;
}
.${p}accordion {
    border: 1px solid rgba(127,127,127,0.3); border-radius: calc(var(--${p}border-radius, 12px) * 0.66);
    background-color: rgba(0,0,0,0.1);
}
.${p}accordion[open] > .${p}accordion__summary { border-bottom: 1px solid rgba(127,127,127,0.3); }
.${p}accordion__summary {
    font-weight: bold; padding: 1rem; cursor: pointer; display: block;
    font-size: ${ciColors.fontSizeAccordionTitle}px; list-style: none; position: relative;
    color: var(--${p}text-primary, ${defaultCIColors.text_primary});
}
.${p}accordion__summary::-webkit-details-marker { display: none; }
.${p}accordion__summary::after {
    content: '+'; position: absolute; right: 1rem; top: 50%;
    transform: translateY(-50%); font-size: 1.5em; transition: transform 0.2s;
}
.${p}accordion[open] .${p}accordion__summary::after { content: '−'; }
.${p}accordion__content {
    padding: 1rem; font-size: ${ciColors.fontSizeContent}px;
    color: var(--${p}text-secondary, ${defaultCIColors.text_secondary}); line-height: 1.6;
}
.${p}accordion__content ul { list-style-position: inside; padding-left: 0.5rem; margin: 0; }
.${p}accordion__content li { margin-bottom: 0.5rem; }
.${p}faq {
    background-color: rgba(0,0,0,0.1); border-radius: calc(var(--${p}border-radius, 12px) * 0.66); padding: 1rem;
    border-left: 3px solid var(--${p}accent, ${defaultCIColors.accent});
}
.${p}faq__q {
    font-weight: bold; font-size: ${ciColors.fontSizeAccordionTitle}px;
    color: var(--${p}text-primary, ${defaultCIColors.text_primary}); margin: 0 0 0.25rem 0;
}
.${p}faq__a {
    color: var(--${p}text-secondary, ${defaultCIColors.text_secondary});
    font-size: ${ciColors.fontSizeContent}px; margin: 0;
}
.${p}keywords, .${p}faqs, .${p}sections { display: flex; flex-direction: column; gap: 0.75rem; }
.${p}keywords > summary { list-style: none; cursor: pointer; }
.${p}keywords > summary::-webkit-details-marker { display: none; }
.${p}keywords__container { display: flex; flex-wrap: wrap; gap: 0.5rem; padding-top: 1rem; }
.${p}keyword {
    background-color: var(--${p}primary, ${defaultCIColors.primary});
    color: #FFFFFF; padding: 0.25rem 0.75rem; border-radius: 9999px;
    font-size: 0.8rem; font-weight: 500;
}
    `.trim().replace(/\s*\n\s*/g, '\n');
}

function generateScopedCss(ciColors: CIColors, scopeId: string): string {
    const p = CSS_PREFIX;
    const scopeSelector = `[data-dkip-scope="${scopeId}"]`;
    
    const variables = `
${scopeSelector} {
    --${p}primary: ${escapeHtml(ciColors.primary)};
    --${p}secondary: ${escapeHtml(ciColors.secondary)};
    --${p}accent: ${escapeHtml(ciColors.accent)};
    --${p}text-primary: ${escapeHtml(ciColors.text_primary)};
    --${p}text-secondary: ${escapeHtml(ciColors.text_secondary)};
}`.trim();

    const rules = getBaseCssRules(ciColors);

    const scopedRules = rules.replace(/^(.*?)(\s*\{)/gm, (match, selectorGroup) => {
        if (!selectorGroup.trim()) {
            return match;
        }
        const newSelectors = selectorGroup.split(',')
            .map((selector: string) => `${scopeSelector} ${selector.trim()}`);
        return `${newSelectors.join(',\n')} {`;
    });

    return `<style>\n${variables}\n\n${scopedRules}\n</style>`;
}


function generateSinglePanelCleanHtml(panel: Panel, sectionLabels: SectionLabels, index: number): string {
    const p = CSS_PREFIX;
    const title = panel.title;
    const summary = panel.summary;
    const panelId = slugify(title) + '-' + (index + 1);

    const panelContentHtml = `
<h2 class="${p}panel__title">${escapeHtml(title)}</h2>
<div class="${p}panel__content">
    <div>
        <h3 class="${p}section-title">${escapeHtml(sectionLabels.summary)}</h3>
        <p class="${p}summary">${escapeHtml(summary)}</p>
    </div>
    <div class="${p}sections">
        <h3 class="${p}section-title">${escapeHtml(sectionLabels.sections)}</h3>
        ${panel.sections.map(section => `
        <details class="${p}accordion" open>
            <summary class="${p}accordion__summary">${escapeHtml(section.title)}</summary>
            <div class="${p}accordion__content">
                <ul>
                    ${section.bullets.map(bullet => `<li>${escapeHtml(bullet)}</li>`).join('\n                    ')}
                </ul>
            </div>
        </details>`).join('\n        ')}
    </div>
    ${panel.faqs && panel.faqs.length > 0 ? `
    <div class="${p}faqs">
        <h3 class="${p}section-title">${escapeHtml(sectionLabels.faq)}</h3>
        ${panel.faqs.map(faq => `
        <div class="${p}faq">
            <p class="${p}faq__q">${escapeHtml(faq.q)}</p>
            <p class="${p}faq__a">${escapeHtml(faq.a)}</p>
        </div>`).join('\n        ')}
    </div>` : ''}
    ${panel.keywords && panel.keywords.length > 0 ? `
    <details class="${p}keywords">
        <summary class="${p}section-title ${p}section-title--muted">${escapeHtml(sectionLabels.keywords)}</summary>
        <div class="${p}keywords__container">
            ${panel.keywords.map(keyword => `<span class="${p}keyword">${escapeHtml(keyword)}</span>`).join('\n            ')}
        </div>
    </details>` : ''}
</div>`.trim();

    return `<section id="${panelId}" class="${p}panel" data-dkip-scope>\n    ${panelContentHtml}\n</section>`;
}

export interface ExportBundle {
    profile: ExportProfile;
    html?: string;
    css?: string;
    combined?: string;
    warnings: string[];
}

export async function generateSeoData(job: Job): Promise<SeoData> {
    const { results } = job;
    const { geo } = results;
    const successfulPanels = results.panels.filter(p => p.status === 'ok' && p.panel);

    const topic = results.topic || 'Inhalte';
    const companyName = geo?.companyName || 'Ihr Unternehmen';
    const city = geo?.city || 'Ihre Stadt';
    
    let seoTitle = `${companyName} in ${city} - ${topic}`;
    let seoDescription = `Erfahren Sie mehr über ${topic} von ${companyName} in ${city}. Wir bieten professionelle Dienstleistungen.`;

    try {
        if (successfulPanels.length > 0) {
            const allPanelContent = successfulPanels
                .map(p => p.panel!)
                .map(p => `Titel: ${p.title}\nZusammenfassung: ${p.summary}\nKeywords: ${p.keywords.join(', ')}`)
                .join('\n\n---\n\n');
            
            const aiSeo = await generateSeoMetadataFromContent(companyName, city, topic, allPanelContent);
            
            seoTitle = aiSeo.title;
            seoDescription = aiSeo.description;
        }
    } catch (error) {
        console.warn("AI SEO generation failed, falling back to template.", error);
        throw error; // Re-throw the error so the UI layer can handle it (e.g., show a toast)
    }
    
    // Aggregated JSON-LD will be built in the one-page generator
    return {
        title: seoTitle.substring(0, 60),
        description: seoDescription.substring(0, 155),
        jsonLd: '', // To be filled by one-page generator
        canonical: geo?.website || '',
    };
}


// Legacy export for individual panels
export function generateExportBundle(
    panels: Panel[], 
    withContainer: boolean,
    profile: ExportProfile,
    ciColors: CIColors | undefined,
    sectionLabels: SectionLabels
): ExportBundle {
    const colors = ciColors || defaultCIColors;
    const warnings: string[] = [];

    const rawPanelHtml = panels.map((p, index) => generateSinglePanelCleanHtml(p, sectionLabels, index)).join('\n\n');

    if (profile === 'raw_html') {
        warnings.push('Stile müssen global bereitgestellt werden.');
        return {
            profile,
            html: `<div class="dkip-container">\n${rawPanelHtml}\n</div>`,
            warnings,
        };
    }
    
    const scopeId = `dkip-scope-${Date.now().toString(36)}`;
    const scopedCssWithTag = generateScopedCss(colors, scopeId);
    const cssOnly = scopedCssWithTag.replace(/<\/?style>/g, '').trim();
    const wrappedHtml = `<div data-dkip-scope="${scopeId}">\n${rawPanelHtml}\n</div>`;

    if (profile === 'gutenberg' || profile === 'classic_inline') {
        warnings.push('Zum Einfügen sind Administrator-Rechte ("unfiltered_html") nötig.');
        return {
            profile,
            combined: `${scopedCssWithTag}\n${wrappedHtml}`,
            warnings
        };
    }
    
    if (profile === 'classic_split') {
        warnings.push('CSS in "Zusätzliches CSS" oder CSS-Plugin einfügen; HTML im Text/HTML-Modus.');
        return {
            profile,
            html: wrappedHtml,
            css: cssOnly,
            warnings
        };
    }
    
    return { 
        profile: 'raw_html', 
        html: `<div class="dkip-container">\n${rawPanelHtml}\n</div>`, 
        warnings: ['Unbekanntes Profil, auf "Raw HTML" zurückgefallen.'] 
    };
}

// --- ONE-PAGE GENERATOR ---

const onePageTemplate = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>__PAGE_TITLE__</title>
  <meta name="description" content="__META_DESCRIPTION__" />
  <link rel="canonical" href="__CANONICAL_URL__" />
  <!-- Preload LCP Image -->
  <link rel="preload" as="image" href="__HERO_JPG__">
  
  <style>
    __HEAD_CSS__
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="brand">
        <div><strong>__COMPANY_NAME__</strong></div>
        <div class="subtitle">__ADDRESS_LINE__</div>
      </div>
    </header>

    <section class="hero" aria-label="Einstieg">
      <picture>
        <source type="image/avif" srcset="__HERO_AVIF_1280__ 1280w, __HERO_AVIF_1920__ 1920w" sizes="100vw" />
        <source type="image/webp" srcset="__HERO_WEBP_1280__ 1280w, __HERO_WEBP_1920__ 1920w" sizes="100vw" />
        <img src="__HERO_JPG__" width="1920" height="640" alt="__HERO_ALT__" loading="eager" fetchpriority="high" decoding="async" />
      </picture>
      <div class="hero__overlay"></div>
      <div class="hero__content">
        <h2 class="hero__title">__HERO_HEADLINE__</h2>
        <p class="hero__subtitle">__HERO_SUBTITLE__</p>
        <a class="btn" href="__HERO_CTA_URL__">Jetzt anfragen</a>
      </div>
    </section>

    <nav>
      <strong>Inhalt</strong>
      <ol id="toc" class="toc-list">__TOC_ITEMS__</ol>
    </nav>

    <main>
      <section class="article" id="content">
        <h1>__ARTICLE_H1__</h1>
        <p class="subtitle"></p>
        
        __PANEL_CONTENT__

        <div class="gallery" aria-label="Referenzen Galerie">
          __GALLERY_ITEMS__
        </div>

        <div class="contact-box">
          <h3>Kontakt</h3>
          <p>__PHONE__ · <a href="mailto:__EMAIL__">__EMAIL__</a></p>
          <p><a href="__WEBSITE__" class="btn">Unverbindlich anfragen</a></p>
        </div>
      </section>
    </main>

    <footer>
      <div>© __YEAR__ __COMPANY_NAME__ · <a href="/impressum">Impressum</a> · <a href="/datenschutz">Datenschutz</a> · <a href="/kontakt">Kontakt</a></div>
    </footer>
  </div>
  
  <script type="application/ld+json">
    __JSON_LD__
  </script>
</body>
</html>`;


export function generateOnePageHtml(job: Job, options: { includeCss: boolean, forWp: boolean }): string {
    const { results } = job;
    const { geo, ci_colors, media, panels: panelResults, meta, section_labels } = results;
    
    if (!geo || !ci_colors || !media || !section_labels) return "<html><body>Fehler: Wichtige Daten für die Seitenerstellung fehlen.</body></html>";
    const successfulPanels = panelResults.filter(p => p.status === 'ok' && p.panel).map(p => p.panel!);
    if (successfulPanels.length === 0) return "<html><body>Fehler: Keine validen Sektionen zum Erstellen der Seite vorhanden.</body></html>";

    // 1. Generate dynamic parts
    const tocItems = successfulPanels.map((panel, index) => {
        const title = panel.title || `Sektion ${index + 1}`;
        const id = slugify(title) + '-' + (index + 1);
        return `<li><a href="#${id}">${escapeHtml(title)}</a></li>`;
    }).join('\n');

    const panelContent = successfulPanels.map((panel, index) => generateSinglePanelCleanHtml(panel, section_labels, index)).join('\n\n');
    
    const galleryItems = media.gallery.map(item => 
        `<a href="${escapeHtml(item.full)}"><img src="${escapeHtml(item.thumb)}" alt="${escapeHtml(item.alt)}" loading="lazy" decoding="async"></a>`
    ).join('\n');
    
    // 2. Build JSON-LD
    const localBusinessSchema = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": geo.companyName,
        "address": {
          "@type": "PostalAddress", "streetAddress": geo.street, "postalCode": geo.zip,
          "addressLocality": geo.city, "addressRegion": geo.region, "addressCountry": "DE"
        },
        "telephone": geo.phone, "url": geo.website, "image": media.hero.jpg, "logo": media.logoUrl
    };

    const allFaqs = successfulPanels.flatMap(p => p.faqs || []);
    const uniqueFaqs = [...new Map(allFaqs.map(faq => [faq.q, faq])).values()];
    const faqSchema = uniqueFaqs.length > 0 ? {
        "@context": "https://schema.org", "@type": "FAQPage",
        "mainEntity": uniqueFaqs.map(faq => ({
            "@type": "Question", "name": faq.q,
            "acceptedAnswer": { "@type": "Answer", "text": faq.a }
        }))
    } : null;

    const schemas: (typeof localBusinessSchema | typeof faqSchema)[] = [localBusinessSchema];
    if (faqSchema) {
        schemas.push(faqSchema);
    }

    // 3. Prepare replacements
    const replacements: Record<string, string> = {
        '__PAGE_TITLE__': escapeHtml(meta?.title || `${geo.companyName} in ${geo.city}`),
        '__META_DESCRIPTION__': escapeHtml(meta?.description || `Leistungen von ${geo.companyName}.`),
        '__CANONICAL_URL__': escapeHtml(geo.website || '#'),
        '__HERO_JPG__': escapeHtml(media.hero.jpg),
        '__HERO_AVIF_1280__': escapeHtml(media.hero.avif1280 || media.hero.jpg),
        '__HERO_AVIF_1920__': escapeHtml(media.hero.avif1920 || media.hero.jpg),
        '__HERO_WEBP_1280__': escapeHtml(media.hero.webp1280 || media.hero.jpg),
        '__HERO_WEBP_1920__': escapeHtml(media.hero.webp1920 || media.hero.jpg),
        '__HERO_ALT__': escapeHtml(media.hero.alt),
        '__HERO_HEADLINE__': escapeHtml(media.hero.headline),
        '__HERO_SUBTITLE__': escapeHtml(media.hero.subtitle),
        '__HERO_CTA_URL__': escapeHtml(media.hero.ctaUrl),
        '__COMPANY_NAME__': escapeHtml(geo.companyName),
        '__ADDRESS_LINE__': escapeHtml(`${geo.street} · ${geo.zip} ${geo.city} (${geo.region})`),
        '__TOC_ITEMS__': tocItems,
        '__ARTICLE_H1__': escapeHtml(meta?.title || results.topic || 'Unsere Leistungen'),
        '__PANEL_CONTENT__': panelContent,
        '__GALLERY_ITEMS__': galleryItems,
        '__PHONE__': escapeHtml(geo.phone || ''),
        '__EMAIL__': escapeHtml(geo.email || ''),
        '__WEBSITE__': escapeHtml(geo.website || '#'),
        '__YEAR__': new Date().getFullYear().toString(),
        '__JSON_LD__': JSON.stringify(schemas, null, 2)
    };
    
    // 4. Build final HTML
    let finalHtml = onePageTemplate;
    for(const [key, value] of Object.entries(replacements)) {
        finalHtml = finalHtml.replace(new RegExp(key, 'g'), value);
    }

    if(options.includeCss) {
        const fullCss = `
:root {
  --dkip-primary: ${escapeHtml(ci_colors.primary)};
  --dkip-secondary: ${escapeHtml(ci_colors.secondary)};
  --dkip-accent: ${escapeHtml(ci_colors.accent)};
  --dkip-text-primary: ${escapeHtml(ci_colors.text_primary)};
  --dkip-text-secondary: ${escapeHtml(ci_colors.text_secondary)};
  --dkip-font-family: system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
  --dkip-border-radius: 12px;
}
body { font-family: var(--dkip-font-family); background: var(--dkip-secondary); color: var(--dkip-text-primary); margin: 0; }
.container { max-width: 1200px; margin: 0 auto; padding: 16px; }
header, nav, footer { background: rgba(255,255,255,0.03); border: 1px solid rgba(96,165,250,0.4); padding: 16px; border-radius: 12px; margin-bottom: 8px; }
header .brand { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
header .subtitle { font-size: 0.9rem; color: var(--dkip-text-secondary); }
main { display: block; background: rgba(0,0,0,0.08); min-height: 600px; box-sizing: border-box; border-radius: 12px; }
.article { padding: 24px; }
.contact-box { margin-top: 2.5rem; padding: 2rem; border-radius: var(--dkip-border-radius); background: rgba(0,0,0,0.2); text-align: center; border-top: 1px solid var(--dkip-accent); }
.contact-box h3 { font-size: 1.5rem; margin-top: 0; margin-bottom: 1rem; color: var(--dkip-text-primary); }
.contact-box p { margin-bottom: 1.5rem; }
.contact-box p:last-child { margin-bottom: 0; }
.contact-box a { color: var(--dkip-accent); text-decoration: none; }
.contact-box .btn { color: #fff; }
[data-dkip-scope], [data-dkip-scope] * { box-sizing: border-box; }
.toc-list { margin: 0; padding-left: 1.25rem; }
.toc-list a { color: var(--dkip-accent); text-decoration: none; }
.toc-list a:hover { text-decoration: underline; }
.btn { display: inline-block; padding: 0.6rem 1rem; border-radius: 9999px; background: var(--dkip-primary); color: #fff; text-decoration: none; font-weight: 600; }
.btn:hover { opacity: .9; }
.hero { position: relative; overflow: hidden; border-radius: var(--dkip-border-radius); margin-bottom: 8px; border: 1px solid rgba(96,165,250,0.4); }
.hero picture, .hero img { display: block; width: 100%; height: clamp(220px, 35vw, 420px); object-fit: cover; }
.hero__overlay { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,.35) 0%, rgba(0,0,0,.45) 60%, rgba(0,0,0,.55) 100%); }
.hero__content { position: absolute; left: 24px; bottom: 24px; right: 24px; display: grid; gap: 8px; }
.hero__title { font-size: 2em; margin: 0; color: #fff;}
.hero__subtitle { color: var(--dkip-text-secondary); margin: 0; }
.gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px; margin-top: 2rem; }
.gallery a { display:block; border-radius: var(--dkip-border-radius); overflow:hidden; border:1px solid rgba(127,127,127,0.25); }
.gallery img { display:block; width:100%; height:160px; object-fit:cover; }
        ` + getBaseCssRules(ci_colors);
        finalHtml = finalHtml.replace('__HEAD_CSS__', fullCss);
    } else {
        finalHtml = finalHtml.replace(/<style>[\s\S]*?<\/style>/, '');
    }

    if(options.forWp) {
        const containerMatch = finalHtml.match(/<div class="container">([\s\S]*)<\/div>\s*<script/);
        return containerMatch ? containerMatch[1].trim() : 'Fehler: Container für WP-Export nicht gefunden.';
    }

    return finalHtml;
}