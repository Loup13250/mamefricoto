'use client';
import { useState, useRef, useTransition, useCallback } from 'react';
import Image from 'next/image';
import { addWeeklyMenu, editWeeklyMenu, deleteWeeklyMenu, reorderWeeklyMenuImage, deleteWeeklyMenuImage } from '@/app/actions';
import {
    Pencil, Trash2, Plus, X, Image as ImageIcon, CalendarDays,
    CheckCircle2, Images, GripVertical, ArrowUp, ArrowDown,
    Loader2, UploadCloud, AlertCircle
} from 'lucide-react';

/* =====================================================
   IMAGE PREVIEW ITEM — avec réordonnancement par boutons
   ===================================================== */
function PreviewItem({ file, index, total, onRemove, onMoveUp, onMoveDown }) {
    const src = typeof file === 'string' ? file : URL.createObjectURL(file);
    return (
        <div style={{
            position: 'relative',
            background: 'var(--admin-surface)',
            border: '1px solid var(--admin-border)',
            borderRadius: '6px',
            overflow: 'hidden',
            aspectRatio: '1 / 1',
        }}>
            <Image
                src={src}
                alt={`Aperçu ${index + 1}`}
                width={300}
                height={300}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                unoptimized
            />

            {/* Badge numéro */}
            <div style={{
                position: 'absolute', top: '8px', left: '8px',
                background: 'rgba(14,13,12,0.85)',
                border: '1px solid rgba(200,169,110,0.4)',
                color: '#C8A96E',
                fontSize: '0.72rem', fontWeight: '700',
                padding: '3px 9px', borderRadius: '3px',
                backdropFilter: 'blur(4px)',
            }}>{index + 1} / {total}</div>

            {/* Boutons ordre */}
            <div style={{
                position: 'absolute', top: '8px', right: '8px',
                display: 'flex', flexDirection: 'column', gap: '3px',
            }}>
                <button
                    type="button"
                    onClick={() => onMoveUp(index)}
                    disabled={index === 0}
                    title="Monter"
                    style={{
                        width: '26px', height: '26px',
                        background: 'rgba(14,13,12,0.85)',
                        border: '1px solid rgba(200,169,110,0.3)',
                        color: index === 0 ? 'rgba(200,169,110,0.3)' : '#C8A96E',
                        borderRadius: '3px', cursor: index === 0 ? 'default' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backdropFilter: 'blur(4px)',
                        transition: 'all 0.2s',
                    }}
                >
                    <ArrowUp size={13} />
                </button>
                <button
                    type="button"
                    onClick={() => onMoveDown(index)}
                    disabled={index === total - 1}
                    title="Descendre"
                    style={{
                        width: '26px', height: '26px',
                        background: 'rgba(14,13,12,0.85)',
                        border: '1px solid rgba(200,169,110,0.3)',
                        color: index === total - 1 ? 'rgba(200,169,110,0.3)' : '#C8A96E',
                        borderRadius: '3px', cursor: index === total - 1 ? 'default' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backdropFilter: 'blur(4px)',
                        transition: 'all 0.2s',
                    }}
                >
                    <ArrowDown size={13} />
                </button>
            </div>

            {/* Bouton supprimer */}
            <button
                type="button"
                onClick={() => onRemove(index)}
                title="Retirer"
                style={{
                    position: 'absolute', bottom: '8px', right: '8px',
                    width: '28px', height: '28px',
                    background: 'rgba(239,68,68,0.9)',
                    border: 'none', borderRadius: '3px', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                }}
            >
                <X size={14} />
            </button>
        </div>
    );
}

/* =====================================================
   DROPZONE — sélection ou glisser-déposer
   ===================================================== */
