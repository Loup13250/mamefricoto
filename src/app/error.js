'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { RotateCw, Home, AlertCircle } from 'lucide-react';

export default function ErrorBoundary({ error, reset }) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <main
      style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1.5rem',
        background: 'radial-gradient(circle at 50% 20%, rgba(194, 87, 45, 0.1) 0%, transparent 60%), var(--bg)',
        color: 'var(--text-1)',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          maxWidth: '560px',
          width: '100%',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '24px',
          padding: '3rem 2rem',
          boxShadow: '0 20px 40px -15px rgba(42, 30, 23, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(194, 87, 45, 0.1)',
            color: 'var(--gold)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.5rem',
          }}
        >
          <AlertCircle size={32} />
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '2rem',
            fontWeight: '400',
            lineHeight: 1.2,
            color: 'var(--text-1)',
            margin: 0,
          }}
        >
          Un petit contretemps en cuisine...
        </h1>

        <p
          style={{
            fontSize: '1rem',
            color: 'var(--text-2)',
            lineHeight: 1.6,
            margin: '0.25rem 0 1.5rem',
          }}
        >
          Une erreur inattendue est survenue lors de l&apos;affichage de cette page. Vous pouvez retenter votre chance ou regagner la table principale.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', width: '100%' }}>
          <button
            type="button"
            onClick={() => reset()}
            className="btn-gold"
            style={{ cursor: 'pointer', border: 'none' }}
          >
            <RotateCw size={18} />
            <span>Réessayer</span>
          </button>
          
          <Link href="/" className="btn-outline">
            <Home size={18} />
            <span>Retour à l&apos;accueil</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
