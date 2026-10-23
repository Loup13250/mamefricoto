'use client';
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { DICTIONARY } from './dictionary';

const LanguageContext = createContext({
    lang: 'fr',
    setLang: () => {},
    toggleLang: () => {},
    t: (key) => key,
    trans: (obj, field) => obj?.[field] || '',
});

export function LanguageProvider({ children, initialLang = 'fr', overrides = null }) {
    // Always start with 'fr' to prevent SSR/client hydration mismatch.
    // The useEffect below will immediately correct the lang after mount
    // based on localStorage and browser language preferences.
    const [lang, setLangState] = useState(initialLang);
    const [mounted, setMounted] = useState(false);

    // Run once after mount: detect language from storage or browser prefs
    useEffect(() => {
        const raf = requestAnimationFrame(() => {
            setMounted(true);
            try {
                const saved = localStorage.getItem('mamefricoto-lang');
                if (saved === 'en' || saved === 'fr') {
                    setLangState(saved);
                    document.documentElement.lang = saved;
                    return;
                }

                // Premier accès sans choix manuel enregistré
                const navLangs = navigator.languages || [navigator.language || ''];
                const firstLang = (navLangs[0] || '').toLowerCase();
                const autoLang = firstLang.startsWith('fr') ? 'fr' : 'en';

                setLangState(autoLang);
                document.documentElement.lang = autoLang;
                document.cookie = `mamefricoto-lang=${autoLang}; path=/; max-age=31536000; SameSite=Lax`;
            } catch {}
        });
        return () => cancelAnimationFrame(raf);
    }, []);

    // Sync document.documentElement.lang whenever lang changes after mount
    useEffect(() => {
        if (!mounted) return;
        try {
            document.documentElement.lang = lang;
        } catch {}
    }, [lang, mounted]);

    const setLang = useCallback((newLang) => {
        const validLang = newLang === 'en' ? 'en' : 'fr';
        setLangState(validLang);
        try {
            localStorage.setItem('mamefricoto-lang', validLang);
            document.cookie = `mamefricoto-lang=${validLang}; path=/; max-age=31536000; SameSite=Lax`;
            document.documentElement.lang = validLang;
        } catch {}
    }, []);

    const toggleLang = useCallback(() => {
        setLang(lang === 'fr' ? 'en' : 'fr');
    }, [lang, setLang]);

    const t = useCallback((key, params = {}) => {
        const dict = DICTIONARY[lang] || DICTIONARY.fr;
        // Priorité : texte personnalisé dans l'admin > dictionnaire de la langue > français
        const custom = overrides?.[lang]?.[key];
        let str = (typeof custom === 'string' && custom !== '' ? custom : null) || dict[key] || DICTIONARY.fr[key] || key;
        if (params && typeof params === 'object') {
            for (const [pKey, pVal] of Object.entries(params)) {
                str = str.replace(new RegExp(`\\{${pKey}\\}`, 'g'), pVal);
            }
        }
        return str;
    }, [lang, overrides]);

    const trans = useCallback((obj, field) => {
        if (!obj) return '';
        if (lang === 'en') {
            const enVal = obj[field + '_en'];
            if (enVal && typeof enVal === 'string' && enVal.trim() !== '') {
                return enVal;
            }
        }
        return obj[field] || '';
    }, [lang]);

    const value = useMemo(() => ({
        lang,
        setLang,
        toggleLang,
        t,
        trans,
    }), [lang, setLang, toggleLang, t, trans]);

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    return useContext(LanguageContext);
}
