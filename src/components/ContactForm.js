'use client';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { submitContactForm } from '@/app/actions';
import { useLanguage } from '@/context/LanguageContext';
import { Send, CheckCircle2, AlertCircle, Phone, Calendar, Users, Mail, User, PartyPopper, Building, HelpCircle, ShieldCheck } from 'lucide-react';
import './ContactForm.css';

function parseUrlEventType(typeParam) {
    if (!typeParam) return null;
    const lower = typeParam.toLowerCase();
    if (lower.includes('priv') || lower === 'private') return 'Événement Privé';
    if (lower.includes('entrep') || lower.includes('pro') || lower.includes('corp') || lower.includes('business')) return 'Entreprise';
    if (lower.includes('autr') || lower.includes('other')) return 'Autre';
    return null;
}

function ContactFormInner() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const { t } = useLanguage();

    const searchParams = useSearchParams();
    const typeParam = searchParams.get('type');
    const parsedUrlType = parseUrlEventType(typeParam);

    // Type sélectionné : initialisé depuis l'URL ou 'Événement Privé' par défaut
    const [prevTypeParam, setPrevTypeParam] = useState(typeParam);
    const [selectedEventType, setSelectedEventType] = useState(parsedUrlType || 'Événement Privé');

    // Ajustement de l'état pendant le rendu si le paramètre d'URL change (recommandé par React)
    if (prevTypeParam !== typeParam) {
        setPrevTypeParam(typeParam);
        if (parsedUrlType) {
            setSelectedEventType(parsedUrlType);
        }
    }

    // Défilement doux vers le formulaire quand on navigue depuis un lien externe ou le footer
    useEffect(() => {
        if (typeParam && typeof window !== 'undefined' && window.scrollY > 300) {
            const target = document.getElementById('label-prestation') || document.querySelector('.contact-card');
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [typeParam]);

    // Écoute directe des clics sur les prestations du footer même si on est déjà sur la page
    useEffect(() => {
        const handleCustom = (e) => {
            const parsed = parseUrlEventType(e.detail);
            if (parsed) {
                setSelectedEventType(parsed);
                if (typeof window !== 'undefined' && window.scrollY > 300) {
                    const target = document.getElementById('label-prestation') || document.querySelector('.contact-card');
                    if (target) {
                        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }
            }
        };
        window.addEventListener('mame:set-prestation', handleCustom);
        return () => window.removeEventListener('mame:set-prestation', handleCustom);
    }, []);

    const eventTypes = [
        { id: 'Événement Privé', labelKey: 'type.private', icon: <PartyPopper size={14} /> },
        { id: 'Entreprise', labelKey: 'type.pro', icon: <Building size={14} /> },
        { id: 'Autre', labelKey: 'type.other', icon: <HelpCircle size={14} /> },
    ];

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        const formData = new FormData(e.target);
        formData.set('event_type', selectedEventType);

        const nameVal = (formData.get('name') || '').toString().trim();
        const emailVal = (formData.get('email') || '').toString().trim();
        const phoneVal = (formData.get('phone') || '').toString().trim();
        const guestsVal = (formData.get('guests') || '').toString().trim();
        const messageVal = (formData.get('message') || '').toString().trim();

        // 1. Validation Nom
        if (!nameVal || nameVal.length < 2) {
            setError(t('contact.errorName') || 'Veuillez renseigner votre nom complet.');
            setLoading(false);
            return;
        }

        // 2. Validation Email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
        if (!emailVal || !emailRegex.test(emailVal)) {
            setError(t('contact.errorEmail') || 'Veuillez saisir une adresse email valide.');
            setLoading(false);
            return;
        }

        // 3. Validation Téléphone (si renseigné)
        if (phoneVal) {
            if (/[a-zA-Z]/.test(phoneVal) || !/^(\+?[0-9\s().-]{8,25})$/.test(phoneVal) || phoneVal.replace(/\D/g, '').length < 8) {
                setError(t('contact.errorPhone') || 'Veuillez saisir un numéro de téléphone valide (ex : 06 12 34 56 78).');
                setLoading(false);
                return;
            }
        }

        // 4. Validation Convives (si renseigné)
        if (guestsVal) {
            const num = parseInt(guestsVal, 10);
            if (isNaN(num) || num <= 0 || (/[a-zA-Z]/.test(guestsVal) && !/^\d+\s*(personnes|pers|pax|invités|guests)?$/i.test(guestsVal))) {
                setError(t('contact.errorGuests') || 'Veuillez indiquer un nombre de convives valide (ex : 20).');
                setLoading(false);
                return;
            }
        }

        // 5. Validation Message
        if (!messageVal || messageVal.length < 5) {
            setError(t('contact.errorMessage') || 'Veuillez préciser votre demande dans le message (au moins 5 caractères).');
            setLoading(false);
            return;
        }

        const res = await submitContactForm(formData);

        if (res?.error) {
            setError(res.error);
            setLoading(false);
        } else {
            setSuccess(true);
            setLoading(false);
            e.target.reset();
        }
    }

    return (
        <div className="contact-card anim-up">
            <div className="contact-form-header">
                <span className="label">{t('contact.formBadge')}</span>
                <h2>{t('contact.formTitle')}</h2>
                <p>{t('contact.formDesc')}</p>
            </div>

            {success && (
                <div className="form-alert alert-success" role="alert">
                    <CheckCircle2 size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                        <strong style={{ display: 'block', marginBottom: '0.25rem' }}>{t('contact.successTitle')}</strong>
                        {t('contact.successDesc')}
                    </div>
                </div>
            )}

            {error && (
                <div className="form-alert alert-error" role="alert">
                    <AlertCircle size={18} style={{ flexShrink: 0 }} />
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="contact-form" aria-label={t('contact.formTitle')}>
                {/* Champ piège anti-spam invisible */}
                <div style={{ display: 'none' }} aria-hidden="true">
                    <input type="text" name="_hp_check" tabIndex={-1} autoComplete="off" />
                </div>

                <div className="form-field">
                    <span className="form-label" id="label-prestation">{t('contact.typeLabel')}</span>
                    <div className="form-pills" role="radiogroup" aria-labelledby="label-prestation">
                        {eventTypes.map((type) => (
                            <button
                                key={type.id}
                                type="button"
                                role="radio"
                                aria-checked={selectedEventType === type.id}
                                onClick={() => setSelectedEventType(type.id)}
                                className={`form-pill ${selectedEventType === type.id ? 'active' : ''}`}
                            >
                                {type.icon}
                                {t(type.labelKey)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-field">
                        <label htmlFor="contact-name" className="form-label">
                            <User size={13} /> {t('contact.nameLabel')}
                        </label>
                        <input
                            id="contact-name"
                            type="text"
                            name="name"
                            required
                            minLength={2}
                            maxLength={100}
                            placeholder={t('contact.namePlaceholder')}
                            className="form-input"
                        />
                    </div>
                    <div className="form-field">
                        <label htmlFor="contact-phone" className="form-label">
                            <span className="form-label-title"><Phone size={13} /> {t('contact.phoneLabel')}</span>
                            <span className="form-label-optional">{t('contact.optionalBadge')}</span>
                        </label>
                        <input
                            id="contact-phone"
                            type="tel"
                            name="phone"
                            inputMode="tel"
                            pattern="[\+]?[0-9\s().-]{8,25}"
                            title={t('contact.errorPhone')}
                            placeholder={t('contact.phonePlaceholder')}
                            className="form-input"
                        />
                    </div>
                </div>

                <div className="form-field">
                    <label htmlFor="contact-email" className="form-label">
                        <Mail size={13} /> {t('contact.emailLabel')}
                    </label>
                    <input
                        id="contact-email"
                        type="email"
                        name="email"
                        required
                        maxLength={150}
                        placeholder={t('contact.emailPlaceholder')}
                        className="form-input"
                    />
                </div>

                <div className="form-row">
                    <div className="form-field">
                        <label htmlFor="contact-date" className="form-label">
                            <Calendar size={13} /> {t('contact.dateLabel')}
                        </label>
                        <input
                            id="contact-date"
                            type="date"
                            name="event_date"
                            className="form-input"
                            min={new Date().toISOString().split('T')[0]}
                        />
                    </div>
                    <div className="form-field">
                        <label htmlFor="contact-guests" className="form-label">
                            <Users size={13} /> {t('contact.guestsLabel')}
                        </label>
                        <input
                            id="contact-guests"
                            type="number"
                            name="guests"
                            min="1"
                            max="5000"
                            inputMode="numeric"
                            placeholder={t('contact.guestsPlaceholder')}
                            className="form-input"
                        />
                    </div>
                </div>

                <div className="form-field">
                    <label htmlFor="contact-message" className="form-label">{t('contact.messageLabel')}</label>
                    <textarea
                        id="contact-message"
                        name="message"
                        required
                        minLength={5}
                        maxLength={5000}
                        rows="4"
                        placeholder={t('contact.messagePlaceholder')}
                        className="form-input form-textarea"
                    />
                </div>

                <div className="form-submit-row">
                    <button type="submit" className="form-submit-btn" disabled={loading}>
                        {loading ? t('contact.submitting') : (
                            <>
                                {t('contact.submitBtn')}
                                <Send size={16} />
                            </>
                        )}
                    </button>
                    <p style={{
                        marginTop: '0.85rem',
                        fontSize: '0.78rem',
                        lineHeight: '1.5',
                        color: 'var(--text-3)',
                        textAlign: 'center',
                    }}>
                        <ShieldCheck size={13} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px', color: 'var(--gold)' }} />
                        {t('contact.rgpdNotice')}{' '}
                        <Link href="/politique-de-confidentialite" style={{ color: 'var(--gold)', textDecoration: 'underline', textUnderlineOffset: '2px' }}>
                            {t('contact.rgpdLink')}
                        </Link>.
                    </p>
                </div>
            </form>
        </div>
    );
}

export default function ContactForm() {
    return (
        <Suspense fallback={<div className="contact-card anim-up" style={{ minHeight: '520px' }} />}>
            <ContactFormInner />
        </Suspense>
    );
}
