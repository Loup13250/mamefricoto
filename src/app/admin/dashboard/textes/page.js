import { getSiteInfo } from '@/lib/data';
import { SITE_TEXT_GROUPS, getGroupKeys, parseCustomTexts, CUSTOM_TEXTS_KEY } from '@/lib/siteTexts';
import SiteTextsEditor from '@/components/admin/SiteTextsEditor';
import { Languages } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Textes du site | Admin Mamé Fricoto',
};

export default async function SiteTextsAdminPage() {
    const info = await getSiteInfo();
    const overrides = parseCustomTexts(info?.[CUSTOM_TEXTS_KEY]);

    const sections = SITE_TEXT_GROUPS.map((group) => ({
        id: group.id,
        title: group.title,
        description: group.description,
        href: group.href,
        keys: getGroupKeys(group),
    }));

    return (
        <div className="anim-fade" style={{ width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ marginBottom: '1.75rem' }}>
                <span className="label" style={{ display: 'block', marginBottom: '0.4rem' }}>Paramètres</span>
                <h1 className="title-md" style={{ color: 'var(--admin-text)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <Languages size={26} style={{ color: 'var(--admin-gold)' }} />
                    Textes du site
                </h1>
                <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.95rem', lineHeight: 1.55, maxWidth: '720px' }}>
                    Modifiez ici les titres et les textes de toutes les pages, <strong>en français et en anglais</strong>.
                    Ouvrez une page, changez le texte souhaité puis cliquez sur « Enregistrer les textes ».
                    Le bouton « Rétablir l&apos;original » redonne le texte d&apos;origine.
                </p>
            </div>

            <SiteTextsEditor sections={sections} overrides={overrides} searchable collapsible defaultOpenFirst={false} />
        </div>
    );
}
