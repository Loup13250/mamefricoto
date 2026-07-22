'use client';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

export default function AdminFormWrapper({ children, action, className, style }) {
    const [isDirty, setIsDirty] = useState(false);
    const [showSavedToast, setShowSavedToast] = useState(false);
    const searchParams = useSearchParams();

    useEffect(() => {
        if (searchParams.get('saved') === '1') {
            setShowSavedToast(true);
            const timer = setTimeout(() => setShowSavedToast(false), 4000);
            return () => clearTimeout(timer);
        }
    }, [searchParams]);

    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = 'Vous avez des modifications non sauvegardées. Voulez-vous vraiment quitter ?';
                return e.returnValue;
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);

    const handleFormChange = () => {
        if (!isDirty) setIsDirty(true);
    };

    const handleFormSubmit = () => {
        setIsDirty(false); // Reset warning on intentional submit
    };

    return (
        <div style={{ position: 'relative', width: '100%' }}>
            {showSavedToast && (
                <div
                    style={{
                        padding: '1rem 1.5rem',
                        background: '#f0fdf4',
                        border: '1.5px solid #bbf7d0',
                        borderRadius: '16px',
                        color: '#166534',
                        marginBottom: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        fontWeight: '600',
                        boxShadow: '0 4px 15px rgba(34, 197, 94, 0.15)',
                        animation: 'fadeIn 0.3s ease',
                    }}
                >
                    <CheckCircle2 size={22} style={{ color: '#22c55e' }} />
                    <span>Modifications enregistrées avec succès ! Elles sont immédiatement en ligne.</span>
                </div>
            )}

            {isDirty && (
                <div
                    style={{
                        padding: '0.75rem 1.25rem',
                        background: '#fffbeb',
                        border: '1px solid #fef3c7',
                        borderRadius: '12px',
                        color: '#92400e',
                        marginBottom: '1rem',
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontWeight: '500',
                    }}
                >
                    <AlertTriangle size={16} style={{ color: '#f59e0b' }} />
                    <span>Modifications non enregistrées — Pensez à cliquer sur Sauvegarder avant de quitter !</span>
                </div>
            )}

            <form
                action={action}
                onChange={handleFormChange}
                onSubmit={handleFormSubmit}
                className={className}
                style={style}
            >
                {children}
            </form>
        </div>
    );
}
