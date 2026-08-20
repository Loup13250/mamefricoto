'use client';

import Link from 'next/link';
import { useState } from 'react';
import { adminLogin } from '@/app/actions';

import ThemeToggle from '@/components/ThemeToggle';

export default function AdminLoginPage() {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleLogin(formData) {
        setLoading(true);
        const result = await adminLogin(formData);
        if (result?.error) {
            setError(result.error);
            setLoading(false);
        }
    }

    return (
        <div className="admin-login-container">
            <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem' }}>
                <ThemeToggle />
            </div>
            <div className="admin-login-box animate-fade-up">
                <div className="admin-login-brand">
                    <h1>Mamé Fricoto</h1>
                    <p>Espace Administration</p>
                </div>
                {error && <p className="admin-login-error">{error}</p>}

                <form action={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label className="admin-label">Nom d&apos;utilisateur</label>
                        <input
                            type="text"
                            name="username"
                            placeholder="Votre identifiant"
                            required
                            className="admin-input"
                        />
                    </div>
                    <div>
                        <label className="admin-label">Mot de passe</label>
                        <input
                            type="password"
                            name="password"
                            placeholder="Votre mot de passe"
                            required
                            className="admin-input"
                        />
                    </div>
                    <button type="submit" className="admin-btn admin-btn-primary" disabled={loading} style={{ width: '100%', marginTop: '0.5rem', padding: '14px' }}>
                        {loading ? 'Connexion...' : 'Se Connecter'}
                    </button>
                </form>
                <div style={{ marginTop: '2rem', fontSize: '0.85rem', textAlign: 'center' }}>
                    <a href="/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--admin-text-subtle)' }}>&larr; Retour au site</a>
                </div>
            </div>
        </div>
    );
}
