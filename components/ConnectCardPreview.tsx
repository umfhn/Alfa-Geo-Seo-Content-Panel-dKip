import React, { useMemo } from 'react';
import type { ConnectCardData, SocialType } from '../types';
import { 
    IconWebsite, IconPhone, IconMail, IconVCard, IconCopy, IconBuilding, IconClock, 
    IconLinkedIn, IconInstagram 
} from './Icons';

interface ConnectCardPreviewProps {
    data: ConnectCardData;
}

const socialIcons: Record<SocialType, React.FC<{ className?: string }>> = {
    linkedin: IconLinkedIn,
    instagram: IconInstagram,
    facebook: IconLinkedIn, // Placeholder
    x: IconLinkedIn, // Placeholder
    youtube: IconLinkedIn, // Placeholder
    tiktok: IconLinkedIn, // Placeholder
    github: IconLinkedIn, // Placeholder
    xing: IconLinkedIn, // Placeholder
};

const ActionButton: React.FC<{ icon: React.ReactNode, label: string, href?: string, sideIcon?: React.ReactNode }> = ({ icon, label, href, sideIcon }) => (
    <a href={href || '#'} target="_blank" rel="noopener noreferrer" className="bg-brand-secondary hover:bg-brand-primary transition-colors p-3 rounded-lg flex items-center w-full text-left">
        <div className="w-6 h-6 mr-3">{icon}</div>
        <span className="flex-grow font-medium">{label}</span>
        {sideIcon && <div className="w-6 h-6 ml-3 text-brand-text-secondary">{sideIcon}</div>}
    </a>
);

const InfoLine: React.FC<{ icon: React.ReactNode, text: string }> = ({ icon, text }) => (
    <div className="flex items-center text-sm">
        <div className="w-5 h-5 mr-3 text-brand-text-secondary">{icon}</div>
        <span>{text}</span>
    </div>
);

export const ConnectCardPreview: React.FC<ConnectCardPreviewProps> = ({ data }) => {
    const { name, tagline, url, phone, email, address, hours, socials, legal, qrUrl, features } = data;

    const qrCodeUrl = useMemo(() => {
        if (!qrUrl) return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://example.com&bgcolor=0D0D1A&color=FFFFFF&qzone=1`;
        return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}&bgcolor=0D0D1A&color=FFFFFF&qzone=1`;
    }, [qrUrl]);

    const fullAddress = [address.street, address.city].filter(Boolean).join(', ');

    return (
        <div className="bg-brand-primary text-brand-text rounded-2xl border-2 border-brand-secondary max-w-sm mx-auto shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="space-y-4 py-4 px-4">
                {/* Header */}
                <div className="text-center">
                    <h2 className="text-2xl font-bold">{name || "Muster GmbH"}</h2>
                    <p className="text-brand-text-secondary text-sm">{tagline || "Automatisierung einfach gemacht"}</p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                    {features.website && url && <ActionButton icon={<IconWebsite />} label="Website öffnen" href={url} />}
                    {features.call && phone && <ActionButton icon={<IconPhone />} label="Anrufen" href={`tel:${phone}`} sideIcon={<IconCopy />} />}
                    {features.email && email && <ActionButton icon={<IconMail />} label="E-Mail senden" href={`mailto:${email}`} sideIcon={<IconCopy />} />}
                    {features.vcard && name && <ActionButton icon={<IconVCard />} label="vCard herunterladen" />}
                </div>

                {/* QR Code */}
                {features.qr && qrUrl && (
                     <div className="bg-white p-3 rounded-xl mx-auto max-w-[200px]">
                        <img src={qrCodeUrl} alt={`QR Code für ${name}`} width="200" height="200" />
                    </div>
                )}
               
                {/* Copy Link */}
                {features.copyLink && url && (
                    <button className="bg-brand-secondary hover:bg-brand-primary transition-colors p-3 rounded-lg flex items-center w-full text-left">
                        <div className="w-6 h-6 mr-3"><IconCopy /></div>
                        <span className="flex-grow font-medium">Link kopieren</span>
                    </button>
                )}
                
                <hr className="border-brand-secondary" />
                
                {/* Info Section */}
                <div className="space-y-3">
                    {features.address && fullAddress && <InfoLine icon={<IconBuilding />} text={fullAddress} />}
                    {features.hours && hours && <InfoLine icon={<IconClock />} text={hours} />}
                </div>
                
                {/* Socials */}
                {features.socials && socials.length > 0 && (
                    <div className="flex justify-center items-center space-x-4 pt-2">
                        {socials.map(social => {
                            const IconComponent = socialIcons[social.type];
                            return (
                                <a key={social.id} href={social.url} target="_blank" rel="noopener noreferrer" className="text-brand-text-secondary hover:text-white transition-colors">
                                    <IconComponent className="w-8 h-8" />
                                </a>
                            );
                        })}
                    </div>
                )}

                {/* Footer */}
                {features.legal && (legal.imprint || legal.privacy) && (
                    <div className="text-center text-xs text-brand-text-secondary pt-2 border-t border-brand-secondary">
                        <p className="font-semibold">{name || "Muster GmbH & Co. KG"}</p>
                        <p>
                            {legal.imprint && <a href={legal.imprint} className="hover:underline">Impressum</a>}
                            {legal.imprint && legal.privacy && ' · '}
                            {legal.privacy && <a href={legal.privacy} className="hover:underline">Datenschutz</a>}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};