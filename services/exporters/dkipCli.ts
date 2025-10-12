// services/exporters/dkipCli.ts
import type { Job, DkipCliJson, DkipCliSection, DkipCliDockItem } from '../../types';

const slugify = (str: string) => {
    return (str || '').toLowerCase()
      .replace(/[ä]/g, 'ae').replace(/[ö]/g, 'oe').replace(/[ü]/g, 'ue').replace(/[ß]/g, 'ss')
      .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-');
};

/**
 * Builds the dKip CLI JSON export object from a completed job.
 * @param job The job object containing all user inputs and generation results.
 * @returns A DkipCliJson object.
 */
export const buildDkipCliJson = (job: Job): DkipCliJson => {
    const { userInput, results } = job;
    const { geo, ci_colors, media, panels: panelResults, meta } = results;

    const page = {
        title: (meta?.title || geo.companyName).trim(),
        slug: (geo.slug || slugify(geo.companyName)).trim(),
        locale: 'de-DE',
        theme: {
            surface: ci_colors?.secondary || '#0F172A',
            text: ci_colors?.text_primary || '#EAEAEA',
            accent: ci_colors?.accent || '#60A5FA',
            radius: ci_colors?.radius_px || 8,
            blur: ci_colors?.blur_px || 0,
        },
    };

    const dock: DkipCliDockItem[] = [];
    if (geo.phone) {
        dock.push({ label: 'Anrufen', href: `tel:${geo.phone.replace(/\s/g, '')}`, icon: 'phone' });
    }
    if (geo.email) {
        dock.push({ label: 'E-Mail', href: `mailto:${geo.email}`, icon: 'mail' });
    }
     if (geo.website) {
        dock.push({ label: 'Webseite', href: geo.website, icon: 'share' });
    }
    if (geo.street && geo.city) {
         dock.push({ label: 'Anfahrt', href: `https://maps.google.com/?q=${encodeURIComponent(`${geo.street}, ${geo.zip} ${geo.city}`)}`, icon: 'map' });
    }

    const sections: DkipCliSection[] = [];

    // 1. Add Hero section from media input
    if (media.hero.headline) {
        sections.push({
            id: 'hero-1',
            type: 'Hero',
            title: media.hero.headline.trim(),
            subtitle: media.hero.subtitle.trim(),
            mediaUrl: media.hero.jpg.trim(),
        });
    }

    // 2. Process generated panels into Accordion and FAQ sections
    panelResults.forEach(panelResult => {
        if (panelResult.status === 'ok' && panelResult.panel) {
            const panel = panelResult.panel;
            const baseId = panel.slug || slugify(panel.title);

            // Add Accordion section if it has content
            if (panel.sections && panel.sections.length > 0) {
                sections.push({
                    id: `${baseId}-accordion`,
                    type: 'Accordion',
                    items: panel.sections.map(s => ({
                        title: s.title.trim(),
                        content: s.bullets.map(b => b.trim()).join('\n'),
                    })),
                });
            }
            
            // Add FAQ section if it has content
            if (panel.faqs && panel.faqs.length > 0) {
                 sections.push({
                    id: `${baseId}-faq`,
                    type: 'FAQ',
                    faqs: panel.faqs.map(f => ({
                        question: f.q.trim(),
                        answer: f.a.trim(),
                    })),
                });
            }
        }
    });
    
    // 3. Add Media sections from gallery input
    if (media.gallery && media.gallery.length > 0) {
        media.gallery.forEach((item, index) => {
            sections.push({
                id: `media-${index + 1}`,
                type: 'Media',
                url: item.full.trim(),
                alt: item.alt.trim(),
            });
        });
    }

    return {
        page,
        dock: dock.slice(0, 4), // Enforce max of 4 items
        sections,
    };
};
