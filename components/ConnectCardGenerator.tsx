
import React, { useState, useCallback, useEffect } from 'react';
import type { ConnectCardData, ConnectCardFeatures, SocialType, SocialLink } from '../types';
import { ConnectCardPreview } from './ConnectCardPreview';
import { IconSparkles, IconPlusCircle, IconTrash, IconDownload, IconCopy, IconVCard } from './Icons';

// MOCK SERVICE LOGIC - In a real app, this would be a separate service making a backend call.
const fetchAndParseUrl = async (url: string): Promise<Partial<ConnectCardData>> => {
    console.log(`Simulating fetch for: ${url}`);
    await new Promise(res => setTimeout(res, 800)); // Simulate network delay

    if (!url || !url.includes('.')) {
        throw new Error("Ungültige URL");
    }

    // Based on the ticket's example data
    return {
        name: "Muster GmbH",
        tagline: "Automatisierung einfach gemacht",
        url: "https://www.muster-gmbh.de",
        phone: "+49 30 12345678",
        email: "kontakt@muster-gmbh.de",
        address: {
            street: "Hauptstraße 1",
            postalCode: "10115",
            city: "Berlin",
            region: "Berlin",
            country: "DE"
        },
        hours: "Mo–Fr 09–17 Uhr",
        socials: [
            { id: '1', type: 'linkedin', url: 'https://linkedin.com/company/muster-gmbh' },
            { id: '2', type: 'instagram', url: 'https://instagram.com/mustergmbh' }
        ],
        legal: {
            imprint: "https://www.muster-gmbh.de/impressum",
            privacy: "https://www.muster-gmbh.de/datenschutz"
        },
    };
};
// END MOCK

const initialFeatures: ConnectCardFeatures = {
    website: true, call: true, email: true, vcard: true, qr: true, copyLink: true,
    share: false, address: true, hours: true, socials: true, legal: true,
};

const initialData: ConnectCardData = {
    name: "", tagline: "", url: "", phone: "", email: "",
    address: { street: "", postalCode: "", city: "", region: "", country: "" },
    hours: "", socials: [],
    legal: { imprint: "", privacy: "" },
    qrUrl: "",
    features: initialFeatures,
    theme: { accent: "#1F51FF", radius: 12, elevation: 'm' }
};

const dummyData: ConnectCardData = {
    name: "Muster GmbH",
    tagline: "Automatisierung einfach gemacht",
    url: "https://www.muster-gmbh.de",
    phone: "+49 30 12345678",
    email: "kontakt@muster-gmbh.de",
    address: {
        street: "Hauptstraße 1",
        postalCode: "10115",
        city: "Berlin",
        region: "Berlin",
        country: "DE"
    },
    hours: "Mo–Fr 09–17 Uhr",
    socials: [
        { id: '1', type: 'linkedin', url: 'https://linkedin.com/company/muster-gmbh' },
        { id: '2', type: 'instagram', url: 'https://instagram.com/mustergmbh' }
    ],
    legal: {
        imprint: "https://www.muster-gmbh.de/impressum",
        privacy: "https://www.muster-gmbh.de/datenschutz"
    },
    qrUrl: "https://www.muster-gmbh.de",
    features: initialFeatures,
    theme: { accent: "#1F51FF", radius: 12, elevation: 'm' }
};

// --- Start of Generation Helpers ---

const escapeHtml = (unsafe: string): string => {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
};

