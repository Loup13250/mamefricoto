'use client';
import { useLanguage } from '@/context/LanguageContext';
import { Globe } from 'lucide-react';
import './LanguageToggle.css';

export default function LanguageToggle({ className = '', showLabel = false }) {
    const { lang, setLang } = useLanguage();

    if (showLabel) {
        return (
            <div className={`drawer-lang-toggle ${className}`}>
                <span className="drawer-lang-label">
                    <Globe size={16} style={{ color: 'var(--gold)' }} />
                    <span>{lang === 'fr' ? 'Langue / Language' : 'Language / Langue'}</span>
                </span>
                <div className="lang-toggle-wrap" role="radiogroup" aria-label="Choisir la langue">
                    <button
                        type="button"
                        role="radio"
                        aria-checked={lang === 'fr'}
                        className={`lang-toggle-btn ${lang === 'fr' ? 'is-active' : ''}`}
                        onClick={() => setLang('fr')}
                        title="Passer le site en Français"
                    >
                        <span className="lang-flag">🇫🇷</span> FR
                    </button>
                    <button
                        type="button"
                        role="radio"
                        aria-checked={lang === 'en'}
                        className={`lang-toggle-btn ${lang === 'en' ? 'is-active' : ''}`}
                        onClick={() => setLang('en')}
                        title="Switch website to English"
                    >
                        <span className="lang-flag">🇬🇧</span> EN
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`lang-toggle-wrap ${className}`} role="radiogroup" aria-label="Langue du site / Website language">
            <button
                type="button"
                role="radio"
                aria-checked={lang === 'fr'}
                className={`lang-toggle-btn ${lang === 'fr' ? 'is-active' : ''}`}
                onClick={() => setLang('fr')}
                title="Afficher en Français"
                aria-label="Français"
            >
                FR
            </button>
            <button
                type="button"
                role="radio"
                aria-checked={lang === 'en'}
                className={`lang-toggle-btn ${lang === 'en' ? 'is-active' : ''}`}
                onClick={() => setLang('en')}
                title="Switch to English"
                aria-label="English"
            >
                EN
            </button>
        </div>
    );
}
