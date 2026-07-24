'use client';
import { useState } from 'react';
import { submitContactForm } from '@/app/actions';
import { Send, CheckCircle2, AlertCircle, Phone, Calendar, Users, Mail, User, Utensils, HeartHandshake, PartyPopper, Building, HelpCircle } from 'lucide-react';
import './ContactForm.css';

export default function ContactForm() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [selectedEventType, setSelectedEventType] = useState('Plat du jour / Repas');

    const eventTypes = [
        { id: 'Plat du jour / Repas', label: 'Plat du Jour', icon: <Utensils size={14} /> },
        { id: 'Buffet Dînatoire', label: 'Buffet Dînatoire', icon: <HeartHandshake size={14} /> },
        { id: 'Événement Privé', label: 'Événement Privé', icon: <PartyPopper size={14} /> },
        { id: "Repas d'Entreprise", label: 'Entreprise', icon: <Building size={14} /> },
        { id: 'Autre prestation', label: 'Autre', icon: <HelpCircle size={14} /> },
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
                <span className="label">Discutons de votre projet</span>
                <h2>Demande de Devis &amp; Réservation</h2>
                <p>Remplissez les détails ci-dessous. Mamé Fricoto vous répondra très rapidement.</p>
            </div>

            {success && (
                <div className="form-alert alert-success" role="alert">
                    <CheckCircle2 size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                        <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Message transmis</strong>
                        Merci, nous vous recontacterons dans les plus brefs délais.
                    </div>
                </div>
            )}

            {error && (
                <div className="form-alert alert-error" role="alert">
                    <AlertCircle size={18} style={{ flexShrink: 0 }} />
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="contact-form" aria-label="Formulaire de demande de devis">
                <div className="form-field">
                    <span className="form-label" id="label-prestation">Type de prestation</span>
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
                                {type.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-field">
                        <label htmlFor="contact-name" className="form-label">
                            <User size={13} /> Nom &amp; Prénom *
                        </label>
                        <input id="contact-name" type="text" name="name" required placeholder="Marie Dupont" className="form-input" />
                    </div>
                    <div className="form-field">
                        <label htmlFor="contact-phone" className="form-label">
                            <Phone size={13} /> Téléphone *
                        </label>
                        <input id="contact-phone" type="tel" name="phone" required placeholder="06 00 00 00 00" className="form-input" />
                    </div>
                </div>

                <div className="form-field">
                    <label htmlFor="contact-email" className="form-label">
                        <Mail size={13} /> Adresse Email *
                    </label>
                    <input id="contact-email" type="email" name="email" required placeholder="marie@exemple.fr" className="form-input" />
                </div>

                <div className="form-row">
                    <div className="form-field">
                        <label htmlFor="contact-date" className="form-label">
                            <Calendar size={13} /> Date souhaitée
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
                            <Users size={13} /> Nombre de convives
                        </label>
                        <input id="contact-guests" type="text" name="guests" placeholder="Ex : 20 personnes" className="form-input" />
                    </div>
                </div>

                <div className="form-field">
                    <label htmlFor="contact-message" className="form-label">Votre message *</label>
                    <textarea
                        id="contact-message"
                        name="message"
                        required
                        rows="4"
                        placeholder="Décrivez votre projet (lieu, menu souhaité, allergies, contraintes)..."
                        className="form-input form-textarea"
                    />
                </div>

                <div className="form-submit-row">
                    <button type="submit" className="form-submit-btn" disabled={loading}>
                        {loading ? 'Envoi en cours...' : (
                            <>
                                Envoyer ma demande
                                <Send size={16} />
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