const getIconSvg = (iconName: string): string => {
    const icons: Record<string, string> = {
        website: '<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-4.5 0V6M18 6h-3m3 0h-3m0 0V3" />',
        phone: '<g transform="scale(0.8) translate(2, 2)"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 6.75z" /></g>',
        mail: '<path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />',
        vcard: '<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />',
        copy: '<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5 .124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />',
        building: '<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h6M9 11.25h6M9 15.75h6" />',
        clock: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />',
        linkedin: '<path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.25 6.5 1.75 1.75 0 016.5 8.25zM19 19h-3v-4.75c0-1.4-1.2-2.5-2.5-2.5S11 12.85 11 14.25V19h-3v-9h2.9v1.3a3.1 3.1 0 012.6-1.3c2.5 0 4.5 2.2 4.5 5v4z" />',
        instagram: '<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.85s-.012 3.584-.07 4.85c-.148 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07s-3.584-.012-4.85-.07c-3.252-.148-4.771-1.691-4.919-4.919-.058-1.265-.069-1.645-.069-4.85s.012-3.584.07-4.85c.148-3.225 1.664-4.771 4.919-4.919C8.416 2.175 8.796 2.163 12 2.163zm0 1.802c-3.116 0-3.472.01-4.68.066-2.583.118-3.967 1.5-4.085 4.085-.056 1.207-.066 1.562-.066 4.68s.01 3.472.066 4.68c.118 2.583 1.5 3.967 4.085 4.085 1.207.056 1.562.066 4.68.066s3.472-.01 4.68-.066c2.583-.118 3.967-1.5 4.085-4.085.056-1.207.066-1.562.066-4.68s-.01-3.472-.066-4.68c-.118-2.583-1.5-3.967-4.085-4.085-1.207-.056-1.562-.066-4.68-.066zM12 6.837c-2.84 0-5.163 2.323-5.163 5.163s2.323 5.163 5.163 5.163 5.163-2.323 5.163-5.163-2.323-5.163-5.163-5.163zm0 8.528c-1.854 0-3.365-1.511-3.365-3.365s1.511-3.365 3.365-3.365 3.365 1.511 3.365 3.365-1.511 3.365-3.365 3.365zm4.965-6.417c0 .779-.631 1.41-1.41 1.41s-1.41-.631-1.41-1.41.631-1.41 1.41-1.41 1.41.631 1.41 1.41z" />',
    };
    const path = icons[iconName];
    if (!path) return '';
    const className = "ccg-icon"; // Prefixed class
    if (iconName === 'instagram' || iconName === 'linkedin') {
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="${className}">${path}</svg>`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="${className}">${path}</svg>`;
};

const generateConnectCardCss = (theme: ConnectCardData['theme'], options: { standalone?: boolean } = {}): string => {
    const { standalone = true } = options;
    const bodyCss = standalone ? `
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #1A1A2E; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; padding: 2rem; box-sizing: border-box; }` : '';
    
    const standaloneContainerCss = standalone ? `
        max-height: 90vh;
        overflow-y: auto;` : '';
        
    const scrollbarCss = standalone ? `
      .ccg-card-container::-webkit-scrollbar { width: 8px; }
      .ccg-card-container::-webkit-scrollbar-track { background: var(--ccg-secondary); }
      .ccg-card-container::-webkit-scrollbar-thumb { background-color: var(--ccg-accent); border-radius: 10px; border: 2px solid var(--ccg-secondary); }
      .ccg-card-container { scrollbar-width: thin; scrollbar-color: var(--ccg-accent) var(--ccg-secondary); }` : '';

    return `
      .ccg-card-container {
        --ccg-primary: #0D0D1A; 
        --ccg-secondary: #1A1A2E; 
        --ccg-accent: ${escapeHtml(theme.accent)};
        --ccg-text: #EAEAEA; 
        --ccg-text-secondary: #A9A9A9; 
        --ccg-card-radius: ${theme.radius}px;
        background-color: var(--ccg-primary); 
        color: var(--ccg-text); 
        padding: 1rem; 
        border-radius: calc(var(--ccg-card-radius) * 1.5); 
        border: 2px solid var(--ccg-secondary); 
        max-width: 24rem; 
        width: 100%; 
        box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        ${standaloneContainerCss}
      }
      ${bodyCss}
      ${scrollbarCss}
      .ccg-card-container * { box-sizing: border-box; }
      .ccg-card-content { display: flex; flex-direction: column; gap: 1rem; }
      .ccg-header { text-align: center; } 
      .ccg-header h2 { font-size: 1.5rem; font-weight: 700; margin: 0; }
      .ccg-header p { color: var(--ccg-text-secondary); font-size: 0.875rem; margin: 0.25rem 0 0 0; }
      .ccg-button-group { display: flex; flex-direction: column; gap: 0.5rem; }
      .ccg-action-button { background-color: var(--ccg-secondary); padding: 0.75rem; border-radius: var(--ccg-card-radius); display: flex; align-items: center; width: 100%; text-align: left; text-decoration: none; color: inherit; transition: background-color 0.2s; }
      .ccg-action-button:hover { background-color: #2a2a3e; } 
      .ccg-icon { width: 1.5rem; height: 1.5rem; margin-right: 0.75rem; }
      .ccg-side-icon { margin-left: auto; color: var(--ccg-text-secondary); } 
      .ccg-button-label { flex-grow: 1; font-weight: 500; }
      .ccg-qr-container { background-color: white; padding: 0.75rem; border-radius: var(--ccg-card-radius); margin: 0 auto; max-width: 200px; }
      .ccg-qr-container img { display: block; width: 100%; height: auto; } 
      .ccg-divider { border: 0; height: 1px; background-color: var(--ccg-secondary); margin: 0; }
      .ccg-info-group { display: flex; flex-direction: column; gap: 0.75rem; }
      .ccg-info-line { display: flex; align-items: center; font-size: 0.875rem; }
      .ccg-info-line .ccg-icon { width: 1.25rem; height: 1.25rem; color: var(--ccg-text-secondary); }
      .ccg-social-group { display: flex; justify-content: center; align-items: center; gap: 1rem; padding-top: 0.5rem; }
      .ccg-social-group a { color: var(--ccg-text-secondary); transition: color 0.2s; } 
      .ccg-social-group a:hover { color: white; }
      .ccg-social-group .ccg-icon { width: 2rem; height: 2rem; margin: 0; }
      .ccg-footer { text-align: center; font-size: 0.75rem; color: var(--ccg-text-secondary); padding-top: 0.5rem; border-top: 1px solid var(--ccg-secondary); }
      .ccg-footer p { margin: 0.25rem 0; } 
      .ccg-footer a { color: inherit; text-decoration: none; } 
      .ccg-footer a:hover { text-decoration: underline; }
    `.replace(/\s\s+/g, ' ').trim();
};

const generateConnectCardBodyHtml = (cardData: ConnectCardData): string => {
    const { name, tagline, url, phone, email, address, hours, socials, legal, qrUrl, features } = cardData;

    const actionButton = (label: string, href: string, iconName: string, sideIconName?: string) => `
        <a href="${escapeHtml(href)}" class="ccg-action-button">
            ${getIconSvg(iconName)} <span class="ccg-button-label">${escapeHtml(label)}</span>
            ${sideIconName ? `<span class="ccg-side-icon">${getIconSvg(sideIconName)}</span>` : ''}
        </a>`;
    
    const fullAddress = [address.street, address.city].filter(Boolean).join(', ');

    return `
        <div class="ccg-card-container">
            <div class="ccg-card-content">
                <div class="ccg-header">
                    <h2>${escapeHtml(name) || "Muster GmbH"}</h2>
                    <p>${escapeHtml(tagline) || "Automatisierung einfach gemacht"}</p>
                </div>
                <div class="ccg-button-group">
                    ${features.website && url ? actionButton("Website öffnen", url, 'website') : ''}
                    ${features.call && phone ? actionButton("Anrufen", `tel:${phone}`, 'phone', 'copy') : ''}
                    ${features.email && email ? actionButton("E-Mail senden", `mailto:${email}`, 'mail', 'copy') : ''}
                    ${features.vcard && name ? `<a href="#" class="ccg-action-button">${getIconSvg('vcard')} <span class="ccg-button-label">vCard herunterladen</span></a>` : ''}
                </div>
                ${features.qr && qrUrl ? `<div class="ccg-qr-container"><img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}&bgcolor=FFFFFF&color=000000&qzone=1" alt="QR Code for ${escapeHtml(name)}" /></div>` : ''}
                ${features.copyLink && url ? `<a href="#" class="ccg-action-button">${getIconSvg('copy')} <span class="ccg-button-label">Link kopieren</span></a>` : ''}
                ${(features.address && fullAddress) || (features.hours && hours) ? `<hr class="ccg-divider" />` : ''}
                <div class="ccg-info-group">
                    ${features.address && fullAddress ? `<div class="ccg-info-line">${getIconSvg('building')} <span>${escapeHtml(fullAddress)}</span></div>` : ''}
                    ${features.hours && hours ? `<div class="ccg-info-line">${getIconSvg('clock')} <span>${escapeHtml(hours)}</span></div>` : ''}
                </div>
                ${features.socials && socials.length > 0 ? `
                    <div class="ccg-social-group">
                        ${socials.map(s => `<a href="${escapeHtml(s.url)}" target="_blank" rel="noopener noreferrer">${getIconSvg(s.type)}</a>`).join('')}
                    </div>
                ` : ''}
                ${features.legal && (legal.imprint || legal.privacy) ? `
                    <div class="ccg-footer">
                        <p><strong>${escapeHtml(name)}</strong></p>
                        <p>
                            ${legal.imprint ? `<a href="${escapeHtml(legal.imprint)}">Impressum</a>` : ''}
                            ${legal.imprint && legal.privacy ? ' &middot; ' : ''}
                            ${legal.privacy ? `<a href="${escapeHtml(legal.privacy)}">Datenschutz</a>` : ''}
                        </p>
                    </div>
                ` : ''}
            </div>
        </div>`;
};
// --- End of Generation Helpers ---


export const ConnectCardGenerator: React.FC = () => {
    const [urlInput, setUrlInput] = useState('');
    const [data, setData] = useState<ConnectCardData>(initialData);
    const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
    const [toast, setToast] = useState<string | null>(null);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const handleAnalyze = useCallback(async () => {
        setStatus('loading');
        try {
            const parsedData = await fetchAndParseUrl(urlInput);
            setData(prev => ({
                ...initialData,
                ...prev,
                name: parsedData.name || '',
                tagline: parsedData.tagline || '',
                url: parsedData.url || urlInput,
                phone: parsedData.phone || '',
                email: parsedData.email || '',
                address: { ...initialData.address, ...parsedData.address },
                hours: parsedData.hours || '',
                socials: parsedData.socials || [],
                legal: { ...initialData.legal, ...parsedData.legal },
                qrUrl: parsedData.url || urlInput,
            }));
            setStatus('success');
        } catch (e) {
            setStatus('error');
            console.error(e);
        }
    }, [urlInput]);
    
    const handleFillWithDummyData = useCallback(() => {
        setData(dummyData);
        setUrlInput(dummyData.url);
    }, []);

    const handleDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const [section, field] = name.split('.');

        if (section === 'address' || section === 'legal') {
            setData(prev => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
        } else {
            setData(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleSocialChange = (id: string, field: 'type' | 'url', value: string) => {
        setData(prev => ({ ...prev, socials: prev.socials.map(s => s.id === id ? { ...s, [field]: value } : s) }));
    };
    
    const addSocial = () => {
        const newSocial: SocialLink = { id: Date.now().toString(), type: 'linkedin', url: '' };
        setData(prev => ({ ...prev, socials: [...prev.socials, newSocial] }));
    };

    const removeSocial = (id: string) => {
        setData(prev => ({ ...prev, socials: prev.socials.filter(s => s.id !== id) }));
    };

    const generateConnectCardHtml = useCallback((cardData: ConnectCardData): string => {
        const css = generateConnectCardCss(cardData.theme, { standalone: true });
        const bodyHtml = generateConnectCardBodyHtml(cardData);

        return `
            <!DOCTYPE html>
            <html lang="de">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Connect Card: ${escapeHtml(cardData.name)}</title>
                <style>${css}</style>
            </head>
            <body>
                ${bodyHtml}
            </body>
            </html>
        `;
    }, []);

    const handleDownloadHtml = useCallback(() => {
        const htmlContent = generateConnectCardHtml(data);
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `connect-card-${data.name.toLowerCase().replace(/\s+/g, '-') || 'export'}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setToast('HTML-Datei wird heruntergeladen...');
    }, [data, generateConnectCardHtml]);

    const handleCopyHtml = useCallback(() => {
        const htmlContent = generateConnectCardHtml(data);
        navigator.clipboard.writeText(htmlContent).then(() => {
            setToast('HTML-Code in die Zwischenablage kopiert!');
        }).catch(err => {
            console.error('Copy failed', err);
            setToast('Kopieren fehlgeschlagen.');
        });
    }, [data, generateConnectCardHtml]);

    const handleCopyHtmlOnly = useCallback(() => {
        const bodyHtml = generateConnectCardBodyHtml(data);
        navigator.clipboard.writeText(bodyHtml).then(() => {
            setToast('Nur HTML-Code in die Zwischenablage kopiert!');
        }).catch(err => {
            console.error('Copy failed', err);
            setToast('Kopieren fehlgeschlagen.');
        });
    }, [data]);

    const handleCopyCssOnly = useCallback(() => {
        const css = generateConnectCardCss(data.theme, { standalone: false });
        navigator.clipboard.writeText(css).then(() => {
            setToast('Nur CSS-Code in die Zwischenablage kopiert!');
        }).catch(err => {
            console.error('Copy failed', err);
            setToast('Kopieren fehlgeschlagen.');
        });
    }, [data.theme]);

    const handleDownloadVCard = useCallback(() => {
        const { name, tagline, phone, email, url, address } = data;
        if (!name) {
            setToast('Bitte geben Sie mindestens einen Namen für die vCard an.');
            return;
        }
        const vCardString = [
            'BEGIN:VCARD', 'VERSION:3.0',
            `FN:${name}`, `ORG:${name}`,
            `TITLE:${tagline}`, `TEL;TYPE=WORK,VOICE:${phone}`,
            `ADR;TYPE=WORK:;;${address.street};${address.city};${address.region};${address.postalCode};${address.country}`,
            `EMAIL:${email}`, `URL:${url}`,
            'END:VCARD'
        ].filter(Boolean).join('\n');

        const blob = new Blob([vCardString], { type: 'text/vcard;charset=utf-8' });
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `${name.toLowerCase().replace(/\s/g, '_') || 'kontakt'}.vcf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
        setToast('vCard (.vcf) wird heruntergeladen...');
    }, [data]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
             {toast && (
                <div className="absolute top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-20">
                    {toast}
                </div>
            )}
            <div className="bg-brand-secondary p-6 rounded-xl space-y-6">
                <h2 className="text-2xl font-bold">1. Datenquelle</h2>
                <div className="flex items-end gap-2">
                    <div className="flex-grow">
                        <label htmlFor="url-input" className="block text-sm font-medium text-brand-text-secondary mb-1">Website-URL analysieren (optional)</label>
                        <input type="url" id="url-input" value={urlInput} onChange={e => setUrlInput(e.target.value)} placeholder="https://beispiel-unternehmen.de" className="w-full bg-brand-primary border border-brand-accent/50 rounded-md p-3 focus:ring-2 focus:ring-brand-accent focus:outline-none transition" />
                    </div>
                    <button onClick={handleAnalyze} disabled={status === 'loading'} className="px-6 py-3 bg-brand-accent text-white font-bold rounded-lg hover:bg-brand-accent-hover disabled:bg-gray-500 transition-colors">
                        {status === 'loading' ? 'Analysiere...' : 'Analyse'}
                    </button>
                </div>
                 <div className="text-center -mt-4 mb-4">
                    <button type="button" onClick={handleFillWithDummyData} className="inline-flex items-center space-x-2 text-brand-accent hover:text-brand-accent-hover transition-colors text-sm font-medium" aria-label="Formular mit Beispieldaten füllen">
                        <IconSparkles className="w-5 h-5" />
                        <span>Mit Beispieldaten füllen</span>
                    </button>
                </div>
                
                <h2 className="text-2xl font-bold pt-4 border-t border-brand-primary">2. Kartendaten bearbeiten</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><input type="text" name="name" value={data.name} onChange={handleDataChange} placeholder="Name (Firma/Person)" className="bg-brand-primary border border-brand-accent/50 rounded-md p-3" /><input type="text" name="tagline" value={data.tagline} onChange={handleDataChange} placeholder="Tagline / Slogan" className="bg-brand-primary border border-brand-accent/50 rounded-md p-3" /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><input type="tel" name="phone" value={data.phone} onChange={handleDataChange} placeholder="Telefon" className="bg-brand-primary border border-brand-accent/50 rounded-md p-3" /><input type="email" name="email" value={data.email} onChange={handleDataChange} placeholder="E-Mail" className="bg-brand-primary border border-brand-accent/50 rounded-md p-3" /><input type="url" name="url" value={data.url} onChange={handleDataChange} placeholder="Website URL" className="bg-brand-primary border border-brand-accent/50 rounded-md p-3 sm:col-span-2" /><input type="url" name="qrUrl" value={data.qrUrl} onChange={handleDataChange} placeholder="QR Code Ziel-URL" className="bg-brand-primary border border-brand-accent/50 rounded-md p-3 sm:col-span-2" /></div>
                <div className="space-y-4"><input type="text" name="address.street" value={data.address.street} onChange={handleDataChange} placeholder="Straße & Nr." className="bg-brand-primary border border-brand-accent/50 rounded-md p-3 w-full" /><div className="grid grid-cols-3 gap-4"><input type="text" name="address.postalCode" value={data.address.postalCode} onChange={handleDataChange} placeholder="PLZ" className="bg-brand-primary border border-brand-accent/50 rounded-md p-3" /><input type="text" name="address.city" value={data.address.city} onChange={handleDataChange} placeholder="Stadt" className="bg-brand-primary border border-brand-accent/50 rounded-md p-3 col-span-2" /></div></div>
                <input type="text" name="hours" value={data.hours} onChange={handleDataChange} placeholder="Öffnungszeiten (z.B. Mo-Fr 09-17 Uhr)" className="bg-brand-primary border border-brand-accent/50 rounded-md p-3 w-full" />
                <div className="space-y-3">
                    <label className="block text-sm font-medium text-brand-text-secondary">Social Media</label>
                    {data.socials.map(social => (<div key={social.id} className="flex items-center gap-2"><select value={social.type} onChange={e => handleSocialChange(social.id, 'type', e.target.value)} className="bg-brand-primary border border-brand-accent/50 rounded-md p-3"><option value="linkedin">LinkedIn</option><option value="instagram">Instagram</option><option value="facebook">Facebook</option><option value="x">X (Twitter)</option><option value="youtube">YouTube</option><option value="tiktok">TikTok</option><option value="github">GitHub</option><option value="xing">Xing</option></select><input type="url" value={social.url} onChange={e => handleSocialChange(social.id, 'url', e.target.value)} placeholder="Profil-URL" className="flex-grow bg-brand-primary border border-brand-accent/50 rounded-md p-3" /><button onClick={() => removeSocial(social.id)} className="p-2 bg-red-600 rounded-full text-white hover:bg-red-700 flex-shrink-0"><IconTrash className="w-4 h-4" /></button></div>))}
                    <button onClick={addSocial} className="flex items-center space-x-2 text-sm text-brand-accent hover:text-brand-accent-hover font-medium"><IconPlusCircle className="w-5 h-5"/><span>Social-Link hinzufügen</span></button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><input type="url" name="legal.imprint" value={data.legal.imprint} onChange={handleDataChange} placeholder="Impressum-URL" className="bg-brand-primary border border-brand-accent/50 rounded-md p-3" /><input type="url" name="legal.privacy" value={data.legal.privacy} onChange={handleDataChange} placeholder="Datenschutz-URL" className="bg-brand-primary border border-brand-accent/50 rounded-md p-3" /></div>
            
                <div className="pt-6 border-t border-brand-primary">
                    <h2 className="text-2xl font-bold mb-4">3. Exportieren</h2>
                    <div className="space-y-3">
                        <button onClick={handleDownloadHtml} className="w-full flex items-center justify-center gap-2 bg-brand-accent text-white font-bold rounded-lg p-3 hover:bg-brand-accent-hover transition-colors">
                            <IconDownload className="w-5 h-5"/> Download .html (Komplett)
                        </button>
                        <button onClick={handleCopyHtml} className="w-full flex items-center justify-center gap-2 bg-brand-secondary text-brand-text font-bold rounded-lg p-3 hover:bg-brand-primary transition-colors">
                           <IconCopy className="w-5 h-5"/> Code kopieren (Komplett)
                        </button>
                        <button onClick={handleCopyHtmlOnly} className="w-full flex items-center justify-center gap-2 bg-brand-secondary text-brand-text font-bold rounded-lg p-3 hover:bg-brand-primary transition-colors">
                           <IconCopy className="w-5 h-5"/> Nur HTML kopieren
                        </button>
                        <button onClick={handleCopyCssOnly} className="w-full flex items-center justify-center gap-2 bg-brand-secondary text-brand-text font-bold rounded-lg p-3 hover:bg-brand-primary transition-colors">
                           <IconCopy className="w-5 h-5"/> Nur CSS kopieren
                        </button>
                         <button onClick={handleDownloadVCard} className="w-full flex items-center justify-center gap-2 bg-brand-secondary text-brand-text font-bold rounded-lg p-3 hover:bg-brand-primary transition-colors">
                           <IconVCard className="w-5 h-5"/> Download .vcf
                        </button>
                    </div>
                </div>
            </div>
            <div>
                <div className="sticky top-20">
                    <h2 className="text-2xl font-bold mb-6 text-center">Live-Vorschau</h2>
                    <ConnectCardPreview data={data} />
                </div>
            </div>
        </div>
    );
};
