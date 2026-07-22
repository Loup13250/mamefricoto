'use client';
import { markMessageRead, deleteMessage } from '@/app/actions';
import { Mail, Phone, Calendar, Users, Trash2, CheckCircle, Clock } from 'lucide-react';

export default function MessagesClient({ messages }) {
    return (
        <div className="animate-fade" style={{ width: '100%', maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.5rem' }}>
                    Messages & Demandes de Devis ({messages.length})
                </h1>
                <p style={{ color: '#64748b' }}>
                    Retrouvez ici toutes les demandes envoyées depuis le formulaire de contact.
                </p>
            </div>

            {messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '5rem 2rem', background: 'white', borderRadius: '20px', border: '1px solid #f1ede8', color: '#94a3b8' }}>
                    <Mail size={48} style={{ opacity: 0.4, marginBottom: '1rem' }} />
                    <p style={{ fontSize: '1.1rem', fontWeight: '600' }}>Aucun message reçu pour le moment.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className="admin-card"
                            style={{
                                borderLeft: `5px solid ${msg.is_read ? '#cbd5e1' : 'var(--admin-primary)'}`,
                                background: msg.is_read ? '#ffffff' : '#f0f4f8',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #f1ede8' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#1e293b' }}>{msg.name}</h2>
                                        {!msg.is_read && (
                                            <span style={{ background: 'var(--admin-primary)', color: 'white', fontSize: '0.75rem', fontWeight: '700', padding: '3px 10px', borderRadius: '12px' }}>
                                                NOUVEAU
                                            </span>
                                        )}
                                    </div>
                                    <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>
                                        <Clock size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.35rem' }} />
                                        Reçu le {new Date(msg.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {!msg.is_read && (
                                        <form action={markMessageRead}>
                                            <input type="hidden" name="id" value={msg.id} />
                                            <button type="submit" className="admin-btn admin-btn-secondary" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
                                                <CheckCircle size={14} /> Marquer lu
                                            </button>
                                        </form>
                                    )}
                                    <form action={deleteMessage}>
                                        <input type="hidden" name="id" value={msg.id} />
                                        <button type="submit" className="admin-btn admin-btn-danger" style={{ padding: '6px 12px' }} title="Supprimer">
                                            <Trash2 size={14} />
                                        </button>
                                    </form>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', background: '#ffffff', padding: '1rem', borderRadius: '12px', marginBottom: '1.25rem', border: '1px solid #f1ede8' }}>
                                <div>
                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700', display: 'block', marginBottom: '0.2rem' }}>Téléphone</span>
                                    <a href={`tel:${msg.phone}`} style={{ color: 'var(--admin-primary)', fontWeight: '700', fontSize: '1.05rem' }}>
                                        <Phone size={14} style={{ display: 'inline', marginRight: '0.35rem' }} />
                                        {msg.phone}
                                    </a>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700', display: 'block', marginBottom: '0.2rem' }}>Email</span>
                                    <a href={`mailto:${msg.email}`} style={{ color: 'var(--admin-primary)', fontWeight: '600' }}>
                                        <Mail size={14} style={{ display: 'inline', marginRight: '0.35rem' }} />
                                        {msg.email}
                                    </a>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700', display: 'block', marginBottom: '0.2rem' }}>Prestation</span>
                                    <span style={{ fontWeight: '600', color: '#1e293b' }}>{msg.event_type}</span>
                                </div>
                                {msg.event_date && (
                                    <div>
                                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700', display: 'block', marginBottom: '0.2rem' }}>Date souhaitée</span>
                                        <span style={{ fontWeight: '600', color: '#1e293b' }}>
                                            <Calendar size={14} style={{ display: 'inline', marginRight: '0.35rem' }} />
                                            {msg.event_date}
                                        </span>
                                    </div>
                                )}
                                {msg.guests && (
                                    <div>
                                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700', display: 'block', marginBottom: '0.2rem' }}>Invités</span>
                                        <span style={{ fontWeight: '600', color: '#1e293b' }}>
                                            <Users size={14} style={{ display: 'inline', marginRight: '0.35rem' }} />
                                            {msg.guests}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div>
                                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '0.5rem' }}>Message :</span>
                                <p style={{ color: '#334155', lineHeight: '1.7', whiteSpace: 'pre-wrap', background: '#faf8f5', padding: '1rem', borderRadius: '12px', border: '1px solid #f1ede8' }}>
                                    {msg.message}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
