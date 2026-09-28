'use client';
import { useLanguage } from '@/context/LanguageContext';
import { Globe } from 'lucide-react';
import './LanguageToggle.css';

export default function LanguageToggle({ className = '', showLabel = false }) {
    const { lang, toggleLang, setLang } = useLanguage();

    const toggleTitle = lang === 'fr' 
        ? 'Passer en anglais (Switch to English)' 
        : 'Passer en français (Switch to French)';

    const handleWrapClick = (e) => {
        e.preventDefault();
        toggleLang();
    };

    const handleOptionClick = (targetLang, e) => {
        e.stopPropagation();
        if (targetLang !== lang) {
            setLang(targetLang);
        } else {
            toggleLang();
        }
    };

    if (showLabel) {
        return (
            <div 
                className={`drawer-lang-toggle ${className}`}
                onClick={handleWrapClick}
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
                    <div className={`lang-toggle-slider ${lang === 'fr' ? 'is-fr' : 'is-en'}`} />
                    <span className={`lang-toggle-option ${lang === 'fr' ? 'is-active' : ''}`}>FR</span>
                    <span className={`lang-toggle-option ${lang === 'en' ? 'is-active' : ''}`}>EN</span>
                </div>
            </div>
        );
    }

    return (
        <div
            role="button"
            tabIndex={0}
            className={`lang-toggle-wrap ${className}`}
            onClick={handleWrapClick}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleLang();
                }
            }}
            title={toggleTitle}
            aria-label={toggleTitle}
        >
            <div className={`lang-toggle-slider ${lang === 'fr' ? 'is-fr' : 'is-en'}`} />
            <span 
                className={`lang-toggle-option ${lang === 'fr' ? 'is-active' : ''}`}
                onClick={(e) => handleOptionClick('fr', e)}
            >
                FR
            </span>
            <span 
                className={`lang-toggle-option ${lang === 'en' ? 'is-active' : ''}`}
                onClick={(e) => handleOptionClick('en', e)}
            >
                EN
            </span>
        </div>
    );
}