function DropZone({ onFiles, isDragging, setIsDragging }) {
    const inputRef = useRef(null);

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const dropped = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
        if (dropped.length > 0) onFiles(dropped);
    };

    return (
        <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            style={{
                border: `2px dashed ${isDragging ? 'var(--admin-gold)' : 'var(--admin-border)'}`,
                background: isDragging ? 'rgba(200,169,110,0.08)' : 'var(--admin-surface)',
                borderRadius: '6px',
                padding: '2.5rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
            }}
        >
            <UploadCloud size={36} style={{ color: isDragging ? 'var(--admin-gold)' : 'var(--admin-text-subtle)' }} />
            <span style={{ fontWeight: '600', color: 'var(--admin-text)', fontSize: '0.95rem' }}>
                Glisser les images ici, ou cliquer pour choisir
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-subtle)' }}>
                JPG, PNG, WEBP · Plusieurs images possibles
            </span>
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={(e) => {
                    const selected = Array.from(e.target.files || []);
                    if (selected.length > 0) onFiles(selected);
                    e.target.value = '';
                }}
            />
        </div>
    );
}

/* =====================================================
   FORM AJOUT / ÉDITION
   ===================================================== */
function MenuForm({ menu, onCancel }) {
    const isEdit = !!menu;
    const [files, setFiles] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleNewFiles = useCallback((newFiles) => {
        setFiles(prev => [...prev, ...newFiles]);
    }, []);

    const handleRemove = useCallback((idx) => {
        setFiles(prev => prev.filter((_, i) => i !== idx));
    }, []);

    const handleMoveUp = useCallback((idx) => {
        if (idx === 0) return;
        setFiles(prev => {
            const next = [...prev];
            [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
            return next;
        });
    }, []);

    const handleMoveDown = useCallback((idx) => {
        setFiles(prev => {
            if (idx >= prev.length - 1) return prev;
            const next = [...prev];
            [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
            return next;
        });
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const formData = new FormData(e.target);

        // On supprime les fichiers natifs du form et on ajoute les nôtres dans l'ordre choisi
        formData.delete('image_files');
        for (const file of files) {
            formData.append('image_files', file);
        }

        startTransition(async () => {
            const action = isEdit ? editWeeklyMenu : addWeeklyMenu;
            const result = await action(formData);
            if (result?.error) {
                setError(result.error);
            } else {
                setSuccess(true);
                setTimeout(() => onCancel(), 1200);
            }
        });
    };

    if (success) {
        return (
            <div style={{
                padding: '3rem', textAlign: 'center',
                background: 'rgba(34,197,94,0.06)',
                border: '1px solid rgba(34,197,94,0.2)',
                borderRadius: '8px',
            }}>
                <CheckCircle2 size={40} style={{ color: '#22c55e', marginBottom: '1rem' }} />
                <p style={{ color: '#86efac', fontWeight: '600', fontSize: '1rem' }}>
                    {isEdit ? 'Menu mis à jour !' : 'Menu publié avec succès !'}
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {isEdit && <input type="hidden" name="id" value={menu.id} />}

            {/* Titre */}
            <div>
                <label className="admin-label">Titre du menu *</label>
                <input
                    type="text"
                    name="title"
                    className="admin-input"
                    placeholder="Ex : Menu du 15 au 18 Juillet"
                    defaultValue={menu?.title || ''}
                    required
                />
            </div>

            {/* Description */}
            <div>
                <label className="admin-label">Description des plats (optionnel)</label>
                <textarea
                    name="description"
                    className="admin-input"
                    rows="3"
                    placeholder="Ex : Tarte tatin aubergines, Cake citron, Riz safran..."
                    defaultValue={menu?.description || ''}
                />
            </div>

            {/* DropZone */}
            <div>
                <label className="admin-label" style={{ marginBottom: '0.75rem', display: 'block' }}>
                    Photos du menu
                    {files.length > 0 && (
                        <span style={{ marginLeft: '0.75rem', color: '#C8A96E', fontWeight: '600' }}>
                            {files.length} image{files.length > 1 ? 's' : ''} sélectionnée{files.length > 1 ? 's' : ''}
                        </span>
                    )}
                </label>
                <DropZone onFiles={handleNewFiles} isDragging={isDragging} setIsDragging={setIsDragging} />
            </div>

            {/* Prévisualisation + ordre */}
            {files.length > 0 && (
                <div>
                    <p style={{
                        fontSize: '0.78rem', fontWeight: '700', letterSpacing: '0.12em',
                        textTransform: 'uppercase', color: 'rgba(200,169,110,0.7)',
                        marginBottom: '0.75rem',
                    }}>
                        Aperçu &amp; Ordre d&apos;affichage — La 1ère image sera la miniature
                    </p>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                        gap: '10px',
                    }}>
                        {files.map((file, idx) => (
                            <PreviewItem
                                key={idx}
                                file={file}
                                index={idx}
                                total={files.length}
                                onRemove={handleRemove}
                                onMoveUp={handleMoveUp}
                                onMoveDown={handleMoveDown}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Images existantes (édition) */}
            {isEdit && menu?.images?.length > 0 && (
                <div>
                    <p style={{
                        fontSize: '0.78rem', fontWeight: '700', letterSpacing: '0.12em',
                        textTransform: 'uppercase', color: 'rgba(200,169,110,0.85)',
                        marginBottom: '0.75rem',
                    }}>
                        Photos actuelles du menu ({menu.images.length}) — Gérez l&apos;ordre ou supprimez des photos :
                    </p>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                        gap: '10px',
                    }}>
                        {menu.images.map((img, idx) => (
                            <div key={img.id} style={{
                                border: '1px solid var(--admin-border)',
                                borderRadius: '6px', overflow: 'hidden',
                                aspectRatio: '1 / 1', position: 'relative',
                                background: 'var(--admin-surface)',
                            }}>
                                <Image
                                    src={img.image_url}
                                    alt={`Photo ${idx + 1}`}
                                    width={200}
                                    height={200}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    unoptimized
                                />

                                {/* Badge numéro */}
                                <div style={{
                                    position: 'absolute', top: '6px', left: '6px',
                                    background: 'rgba(14,13,12,0.85)',
                                    border: '1px solid rgba(200,169,110,0.4)',
                                    color: '#C8A96E', fontSize: '0.68rem', fontWeight: '700',
                                    padding: '2px 7px', borderRadius: '3px',
                                }}>#{idx + 1}</div>

                                {/* Reorder Controls */}
                                <div style={{
                                    position: 'absolute', top: '6px', right: '6px',
                                    display: 'flex', flexDirection: 'column', gap: '3px',
                                }}>
                                    <button
                                        type="button"
                                        onClick={() => startTransition(() => reorderWeeklyMenuImage(img.id, 'up'))}
                                        disabled={idx === 0 || isPending}
                                        title="Déplacer vers le haut / miniature principale"
                                        style={{
                                            width: '26px', height: '26px',
                                            background: 'rgba(14,13,12,0.85)',
                                            border: '1px solid rgba(200,169,110,0.3)',
                                            color: idx === 0 ? 'rgba(200,169,110,0.3)' : '#C8A96E',
                                            borderRadius: '3px', cursor: idx === 0 ? 'default' : 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}
                                    >
                                        <ArrowUp size={12} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => startTransition(() => reorderWeeklyMenuImage(img.id, 'down'))}
                                        disabled={idx === menu.images.length - 1 || isPending}
                                        title="Déplacer vers le bas"
                                        style={{
                                            width: '26px', height: '26px',
                                            background: 'rgba(14,13,12,0.85)',
                                            border: '1px solid rgba(200,169,110,0.3)',
                                            color: idx === menu.images.length - 1 ? 'rgba(200,169,110,0.3)' : '#C8A96E',
                                            borderRadius: '3px', cursor: idx === menu.images.length - 1 ? 'default' : 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}
                                    >
                                        <ArrowDown size={12} />
                                    </button>
                                </div>

                                {/* Delete image button */}
                                {menu.images.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => startTransition(() => deleteWeeklyMenuImage(img.id))}
                                        disabled={isPending}
                                        title="Supprimer cette photo"
                                        style={{
                                            position: 'absolute', bottom: '6px', right: '6px',
                                            width: '26px', height: '26px',
                                            background: 'rgba(239,68,68,0.9)',
                                            border: 'none', borderRadius: '3px', color: 'white',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <X size={13} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Menu en cours */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '1rem 1.25rem',
                background: 'rgba(34,197,94,0.05)',
                border: '1px solid rgba(34,197,94,0.15)',
                borderRadius: '4px',
            }}>
                <input
                    type="checkbox"
                    name="is_current"
                    id={`is_current_${menu?.id || 'new'}`}
                    defaultChecked={menu ? !!menu.is_current : true}
                    style={{ width: '18px', height: '18px', accentColor: '#22c55e', flexShrink: 0 }}
                />
                <label htmlFor={`is_current_${menu?.id || 'new'}`} style={{ cursor: 'pointer', color: '#86efac', fontSize: '0.9rem', fontWeight: '600' }}>
                    Afficher comme menu en cours sur la page d&apos;accueil
                </label>
            </div>

            {/* Erreur */}
            {error && (
                <div style={{
                    display: 'flex', gap: '0.75rem', alignItems: 'center',
                    padding: '1rem', borderRadius: '4px',
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    color: '#fca5a5', fontSize: '0.9rem',
                }}>
                    <AlertCircle size={18} style={{ flexShrink: 0 }} />
                    {error}
                </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid rgba(200,169,110,0.08)' }}>
                <button type="button" onClick={onCancel} className="admin-btn admin-btn-secondary" disabled={isPending}>
                    Annuler
                </button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={isPending} style={{ minWidth: '160px' }}>
                    {isPending ? (
                        <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Upload en cours...</>
                    ) : (
                        isEdit ? 'Enregistrer les modifications' : 'Publier ce menu'
                    )}
                </button>
            </div>
        </form>
    );
}

/* =====================================================
   COMPOSANT PRINCIPAL
   ===================================================== */
export default function WeeklyMenuClient({ menus }) {
    const [editingId, setEditingId] = useState(null);
    const [isAdding, setIsAdding] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [isPending, startTransition] = useTransition();

    const handleDelete = (id) => {
        startTransition(async () => {
            await deleteWeeklyMenu(id);
            setDeleteId(null);
        });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <div style={{ width: '100%', maxWidth: '750px', marginBottom: '2.5rem' }}>
                <h1 className="admin-page-title">Menu de la Semaine</h1>
                <p style={{ color: 'var(--admin-text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem', lineHeight: '1.6' }}>
                    Créez ou modifiez le menu de la semaine affiché sur le site. Vous pouvez publier plusieurs photos par menu (les clients pourront faire défiler les photos du menu avec des flèches).
                </p>
                {!isAdding && !editingId && (
                    <button onClick={() => setIsAdding(true)} className="admin-btn admin-btn-primary">
                        <Plus size={16} /> Créer un nouveau menu
                    </button>
                )}
            </div>

            {/* Formulaire Création */}
            {isAdding && (
                <div className="admin-card" style={{ width: '100%', maxWidth: '750px', marginBottom: '3rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--admin-border-soft)' }}>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: '600', color: 'var(--admin-text)' }}>Nouveau menu</h2>
                        <button type="button" onClick={() => setIsAdding(false)} style={{ color: 'var(--admin-text-subtle)', cursor: 'pointer', padding: '6px', background: 'none', border: 'none' }}>
                            <X size={20} />
                        </button>
                    </div>
                    <WeeklyMenuForm onCancel={() => setIsAdding(false)} />
                </div>
            )}

            {/* Formulaire Édition */}
            {editingId && (
                <div className="admin-card" style={{ width: '100%', maxWidth: '750px', marginBottom: '3rem', border: '1px solid var(--admin-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--admin-border-soft)' }}>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: '600', color: 'var(--admin-text)' }}>Modifier le menu</h2>
                        <button type="button" onClick={() => setEditingId(null)} style={{ color: 'var(--admin-text-subtle)', cursor: 'pointer', padding: '6px', background: 'none', border: 'none' }}>
                            <X size={20} />
                        </button>
                    </div>
                    <WeeklyMenuForm initialData={menus.find(m => m.id === editingId)} onCancel={() => setEditingId(null)} />
                </div>
            )}

            {/* Liste des Menus */}
            <div style={{ width: '100%', maxWidth: '750px' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--admin-text-subtle)', marginBottom: '1.25rem' }}>
                    Historique des menus ({menus.length})
                </h2>

                {menus.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: '6px', color: 'var(--admin-text-muted)' }}>
                        Aucun menu publié pour le moment.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--admin-border-soft)', border: '1px solid var(--admin-border)', borderRadius: '6px', overflow: 'hidden' }}>
                        {menus.map(menu => (
                            <div key={menu.id} className="admin-menu-item-row" style={{
                                display: 'grid',
                                gridTemplateColumns: 'minmax(60px, 80px) 1fr auto',
                                gap: '1rem',
                                alignItems: 'center',
                                padding: '1rem 1.25rem',
                                background: 'var(--admin-card-bg)',
                                transition: 'background 0.2s',
                            }}>
                                {/* Thumbnail */}
                                <div style={{ width: '80px', height: '60px', borderRadius: '4px', overflow: 'hidden', background: 'var(--admin-surface)', flexShrink: 0, border: '1px solid var(--admin-border)' }}>
                                    {menu.images?.length > 0 ? (
                                        <Image
                                            src={menu.images[0].image_url}
                                            alt={menu.title}
                                            width={160}
                                            height={120}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            unoptimized
                                        />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--admin-text-subtle)' }}>
                                            <ImageIcon size={24} />
                                        </div>
                                    )}
                                </div>

                                {/* Details */}
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
                                        <h3 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--admin-text)' }}>{menu.title}</h3>
                                        {menu.is_current === 1 && (
                                            <span style={{ fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '2px 8px', background: 'rgba(34,197,94,0.15)', color: '#16a34a', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '3px' }}>
                                                En ligne
                                            </span>
                                        )}
                                        {menu.images?.length > 1 && (
                                            <span style={{ fontSize: '0.7rem', color: 'var(--admin-gold)' }}>
                                                📷 {menu.images.length} photos
                                            </span>
                                        )}
                                    </div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--admin-text-subtle)' }}>
                                        {menu.week_dates ? `Période : ${menu.week_dates}` : `Créé le ${new Date(menu.created_at).toLocaleDateString('fr-FR')}`}
                                    </p>
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => { setEditingId(menu.id); setIsAdding(false); }}
                                        title="Modifier ce menu"
                                        style={{ width: '34px', height: '34px', background: 'rgba(200,169,110,0.12)', border: '1px solid var(--admin-border)', color: 'var(--admin-gold)', borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                                    >
                                        <Pencil size={15} />
                                    </button>

                                    {deleteId === menu.id ? (
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <button
                                                onClick={() => handleDelete(menu.id)}
                                                disabled={isPending}
                                                style={{ padding: '6px 12px', background: 'rgba(239,68,68,0.9)', border: 'none', color: 'white', borderRadius: '3px', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}
                                            >
                                                {isPending ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : 'Confirmer'}
                                            </button>
                                            <button
                                                onClick={() => setDeleteId(null)}
                                                style={{ width: '34px', height: '34px', background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', color: 'var(--admin-text-subtle)', borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setDeleteId(menu.id)}
                                            title="Supprimer ce menu"
                                            style={{ width: '34px', height: '34px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#dc2626', borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                .admin-page-title { font-size: 1.6rem; font-weight: 700; color: var(--admin-text); margin-bottom: 0.5rem; }
            `}</style>
        </div>
    );
}
