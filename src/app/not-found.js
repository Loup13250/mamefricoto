import Link from 'next/link';

export const metadata = {
  title: 'Page non trouvée | Mamé Fricoto',
  description: "La page que vous recherchez n'existe pas ou a été déplacée.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
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
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(194, 87, 45, 0.15)',
          borderRadius: '16px',
          padding: '3rem 2rem',
          boxShadow: '0 20px 40px -15px rgba(42, 30, 23, 0.08)',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            fontSize: '4.5rem',
            fontWeight: '800',
            fontFamily: 'var(--font-cormorant, serif)',
            color: 'var(--terracotta, #C2572D)',
            lineHeight: 1,
            marginBottom: '1rem',
          }}
        >
          404
        </span>
        <h1
          style={{
            fontSize: '1.75rem',
            fontWeight: '700',
            marginBottom: '0.75rem',
            color: 'var(--text-1, #2A1E17)',
          }}
        >
          Page introuvable
        </h1>
        <p
          style={{
            fontSize: '1rem',
            color: 'var(--text-2, #5C4738)',
            marginBottom: '2rem',
            lineHeight: 1.6,
          }}
        >
          La page demandée n&apos;existe pas ou a été déplacée. Retrouvez notre cuisine maison et nos menus de saison sur la page d&apos;accueil.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '12px 24px',
              backgroundColor: 'var(--terracotta, #C2572D)',
              color: '#FFFFFF',
              borderRadius: '8px',
              fontWeight: '600',
              textDecoration: 'none',
              transition: 'background-color 0.2s ease',
            }}
          >
            ← Retour à l&apos;accueil
          </Link>
          <Link
            href="/contact"
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
            Nous contacter
          </Link>
        </div>
      </div>
    </main>
  );
}
