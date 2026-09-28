'use client';
import { useLanguage } from '@/context/LanguageContext';
import { Globe } from 'lucide-react';
import './LanguageToggle.css';

export default function LanguageToggle({ className = '', showLabel = false }) {
    const { lang, toggleLang } = useLanguage();

    const toggleTitle = lang === 'fr' 
        ? 'Passer le site en anglais (Switch to English)' 
        : 'Passer le site en français (Switch to French)';

    if (showLabel) {
        return (
            <div 
                className={`drawer-lang-toggle ${className}`}
                onClick={toggleLang}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleLang();
                    }
                }}
                title={toggleTitle}
                aria-label={toggleTitle}
            >
                <span className="drawer-lang-label">
                    <Globe size={16} style={{ color: 'var(--gold)' }} />
                    <span>{lang === 'fr' ? 'Langue / Language' : 'Language / Langue'}</span>
                </span>
                <div className="lang-toggle-wrap" aria-hidden="true">
                    <span className={`lang-toggle-btn ${lang === 'fr' ? 'is-active' : ''}`}>
                        <span className="lang-flag">🇫🇷</span> FR
                    </span>
                    <span className={`lang-toggle-btn ${lang === 'en' ? 'is-active' : ''}`}>
                        <span className="lang-flag">🇬🇧</span> EN
                    </span>
                </div>
            </div>
        );
    }

    return (
        <button
            type="button"
            className={`lang-toggle-wrap ${className}`}
            onClick={toggleLang}
            title={toggleTitle}
            aria-label={toggleTitle}
        >
            <span className={`lang-toggle-btn ${lang === 'fr' ? 'is-active' : ''}`}>
                FR
            </span>
            <span className={`lang-toggle-btn ${lang === 'en' ? 'is-active' : ''}`}>
                EN
            </span>
        </button>
    );
}
