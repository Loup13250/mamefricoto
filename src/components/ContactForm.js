'use client';
import { useState } from 'react';
import { submitContactForm } from '@/app/actions';
import { Send, CheckCircle2, AlertCircle, Phone, Calendar, Users, Mail, User, UtensilsCrossed } from 'lucide-react';

export default function ContactForm() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        const formData = new FormData(e.target);
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
        <div className="glass-panel animate-fade-up" style={{ padding: '3rem', position: 'relative' }}>
            <h2 style={{ marginBottom: '0.5rem', fontFamily: 'var(--font-primary)', color: 'var(--text-primary)', fontSize: '1.8rem' }}>
                Demande de Devis & Réservation
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.95rem' }}>
                Remplissez ce formulaire pour vos repas d&apos;entreprise, buffets ou événements. Mamé vous répondra sous 24h.
            </p>

            {success && (
                <div style={{ padding: '1.25rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--border-radius-md)', color: '#166534', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <CheckCircle2 size={24} style={{ color: '#22c55e', flexShrink: 0 }} />
                    <div>
                        <strong style={{ display: 'block', fontSize: '1rem' }}>Message envoyé avec succès !</strong>
                        <span style={{ fontSize: '0.9rem' }}>Mamé Fricoto vous recontactera rapidement par téléphone ou email.</span>
                    </div>
                </div>
            )}

            {error && (
                <div style={{ padding: '1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--border-radius-md)', color: '#991b1b', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <AlertCircle size={20} style={{ color: '#ef4444' }} />
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    <div>
                        <label className="admin-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <User size={15} /> Nom complet *
                        </label>
                        <input type="text" name="name" required placeholder="Votre nom" className="admin-input" style={{ background: '#faf8f5' }} />
                    </div>
                    <div>
                        <label className="admin-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Phone size={15} /> Numéro de Téléphone *
                        </label>
                        <input type="tel" name="phone" required placeholder="06 00 00 00 00" className="admin-input" style={{ background: '#faf8f5' }} />
                    </div>
                </div>

                <div>
                    <label className="admin-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Mail size={15} /> Adresse Email *
                    </label>
                    <input type="email" name="email" required placeholder="votre.email@exemple.com" className="admin-input" style={{ background: '#faf8f5' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    <div>
                        <label className="admin-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <UtensilsCrossed size={15} /> Type d&apos;événement
                        </label>
                        <select name="event_type" className="admin-input" style={{ background: '#faf8f5' }}>
                            <option value="Plat du jour / Repas">Plat du jour / Commande classique</option>
                            <option value="Buffet Dînatoire">Buffet Dînatoire</option>
                            <option value="Événement Privé (Anniversaire, Fête)">Événement Privé (Anniversaire, Fête)</option>
                            <option value="Repas d'Entreprise / Séminaire">Repas d&apos;Entreprise / Séminaire</option>
                            <option value="Autre demande">Autre demande</option>
                        </select>
                    </div>
                    <div>
                        <label className="admin-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Users size={15} /> Nombre d&apos;invités (estimé)
                        </label>
                        <input type="text" name="guests" placeholder="Ex: 15 personnes" className="admin-input" style={{ background: '#faf8f5' }} />
                    </div>
                </div>

                <div>
                    <label className="admin-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Calendar size={15} /> Date souhaitée
                    </label>
                    <input type="date" name="event_date" className="admin-input" style={{ background: '#faf8f5' }} />
                </div>

                <div>
                    <label className="admin-label">Détails de votre demande *</label>
                    <textarea name="message" required rows="5" placeholder="Expliquez-nous vos besoins, vos préférences culinaires, le lieu..." className="admin-input" style={{ background: '#faf8f5', lineHeight: '1.6' }}></textarea>
                </div>

                <div style={{ paddingTop: '0.5rem' }}>
                    <button type="submit" className="btn-peach" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                        {loading ? (
                            'Envoi en cours...'
                        ) : (
                            <>
                                <Send size={18} />
                                Envoyer la demande
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
