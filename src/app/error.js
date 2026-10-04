'use client';

import { useEffect } from 'react';
import Link from 'next/link';

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
        padding: '2rem 1.5rem',
        background: 'var(--cream, #FAF7F2)',
        color: 'var(--text-1, #2A1E17)',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          maxWidth: '560px',
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(194, 87, 45, 0.2)',
          borderRadius: '16px',
          padding: '3rem 2rem',
          boxShadow: '0 20px 40px -15px rgba(42, 30, 23, 0.08)',
        }}
      >
        <h1
          style={{
            fontSize: '1.75rem',
            fontWeight: '700',
            marginBottom: '0.75rem',
            color: 'var(--text-1, #2A1E17)',
          }}
        >
          Une erreur inattendue est survenue
        </h1>
        <p
          style={{
            fontSize: '1rem',
            color: 'var(--text-2, #5C4738)',
            marginBottom: '2rem',
            lineHeight: 1.6,
          }}
        >
          Veuillez nous excuser pour ce désagrément technique. Vous pouvez rafraîchir la page ou revenir à l&apos;accueil.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              padding: '12px 24px',
              backgroundColor: 'var(--terracotta, #C2572D)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Réessayer
          </button>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '12px 24px',
              backgroundColor: 'transparent',
              color: 'var(--text-1, #2A1E17)',
              border: '1px solid rgba(42, 30, 23, 0.2)',
              borderRadius: '8px',
              fontWeight: '600',
              textDecoration: 'none',
            }}
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </main>
  );
}
