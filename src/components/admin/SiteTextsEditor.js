'use client';

/**
 * SiteTextsEditor - modification des textes du site, en français ET en anglais
 * ----------------------------------------------------------------------------
 * Chaque champ est pré-rempli avec le texte actuellement affiché sur le site
 * (texte d'origine ou texte déjà personnalisé). Enregistrer = le site public est
 * mis à jour dans les deux langues. "Rétablir" = retour au texte d'origine.
 */

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import {
    Save,
    Loader2,
    CheckCircle2,
    AlertCircle,
    RotateCcw,
    ChevronDown,
    Search,
    ExternalLink,
    Undo2,
    Sparkles,
} from 'lucide-react';
import { DICTIONARY } from '@/context/dictionary';
import { getTextLabel } from '@/lib/siteTexts';
import { saveSiteTexts } from '@/app/actions';
import './SiteTextsEditor.css';

const LANGS = [
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
];

const defaultOf = (lang, key) => DICTIONARY[lang]?.[key] ?? DICTIONARY.fr[key] ?? '';

const normalize = (s) =>
    String(s || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

const placeholdersOf = (text) => (String(text).match(/\{[a-zA-Z]+\}/g) || []);

function buildInitialValues(sections, overrides) {
    const values = { fr: {}, en: {} };
    sections.forEach((section) => {
        section.keys.forEach((key) => {
            LANGS.forEach(({ code }) => {
                values[code][key] = overrides?.[code]?.[key] ?? defaultOf(code, key);
            });
        });
    });
    return values;
}

function TextField({ id, value, onChange, defaultText, lang }) {
    const isLong = defaultText.length > 70 || defaultText.includes('\n') || value.length > 90 || value.includes('\n');
    const common = {
        id,
        value,
        lang,
        onChange: (e) => onChange(e.target.value),
        placeholder: defaultText,
        spellCheck: true,
    };
    if (isLong) {
        const rows = Math.min(8, Math.max(3, Math.ceil(Math.max(value.length, defaultText.length) / 55)));
        return <textarea {...common} rows={rows} className="admin-textarea st-field" />;
    }
    return <input type="text" {...common} className="admin-input st-field" />;
}

export default function SiteTextsEditor({
    sections,
    overrides = { fr: {}, en: {} },
    searchable = false,
    collapsible = false,
    defaultOpenFirst = false,
}) {
    const [prevOverrides, setPrevOverrides] = useState(overrides);
    const [values, setValues] = useState(() => buildInitialValues(sections, overrides));
    const [saved, setSaved] = useState(() => buildInitialValues(sections, overrides));

    if (prevOverrides !== overrides) {
        setPrevOverrides(overrides);
        const fresh = buildInitialValues(sections, overrides);
        setSaved(fresh);
        setValues(fresh);
    }

    const [open, setOpen] = useState(() => {
        const init = {};
        sections.forEach((s, i) => { init[s.id] = !collapsible || (defaultOpenFirst && i === 0); });
        return init;
    });
    const [query, setQuery] = useState('');
    const [isPending, startTransition] = useTransition();
    const [feedback, setFeedback] = useState(null); // { type: 'ok' | 'error', text }

    const allKeys = useMemo(() => sections.flatMap((s) => s.keys), [sections]);

    const changedKeys = useMemo(
        () => allKeys.filter((key) => LANGS.some(({ code }) => values[code][key] !== saved[code][key])),
        [allKeys, values, saved],
    );
    const dirty = changedKeys.length > 0;

    const isCustom = (key) => LANGS.some(({ code }) => values[code][key] !== defaultOf(code, key));

    const setValue = (lang, key, text) => {
        setFeedback(null);
        setValues((prev) => ({ ...prev, [lang]: { ...prev[lang], [key]: text } }));
    };

    const resetKey = (key) => {
        setFeedback(null);
        setValues((prev) => ({
            fr: { ...prev.fr, [key]: defaultOf('fr', key) },
            en: { ...prev.en, [key]: defaultOf('en', key) },
        }));
    };

    const discardChanges = () => {
        setFeedback(null);
        setValues(saved);
    };

    const handleSave = () => {
        // Vérifie qu'on n'a pas supprimé un repère du type {phone}
        for (const key of changedKeys) {
            for (const { code } of LANGS) {
                const missing = placeholdersOf(defaultOf(code, key)).filter((p) => !values[code][key].includes(p));
                if (missing.length && values[code][key].trim() !== '') {
                    setFeedback({ type: 'error', text: `« ${getTextLabel(key)} » (${code.toUpperCase()}) doit conserver ${missing.join(', ')} : il est remplacé automatiquement sur le site.` });
                    return;
                }
            }
        }

        const updates = { fr: {}, en: {} };
        changedKeys.forEach((key) => {
            LANGS.forEach(({ code }) => {
                const val = values[code][key].trim();
                // Identique au texte d'origine (ou vide) = on retire la personnalisation
                updates[code][key] = val === '' || val === defaultOf(code, key) ? null : values[code][key];
            });
        });

        startTransition(async () => {
            try {
                const res = await saveSiteTexts(updates);
                if (res?.error) {
                    setFeedback({ type: 'error', text: res.error });
                    return;
                }
                // Un champ laissé vide retrouve son texte d'origine
                const next = { fr: { ...values.fr }, en: { ...values.en } };
                changedKeys.forEach((key) => {
                    LANGS.forEach(({ code }) => {
                        if (next[code][key].trim() === '') next[code][key] = defaultOf(code, key);
                    });
                });
                setValues(next);
                setSaved(next);
                setFeedback({ type: 'ok', text: 'Textes enregistrés - le site est mis à jour en français et en anglais.' });
                setTimeout(() => setFeedback((f) => (f?.type === 'ok' ? null : f)), 5000);
            } catch (err) {
                console.error(err);
                setFeedback({ type: 'error', text: "L'enregistrement a échoué. Vérifie ta connexion et réessaie." });
            }
        });
    };

    // Filtrage par recherche
    const q = normalize(query.trim());
    const visibleSections = sections
        .map((section) => ({
            ...section,
            visibleKeys: q
                ? section.keys.filter((key) =>
                    normalize([getTextLabel(key), key, values.fr[key], values.en[key], defaultOf('fr', key), defaultOf('en', key)].join(' ')).includes(q))
                : section.keys,
        }))
        .filter((s) => s.visibleKeys.length > 0);

    const customCount = allKeys.filter(isCustom).length;

    return (
        <div className="st-root">
            {(searchable || customCount > 0) && (
                <div className="st-toolbar">
                    {searchable && (
                        <label className="st-search">
                            <Search size={16} />
                            <input
                                type="search"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Rechercher un texte (ex : prestations, devis, téléphone…)"
                                aria-label="Rechercher un texte"
                            />
                        </label>
                    )}
                    {customCount > 0 && (
                        <span className="st-count" title="Textes différents de ceux d'origine">
                            <Sparkles size={13} /> {customCount} texte{customCount > 1 ? 's' : ''} personnalisé{customCount > 1 ? 's' : ''}
                        </span>
                    )}
                </div>
            )}

            {visibleSections.length === 0 && (
                <p className="st-empty">Aucun texte ne correspond à « {query} ».</p>
            )}

            {visibleSections.map((section) => {
                const isOpen = q ? true : open[section.id];
                const customInSection = section.keys.filter(isCustom).length;
                return (
                    <section key={section.id} className={`st-section ${isOpen ? 'is-open' : ''}`}>
                        <div className="st-section-head">
                            <button
                                type="button"
                                className="st-section-toggle"
                                onClick={() => collapsible && setOpen((prev) => ({ ...prev, [section.id]: !prev[section.id] }))}
                                aria-expanded={isOpen}
                                style={{ cursor: collapsible ? 'pointer' : 'default' }}
                            >
                                <span className="st-section-text">
                                    <strong>{section.title}</strong>
                                    {section.description && <em>{section.description}</em>}
                                </span>
                                {customInSection > 0 && <span className="st-pill">{customInSection} modifié{customInSection > 1 ? 's' : ''}</span>}
                                {collapsible && <ChevronDown size={18} className="st-chevron" />}
                            </button>
                            {section.href && (
                                <Link
                                    href={section.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="st-link"
                                >
                                    <ExternalLink size={13} /> Voir la page
                                </Link>
                            )}
                        </div>

                        {isOpen && (
                            <div className="st-items">
                                {section.visibleKeys.map((key) => {
                                    const custom = isCustom(key);
                                    const tokens = placeholdersOf(defaultOf('fr', key));
                                    return (
                                        <div key={key} className={`st-item ${custom ? 'is-custom' : ''}`}>
                                            <div className="st-item-head">
                                                <label htmlFor={`st-${key}-fr`}>{getTextLabel(key)}</label>
                                                {custom && (
                                                    <button type="button" className="st-reset" onClick={() => resetKey(key)} title="Revenir aux textes d'origine (FR et EN)">
                                                        <RotateCcw size={12} /> Rétablir l&apos;original
                                                    </button>
                                                )}
                                            </div>
                                            <div className="st-cols">
                                                {LANGS.map(({ code, label, flag }) => (
                                                    <div key={code} className="st-col">
                                                        <span className="st-lang"><span aria-hidden="true">{flag}</span> {label}</span>
                                                        <TextField
                                                            id={`st-${key}-${code}`}
                                                            lang={code}
                                                            value={values[code][key]}
                                                            defaultText={defaultOf(code, key)}
                                                            onChange={(text) => setValue(code, key, text)}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                            {tokens.length > 0 && (
                                                <p className="st-note">Conservez {tokens.join(', ')} : ce repère est remplacé automatiquement sur le site.</p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                );
            })}

            {/* Barre d'enregistrement */}
            <div className={`st-savebar ${dirty || feedback ? 'is-visible' : ''}`} role="status" aria-live="polite">
                {feedback ? (
                    <span className={`st-feedback ${feedback.type === 'ok' ? 'is-ok' : 'is-error'}`}>
                        {feedback.type === 'ok' ? <CheckCircle2 size={17} /> : <AlertCircle size={17} />}
                        {feedback.text}
                    </span>
                ) : (
                    <span className="st-dirty">
                        <span className="st-dot" /> {changedKeys.length} texte{changedKeys.length > 1 ? 's' : ''} modifié{changedKeys.length > 1 ? 's' : ''} - non enregistré{changedKeys.length > 1 ? 's' : ''}
                    </span>
                )}
                <div className="st-save-actions">
                    {dirty && (
                        <button type="button" className="admin-btn admin-btn-secondary st-btn" onClick={discardChanges} disabled={isPending}>
                            <Undo2 size={15} /> Annuler
                        </button>
                    )}
                    <button type="button" className="admin-btn admin-btn-primary st-btn" onClick={handleSave} disabled={isPending || !dirty}>
                        {isPending ? <Loader2 size={15} className="st-spin" /> : <Save size={15} />}
                        Enregistrer les textes
                    </button>
                </div>
            </div>
        </div>
    );
}
