'use client';
import { useState } from 'react';
import { submitContactForm } from '@/app/actions';
import { useLanguage } from '@/context/LanguageContext';
import { Send, CheckCircle2, AlertCircle, Phone, Calendar, Users, Mail, User, PartyPopper, Building, HelpCircle } from 'lucide-react';
import './ContactForm.css';

export default function ContactForm() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [selectedEventType, setSelectedEventType] = useState('Événement Privé');
    const { t } = useLanguage();

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
                        <input id="contact-name" type="text" name="name" required placeholder={t('contact.namePlaceholder')} className="form-input" />
                    </div>
                    <div className="form-field">
                        <label htmlFor="contact-phone" className="form-label">
                            <Phone size={13} /> {t('contact.phoneLabel')}
                        </label>
                        <input id="contact-phone" type="tel" name="phone" placeholder={t('contact.phonePlaceholder')} className="form-input" />
                    </div>
                </div>

                <div className="form-field">
                    <label htmlFor="contact-email" className="form-label">
                        <Mail size={13} /> {t('contact.emailLabel')}
                    </label>
                    <input id="contact-email" type="email" name="email" required placeholder={t('contact.emailPlaceholder')} className="form-input" />
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
                        <input id="contact-guests" type="text" name="guests" placeholder={t('contact.guestsPlaceholder')} className="form-input" />
                    </div>
                </div>

                <div className="form-field">
                    <label htmlFor="contact-message" className="form-label">{t('contact.messageLabel')}</label>
                    <textarea
                        id="contact-message"
                        name="message"
                        required
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
                </div>
            </form>
        </div>
    );
}
