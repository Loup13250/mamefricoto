'use client';
import { useState } from 'react';
import { submitContactForm } from '@/app/actions';
import { Send, CheckCircle2, AlertCircle, Phone, Calendar, Users, Mail, User, Utensils, HeartHandshake, PartyPopper, Building } from 'lucide-react';
import './ContactForm.css';

export default function ContactForm() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [selectedEventType, setSelectedEventType] = useState("Plat du jour / Repas");

    const eventTypes = [
        { id: "Plat du jour / Repas", label: "Plat du Jour", icon: <Utensils size={16} /> },
        { id: "Buffet Dînatoire", label: "Buffet Dînatoire", icon: <HeartHandshake size={16} /> },
        { id: "Événement Privé", label: "Événement Privé", icon: <PartyPopper size={16} /> },
        { id: "Repas d'Entreprise", label: "Entreprise / Séminaire", icon: <Building size={16} /> },
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
        <div className="solaire-contact-card animate-fade-up">
            <div className="solaire-form-header">
                <span className="solaire-badge">DISCUTONS DE VOTRE PROJET</span>
                <h2>Demande de Devis & Réservation</h2>
                <p>Remplissez les détails ci-dessous. Mamé Fricoto vous répondra très rapidement !</p>
            </div>

            {success && (
                <div className="solaire-alert solaire-alert-success">
                    <CheckCircle2 size={24} className="solaire-alert-icon" />
                    <div>
                        <strong>Votre message a été transmis à Mamé !</strong>
                        <p>Merci beaucoup, nous vous recontacterons dans les plus brefs délais.</p>
                    </div>
                </div>
            )}

            {error && (
                <div className="solaire-alert solaire-alert-error">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="solaire-form">
                {/* Event Type Pills */}
                <div className="solaire-field">
                    <label className="solaire-label">Type de prestation</label>
                    <div className="solaire-pills-grid">
                        {eventTypes.map((type) => (
                            <button
                                key={type.id}
                                type="button"
                                onClick={() => setSelectedEventType(type.id)}
                                className={`solaire-pill ${selectedEventType === type.id ? 'active' : ''}`}
                            >
                                {type.icon}
                                {type.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Name & Phone */}
                <div className="solaire-row">
                    <div className="solaire-field">
                        <label className="solaire-label">
                            <User size={15} /> Nom & Prénom *
                        </label>
                        <input type="text" name="name" required placeholder="Ex: Marie Dupont" className="solaire-input" />
                    </div>
                    <div className="solaire-field">
                        <label className="solaire-label">
                            <Phone size={15} /> Téléphone *
                        </label>
                        <input type="tel" name="phone" required placeholder="06 00 00 00 00" className="solaire-input" />
                    </div>
                </div>

                {/* Email */}
                <div className="solaire-field">
                    <label className="solaire-label">
                        <Mail size={15} /> Adresse Email *
                    </label>
                    <input type="email" name="email" required placeholder="marie@exemple.fr" className="solaire-input" />
                </div>

                {/* Date & Guests */}
                <div className="solaire-row">
                    <div className="solaire-field">
                        <label className="solaire-label">
                            <Calendar size={15} /> Date souhaitée
                        </label>
                        <input type="date" name="event_date" className="solaire-input" />
                    </div>
                    <div className="solaire-field">
                        <label className="solaire-label">
                            <Users size={15} /> Nombre d&apos;invités
                        </label>
                        <input type="text" name="guests" placeholder="Ex: 20 personnes" className="solaire-input" />
                    </div>
                </div>

                {/* Message */}
                <div className="solaire-field">
                    <label className="solaire-label">Votre message ou précisions *</label>
                    <textarea
                        name="message"
                        required
                        rows="4"
                        placeholder="Racontez-nous ce que vous souhaitez (lieu, menu souhaité, allergies ou contraintes)..."
                        className="solaire-input solaire-textarea"
                    ></textarea>
                </div>

                <div className="solaire-submit-wrapper">
                    <button type="submit" className="solaire-submit-btn" disabled={loading}>
                        {loading ? 'Envoi en cours...' : (
                            <>
                                Envoyer ma demande
                                <Send size={18} />
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
