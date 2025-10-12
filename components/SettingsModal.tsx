import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import type { Sixpack, VCardData, Meta, Geo } from '../types';
import { IconDownload, IconCopy, IconVCard } from './Icons';
import { useSpeechVoices } from '../hooks/useSpeechVoices';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sixpack: Sixpack | null;
}

type ActiveTab = 'impressum' | 'vcard' | 'tts';
const VOICE_STORAGE_KEY = 'tts_selected_voice_uri';

const generateImpressumText = (meta: Meta | undefined, geo: Geo | undefined): string => {
    const company = meta?.companyName || (geo?.branch ? `[Firma für ${geo.branch}]` : '[Firma/Name]');
    const street = meta?.street || '[Straße Hausnummer]';
    const zip = geo?.zip || '[PLZ]';
    const city = geo?.city || '[Stadt]';
    const representatives = meta?.representatives?.join(', ') || '[Vertreten durch]';
    const phone = meta?.phone || '[Telefonnummer]';
    const fax = meta?.fax || '[Faxnummer]';
    const email = meta?.email || '[E-Mail-Adresse]';
    const taxId = meta?.taxId || '[DE999999999]';

    return `Impressum

Angaben gemäß § 5 TMG

${company}
${street}
${zip} ${city}

Vertreten durch:
${representatives}

Kontakt:
Telefon: ${phone}
${fax ? `Fax: ${fax}\n` : ''}E-Mail: ${email}

Umsatzsteuer-ID:
Umsatzsteuer-Identifikationsnummer gemäß §27a Umsatzsteuergesetz: ${taxId}

Haftungsausschluss: ...
`;
};


