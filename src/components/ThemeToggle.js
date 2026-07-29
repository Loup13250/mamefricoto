'use client';
import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import './ThemeToggle.css';

export default function ThemeToggle({ className = '', showLabel = false }) {
    const [theme, setTheme] = useState('light');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const savedTheme = localStorage.getItem('mamefricoto-theme');
        if (savedTheme === 'light' || savedTheme === 'dark') {
            setTheme(savedTheme);
            document.documentElement.setAttribute('data-theme', savedTheme);
        } else {
            const initialTheme = 'light';
            setTheme(initialTheme);
            document.documentElement.setAttribute('data-theme', initialTheme);
        }
    }, []);

    const toggleTheme = () => {
        const nextTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(nextTheme);
        localStorage.setItem('mamefricoto-theme', nextTheme);
        document.documentElement.setAttribute('data-theme', nextTheme);
    };

    if (!mounted) {
        return <div className={`theme-toggle-placeholder ${className}`} />;
    }

    const isLight = theme === 'light';

    return (
        <button
            type="button"
            className={`theme-toggle-btn ${isLight ? 'is-light' : 'is-dark'} ${className}`}
            onClick={toggleTheme}
            aria-label={isLight ? 'Passer en mode sombre' : 'Passer en mode clair'}
            title={isLight ? 'Passer en mode sombre' : 'Passer en mode clair'}
        >
            <span className="theme-toggle-track">
                <span className="theme-toggle-thumb">
                    {isLight ? (
                        <Sun size={15} className="theme-icon sun-icon" />
                    ) : (
                        <Moon size={15} className="theme-icon moon-icon" />
                    )}
                </span>
            </span>
            {showLabel && (
                <span className="theme-toggle-label">
                    {isLight ? 'Mode Clair' : 'Mode Sombre'}
                </span>
            )}
        </button>
    );
}