export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, sixpack }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('impressum');
  const [impressumText, setImpressumText] = useState(() => generateImpressumText(undefined, undefined));
  const [vCardData, setVCardData] = useState<VCardData>({
    company: '', branch: '', phone: '', email: '', website: '', street: '', city: '', region: '', zip: '',
  });

  const voices = useSpeechVoices();
  const [selectedVoice, setSelectedVoice] = useState('');

  useEffect(() => {
    const storedVoice = localStorage.getItem(VOICE_STORAGE_KEY);
    if (storedVoice) {
      setSelectedVoice(storedVoice);
    } else if (voices.length > 0) {
      const defaultGermanVoice = voices.find(v => v.lang.startsWith('de') && v.default) || voices.find(v => v.lang.startsWith('de')) || voices[0];
      if (defaultGermanVoice) {
        setSelectedVoice(defaultGermanVoice.voiceURI);
        localStorage.setItem(VOICE_STORAGE_KEY, defaultGermanVoice.voiceURI);
      }
    }
  }, [voices]);


  useEffect(() => {
    if (isOpen && sixpack) {
      const { meta, geo, topic } = sixpack;
      
      setVCardData({
        company: meta?.companyName || topic || '',
        branch: geo.branch || '',
        phone: meta?.phone || '',
        email: meta?.email || '',
        website: meta?.website || '',
        street: meta?.street || '',
        city: geo.city || '',
        region: geo.region || '',
        zip: geo.zip || '',
      });

      setImpressumText(generateImpressumText(meta, geo));
    }
  }, [isOpen, sixpack]);

  const handleVCardChange = (e: ChangeEvent<HTMLInputElement>) => {
    setVCardData({ ...vCardData, [e.target.name]: e.target.value });
  };
  
  const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const voiceURI = e.target.value;
    setSelectedVoice(voiceURI);
    localStorage.setItem(VOICE_STORAGE_KEY, voiceURI);
  };

  const handleDownloadImpressum = useCallback(() => {
    const blob = new Blob([impressumText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'impressum.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [impressumText]);
  
  const handleCopyImpressum = useCallback(() => {
    navigator.clipboard.writeText(impressumText).then(() => {
      alert('Impressum wurde in die Zwischenablage kopiert!');
    }).catch(err => {
      console.error('Kopieren fehlgeschlagen: ', err);
      alert('Kopieren fehlgeschlagen.');
    });
  }, [impressumText]);

  const handleDownloadVCard = () => {
    const { company, branch, phone, email, website, street, city, region, zip } = vCardData;
    const vCardString = `BEGIN:VCARD
VERSION:3.0
N:;${company};;;
FN:${company}
ORG:${company}
TITLE:${branch}
TEL;TYPE=WORK,VOICE:${phone}
ADR;TYPE=WORK:;;${street};${city};${region};${zip};
EMAIL:${email}
URL:${website}
END:VCARD`;

    const blob = new Blob([vCardString], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${company.toLowerCase().replace(/\s/g, '_') || 'kontakt'}.vcf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-brand-primary/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-brand-secondary rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-brand-accent/20">
          <h2 className="text-xl font-bold">Einstellungen & Export</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-brand-primary" aria-label="Schließen">&times;</button>
        </div>
        
        <div className="p-2 bg-brand-primary/50">
            <div className="flex space-x-1">
                <button onClick={() => setActiveTab('vcard')} className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${activeTab === 'vcard' ? 'bg-brand-accent text-white' : 'text-brand-text-secondary hover:bg-brand-secondary'}`}>
                    vCard
                </button>
                <button onClick={() => setActiveTab('impressum')} className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${activeTab === 'impressum' ? 'bg-brand-accent text-white' : 'text-brand-text-secondary hover:bg-brand-secondary'}`}>
                    Impressum
                </button>
                 <button onClick={() => setActiveTab('tts')} className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${activeTab === 'tts' ? 'bg-brand-accent text-white' : 'text-brand-text-secondary hover:bg-brand-secondary'}`}>
                    Sprachausgabe
                </button>
            </div>
        </div>

        <div className="p-6 overflow-y-auto">
            {activeTab === 'impressum' && (
                <div>
                    <h3 className="text-lg font-semibold mb-2">Impressum-Vorlage</h3>
                    <p className="text-sm text-brand-text-secondary mb-4">Bearbeiten, kopieren oder laden Sie die Vorlage herunter.</p>
                    <textarea 
                        value={impressumText}
                        onChange={(e) => setImpressumText(e.target.value)}
                        rows={12}
                        className="w-full bg-brand-primary border border-brand-accent/50 rounded-md p-3 font-mono text-sm focus:ring-2 focus:ring-brand-accent focus:outline-none transition"
                    />
                    <div className="flex space-x-4 mt-4">
                        <button onClick={handleCopyImpressum} className="flex-1 flex items-center justify-center space-x-2 bg-brand-secondary px-4 py-2 rounded-lg hover:bg-brand-accent-hover transition-colors">
                            <IconCopy className="w-5 h-5"/>
                            <span>Kopieren</span>
                        </button>
                        <button onClick={handleDownloadImpressum} className="flex-1 flex items-center justify-center space-x-2 bg-brand-secondary px-4 py-2 rounded-lg hover:bg-brand-accent-hover transition-colors">
                            <IconDownload className="w-5 h-5"/>
                            <span>Download .txt</span>
                        </button>
                    </div>
                </div>
            )}
            {activeTab === 'vcard' && (
                <div>
                    <h3 className="text-lg font-semibold mb-2">Digitale Visitenkarte (.vcf)</h3>
                    <p className="text-sm text-brand-text-secondary mb-4">Daten bearbeiten und als VCF-Datei für Ihre Kontakte exportieren.</p>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="vcard-company" className="block text-xs font-medium text-brand-text-secondary mb-1">Firma / Name</label>
                                <input id="vcard-company" type="text" name="company" value={vCardData.company} onChange={handleVCardChange} placeholder="Firma / Name" className="w-full bg-brand-primary border border-brand-accent/50 rounded-md p-3 focus:ring-2 focus:ring-brand-accent focus:outline-none transition" />
                            </div>
                            <div>
                                <label htmlFor="vcard-branch" className="block text-xs font-medium text-brand-text-secondary mb-1">Branche / Titel</label>
                                <input id="vcard-branch" type="text" name="branch" value={vCardData.branch} onChange={handleVCardChange} placeholder="Branche / Titel" className="w-full bg-brand-primary border border-brand-accent/50 rounded-md p-3 focus:ring-2 focus:ring-brand-accent focus:outline-none transition" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="vcard-phone" className="block text-xs font-medium text-brand-text-secondary mb-1">Telefon</label>
                                <input id="vcard-phone" type="tel" name="phone" value={vCardData.phone} onChange={handleVCardChange} placeholder="Telefon" className="w-full bg-brand-primary border border-brand-accent/50 rounded-md p-3 focus:ring-2 focus:ring-brand-accent focus:outline-none transition" />
                            </div>
                            <div>
                                <label htmlFor="vcard-email" className="block text-xs font-medium text-brand-text-secondary mb-1">E-Mail</label>
                                <input id="vcard-email" type="email" name="email" value={vCardData.email} onChange={handleVCardChange} placeholder="E-Mail" className="w-full bg-brand-primary border border-brand-accent/50 rounded-md p-3 focus:ring-2 focus:ring-brand-accent focus:outline-none transition" />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="vcard-website" className="block text-xs font-medium text-brand-text-secondary mb-1">Webseite</label>
                            <input id="vcard-website" type="url" name="website" value={vCardData.website} onChange={handleVCardChange} placeholder="Webseite" className="w-full bg-brand-primary border border-brand-accent/50 rounded-md p-3 focus:ring-2 focus:ring-brand-accent focus:outline-none transition" />
                        </div>
                        <div>
                            <label htmlFor="vcard-street" className="block text-xs font-medium text-brand-text-secondary mb-1">Straße & Hausnummer</label>
                            <input id="vcard-street" type="text" name="street" value={vCardData.street} onChange={handleVCardChange} placeholder="Straße & Hausnummer" className="w-full bg-brand-primary border border-brand-accent/50 rounded-md p-3 focus:ring-2 focus:ring-brand-accent focus:outline-none transition" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label htmlFor="vcard-city" className="block text-xs font-medium text-brand-text-secondary mb-1">Stadt</label>
                                <input id="vcard-city" type="text" name="city" value={vCardData.city} onChange={handleVCardChange} placeholder="Stadt" className="w-full bg-brand-primary border border-brand-accent/50 rounded-md p-3 focus:ring-2 focus:ring-brand-accent focus:outline-none transition" />
                            </div>
                            <div>
                                <label htmlFor="vcard-region" className="block text-xs font-medium text-brand-text-secondary mb-1">Bundesland</label>
                                <input id="vcard-region" type="text" name="region" value={vCardData.region} onChange={handleVCardChange} placeholder="Bundesland" className="w-full bg-brand-primary border border-brand-accent/50 rounded-md p-3 focus:ring-2 focus:ring-brand-accent focus:outline-none transition" />
                            </div>
                            <div>
                                <label htmlFor="vcard-zip" className="block text-xs font-medium text-brand-text-secondary mb-1">PLZ</label>
                                <input id="vcard-zip" type="text" name="zip" value={vCardData.zip} onChange={handleVCardChange} placeholder="PLZ" className="w-full bg-brand-primary border border-brand-accent/50 rounded-md p-3 focus:ring-2 focus:ring-brand-accent focus:outline-none transition" />
                            </div>
                        </div>
                    </div>
                     <div className="mt-6">
                        <button onClick={handleDownloadVCard} className="w-full flex items-center justify-center space-x-2 bg-brand-accent px-4 py-3 text-white font-bold rounded-lg hover:bg-brand-accent-hover transition-colors">
                            <IconVCard className="w-5 h-5"/>
                            <span>vCard (.vcf) herunterladen</span>
                        </button>
                    </div>
                </div>
            )}
            {activeTab === 'tts' && (
                <div>
                    <h3 className="text-lg font-semibold mb-2">Stimme für Sprachausgabe</h3>
                    <p className="text-sm text-brand-text-secondary mb-4">Wählen Sie die Stimme, die für das Vorlesen der Zusammenfassungen verwendet wird.</p>
                    <select
                        value={selectedVoice}
                        onChange={handleVoiceChange}
                        className="w-full bg-brand-primary border border-brand-accent/50 rounded-md p-3 focus:ring-2 focus:ring-brand-accent focus:outline-none transition"
                        disabled={voices.length === 0}
                        aria-label="Stimme für Sprachausgabe auswählen"
                    >
                        {voices.length > 0 ? (
                            voices.map(voice => (
                                <option key={voice.voiceURI} value={voice.voiceURI}>
                                    {voice.name} ({voice.lang})
                                </option>
                            ))
                        ) : (
                            <option>Stimmen werden geladen...</option>
                        )}
                    </select>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};