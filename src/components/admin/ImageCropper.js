'use client';

/**
 * ImageCropperModal - outil de cadrage d'images pour l'administration
 * --------------------------------------------------------------------
 * - Plusieurs photos à la fois (bandeau de vignettes + navigation).
 * - Un ou plusieurs "formats" par photo (ex. ordinateur 16:9 ET mobile 9:16),
 *   chacun avec son propre cadrage, affiché en direct (ce qu'on voit = ce qui sera publié).
 * - Fonctionne à la souris (glisser, molette) et au doigt (glisser, pincer), + clavier.
 * - Option "voir comme sur le site" : superpose le dégradé et le texte de la bannière.
 * - Le rendu final est recadré + compressé (WebP, repli JPEG) côté navigateur.
 *
 * Utilisation :
 *   <ImageCropperModal
 *     items={[{ id: 'a', file }, { id: 'b', url: '/api/media/xyz' }]}
 *     targets={HERO_CROP_TARGETS}
 *     onCancel={() => ...}
 *     onConfirm={(results) => ...}   // [{ id, name, outputs: { desktop: File, mobile?: File }, crops }]
 *   />
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    Check,
    X,
    ZoomIn,
    ZoomOut,
    RotateCcw,
    Monitor,
    Smartphone,
    Square,
    FileText,
    Image as ImageIcon,
    ChevronLeft,
    ChevronRight,
    Eye,
    EyeOff,
    Copy,
    Loader2,
    ImageOff,
    Move,
    Trash2,
    Power,
} from 'lucide-react';
import './ImageCropper.css';

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 5;
const MAX_OUTPUT_BYTES = 4 * 1024 * 1024; // marge sous la limite d'envoi (4,5 Mo en production)

/** Formats utilisés par le carrousel de la page d'accueil. */
export const HERO_CROP_TARGETS = [
    {
        key: 'desktop',
        label: 'Ordinateur & tablette',
        shortLabel: 'Ordinateur',
        ratioLabel: '16:9',
        aspect: 16 / 9,
        icon: 'desktop',
        maxWidth: 1920,
        quality: 0.82,
        optional: false,
        hint: 'Paysage - affiché en grand sur ordinateur',
    },
    {
        key: 'mobile',
        label: 'Téléphone',
        shortLabel: 'Mobile',
        ratioLabel: '9:16',
        aspect: 9 / 16,
        icon: 'mobile',
        maxWidth: 1080,
        quality: 0.8,
        optional: true,
        defaultEnabled: true,
        hint: 'Portrait - affiché plein écran sur smartphone',
        disabledHint:
            "Sans format mobile, la photo « Ordinateur » est utilisée sur téléphone : seule une bande verticale de la photo sera visible.",
    },
];

/** Formats utilisés par la galerie photos : photo grand format (lightbox) + miniature (grille vitrine). */
export const GALLERY_CROP_TARGETS = [
    {
        key: 'image',
        label: 'Photo grand format (Lightbox)',
        shortLabel: 'Photo (Ouverture)',
        ratioLabel: '16:9',
        aspect: 16 / 9,
        icon: 'image',
        maxWidth: 1920,
        quality: 0.88,
        optional: false,
        hint: 'Photo entière affichée lorsque le visiteur clique dessus pour l’ouvrir en grand dans la galerie',
        aspectOptions: [
            { label: 'Paysage 16:9', shortLabel: '16:9', value: 16 / 9 },
            { label: 'Standard 4:3', shortLabel: '4:3', value: 4 / 3 },
            { label: 'Portrait 4:5', shortLabel: '4:5', value: 4 / 5 },
            { label: 'Standard 3:4', shortLabel: '3:4', value: 3 / 4 },
            { label: 'Carré 1:1', shortLabel: '1:1', value: 1 },
        ],
    },
    {
        key: 'thumbnail',
        label: 'Miniature de la grille (Vignette vitrine)',
        shortLabel: 'Miniature (Grille)',
        ratioLabel: '1:1',
        aspect: 1,
        icon: 'square',
        maxWidth: 900,
        quality: 0.85,
        optional: false,
        hint: 'Format carré 1:1 pour la vitrine et la grille du site (choisissez ce qui est visible dans la vignette)',
    },
];

/** Formats utilisés par le menu de la semaine. */
export const MENU_CROP_TARGETS = [
    {
        key: 'image',
        label: 'Menu de la semaine',
        shortLabel: 'Menu',
        ratioLabel: '4:5',
        aspect: 4 / 5,
        icon: 'file',
        maxWidth: 1600,
        quality: 0.85,
        optional: false,
        hint: 'Format portrait idéal pour les pages de menu et les flyers',
        aspectOptions: [
            { label: 'Portrait 4:5 (recommandé)', shortLabel: '4:5', value: 4 / 5 },
            { label: 'Flyer A4 (1:1.41)', shortLabel: 'A4', value: 1 / 1.414 },
            { label: 'Standard 3:4', shortLabel: '3:4', value: 3 / 4 },
            { label: 'Carré 1:1', shortLabel: '1:1', value: 1 },
            { label: 'Paysage 16:9', shortLabel: '16:9', value: 16 / 9 },
        ],
    },
];

/** Formats utilisés par la page tarifs et cartes traiteur. */
export const TARIFS_CROP_TARGETS = [
    {
        key: 'image',
        label: 'Carte & Tarifs',
        shortLabel: 'Tarif / Carte',
        ratioLabel: 'A4',
        aspect: 1 / 1.414,
        icon: 'file',
        maxWidth: 1600,
        quality: 0.85,
        optional: false,
        hint: 'Format flyer/carte A4 standard pour les cartes traiteur et formules',
        aspectOptions: [
            { label: 'Flyer A4 (recommandé)', shortLabel: 'A4', value: 1 / 1.414 },
            { label: 'Portrait 4:5', shortLabel: '4:5', value: 4 / 5 },
            { label: 'Standard 3:4', shortLabel: '3:4', value: 3 / 4 },
            { label: 'Carré 1:1', shortLabel: '1:1', value: 1 },
            { label: 'Paysage 16:9', shortLabel: '16:9', value: 16 / 9 },
        ],
    },
];

/** Formats utilisés par la page À Propos (photo d'illustration officielle). */
export const ABOUT_CROP_TARGETS = [
    {
        key: 'image',
        label: 'Photo À Propos',
        shortLabel: 'À Propos',
        ratioLabel: '4:5',
        aspect: 4 / 5,
        icon: 'user',
        maxWidth: 1600,
        quality: 0.88,
        optional: false,
        hint: "Format portrait 4:5 élégant affiché à côté de l'histoire sur la page À Propos",
        aspectOptions: [
            { label: 'Portrait 4:5 (recommandé)', shortLabel: '4:5', value: 4 / 5 },
            { label: 'Standard 3:4', shortLabel: '3:4', value: 3 / 4 },
            { label: 'Carré 1:1', shortLabel: '1:1', value: 1 },
            { label: 'Paysage 16:9', shortLabel: '16:9', value: 16 / 9 },
        ],
    },
];

export const uid = () =>
    (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : `img-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

/* ------------------------------------------------------------------ */
/* Maths du cadrage                                                    */
/* ------------------------------------------------------------------ */
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

/**
 * crop = { zoom, cx, cy } : zoom (1 = photo couvrant tout le cadre) et centre
 * visible en coordonnées normalisées (0-1) de la photo d'origine.
 * Retourne la zone visible (en pixels de la photo d'origine), toujours contenue dans la photo.
 */
function getView(dim, aspect, crop) {
    const imgAspect = dim.w / dim.h;
    let baseW;
    let baseH;
    if (imgAspect > aspect) {
        baseH = dim.h;
        baseW = dim.h * aspect;
    } else {
        baseW = dim.w;
        baseH = dim.w / aspect;
    }
    const zoom = clamp(crop.zoom, MIN_ZOOM, MAX_ZOOM);
    const vw = baseW / zoom;
    const vh = baseH / zoom;
    const cx = clamp(crop.cx, vw / 2 / dim.w, 1 - vw / 2 / dim.w);
    const cy = clamp(crop.cy, vh / 2 / dim.h, 1 - vh / 2 / dim.h);
    return { vw, vh, cx, cy, zoom, left: cx * dim.w - vw / 2, top: cy * dim.h - vh / 2 };
}

const defaultCrop = (target) => ({
    zoom: 1,
    cx: 0.5,
    cy: 0.5,
    aspect: target.aspect,
    enabled: target.optional ? target.defaultEnabled !== false : true,
    touched: false,
});

/** Trouve l'option de format qui correspond au ratio réel de l'image (si proche à moins de 8%) */
function findClosestAspect(ratio, options, fallback) {
    if (!options || options.length === 0) return fallback;
    let best = null;
    let minDiff = Infinity;
    for (const opt of options) {
        const val = typeof opt.value === 'number' ? opt.value : opt.aspect;
        if (!val) continue;
        const diff = Math.abs(ratio - val) / val;
        if (diff < minDiff) {
            minDiff = diff;
            best = val;
        }
    }
    if (minDiff < 0.08 && best !== null) {
        return best;
    }
    return fallback;
}

function canvasToBlob(canvas, type, quality) {
    return new Promise((resolve) => canvas.toBlob((b) => resolve(b), type, quality));
}

async function renderCrop(source, target, crop, baseName) {
    const aspect = crop.aspect || target.aspect;
    const view = getView(source, aspect, crop);
    const outW = Math.max(1, Math.round(Math.min(target.maxWidth, view.vw)));
    const outH = Math.max(1, Math.round(outW / aspect));

    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(source.img, view.left, view.top, view.vw, view.vh, 0, 0, outW, outH);

    let quality = target.quality;
    let blob = await canvasToBlob(canvas, 'image/webp', quality);
    // Safari ne sait pas encoder en WebP : il renvoie alors du PNG -> on bascule en JPEG
    if (!blob || blob.type !== 'image/webp') {
        blob = await canvasToBlob(canvas, 'image/jpeg', quality);
    }
    // Garde-fou : on baisse la qualité si le fichier reste trop lourd
    while (blob && blob.size > MAX_OUTPUT_BYTES && quality > 0.5) {
        quality -= 0.1;
        blob = await canvasToBlob(canvas, blob.type, quality);
    }
    if (!blob) throw new Error('Impossible de générer l’image recadrée.');

    const ext = blob.type === 'image/webp' ? 'webp' : 'jpg';
    return new File([blob], `${baseName}-${target.key}.${ext}`, { type: blob.type, lastModified: Date.now() });
}

async function loadSource(item) {
    let blobUrl;
    if (item.file) {
        blobUrl = URL.createObjectURL(item.file);
    } else if (item.url) {
        const res = await fetch(item.url, { cache: 'force-cache' });
        if (!res.ok) throw new Error('Téléchargement impossible');
        blobUrl = URL.createObjectURL(await res.blob());
    } else {
        throw new Error('Aucune source');
    }
    const img = new window.Image();
    img.decoding = 'async';
    img.src = blobUrl;
    try {
        await img.decode();
    } catch (err) {
        URL.revokeObjectURL(blobUrl);
        throw err;
    }
    return { url: blobUrl, w: img.naturalWidth, h: img.naturalHeight, img };
}

const baseNameOf = (item) =>
    (item.name || item.file?.name || 'photo')
        .replace(/\.[^.]+$/, '')
        .replace(/[^a-zA-Z0-9_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40) || 'photo';

/* ------------------------------------------------------------------ */
/* Aperçu "comme sur le site" (dégradé + texte de la bannière)          */
/* ------------------------------------------------------------------ */
function HeroOverlay({ portrait }) {
    return (
        <div className={`ic-hero ${portrait ? 'is-portrait' : 'is-landscape'}`} aria-hidden="true">
            <div className="ic-hero-inner">
                <span className="ic-hero-eyebrow">Traiteur maison · Eyguières</span>
                <span className="ic-hero-title">Le titre de votre bannière</span>
                <span className="ic-hero-sub">Votre sous-titre apparaît ici</span>
                <span className="ic-hero-btns">
                    <i className="ic-hero-btn is-primary" />
                    <i className="ic-hero-btn" />
                </span>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Cadre interactif                                                     */
/* ------------------------------------------------------------------ */
function CropFrame({ source, target, crop, onChange, showOverlay }) {
    const curAspect = crop.aspect || target.aspect;
    const frameRef = useRef(null);
    const pointers = useRef(new Map());
    const pinchLast = useRef(null);
    const liveCrop = useRef(crop);
    const onChangeRef = useRef(onChange);
    const [dragging, setDragging] = useState(false);

    useEffect(() => {
        liveCrop.current = crop;
        onChangeRef.current = onChange;
    }, [crop, onChange]);

    const apply = useCallback((next) => {
        liveCrop.current = { ...liveCrop.current, ...next };
        onChangeRef.current(next);
    }, []);

    // Zoom autour d'un point de l'écran (la zone sous le doigt/curseur reste fixe)
    const zoomAt = useCallback((clientX, clientY, factor) => {
        const frame = frameRef.current;
        if (!frame) return;
        const rect = frame.getBoundingClientRect();
        const px = clamp((clientX - rect.left) / rect.width, 0, 1);
        const py = clamp((clientY - rect.top) / rect.height, 0, 1);
        const cur = getView(source, curAspect, liveCrop.current);
        const newZoom = clamp(cur.zoom * factor, MIN_ZOOM, MAX_ZOOM);
        const next = getView(source, curAspect, { ...liveCrop.current, zoom: newZoom });
        const ix = cur.left + px * cur.vw;
        const iy = cur.top + py * cur.vh;
        apply({
            zoom: newZoom,
            cx: (ix - px * next.vw + next.vw / 2) / source.w,
            cy: (iy - py * next.vh + next.vh / 2) / source.h,
        });
    }, [source, curAspect, apply]);

    // Molette : listener natif non passif pour pouvoir bloquer le défilement de la page
    useEffect(() => {
        const el = frameRef.current;
        if (!el) return undefined;
        const onWheel = (e) => {
            e.preventDefault();
            zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * 0.0018));
        };
        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    }, [zoomAt]);

    const onPointerDown = (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        frameRef.current?.setPointerCapture?.(e.pointerId);
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pointers.current.size === 2) {
            const [a, b] = [...pointers.current.values()];
            pinchLast.current = Math.hypot(a.x - b.x, a.y - b.y);
        }
        setDragging(true);
    };

    const onPointerMove = (e) => {
        const prev = pointers.current.get(e.pointerId);
        if (!prev) return;
        const point = { x: e.clientX, y: e.clientY };
        pointers.current.set(e.pointerId, point);

        if (pointers.current.size >= 2) {
            const [a, b] = [...pointers.current.values()];
            const dist = Math.hypot(a.x - b.x, a.y - b.y);
            if (pinchLast.current && dist > 0) {
                zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, dist / pinchLast.current);
            }
            pinchLast.current = dist;
            return;
        }

        const rect = frameRef.current.getBoundingClientRect();
        const cur = getView(source, curAspect, liveCrop.current);
        const k = cur.vw / rect.width; // pixels de la photo par pixel d'écran
        apply({
            zoom: cur.zoom,
            cx: cur.cx - ((point.x - prev.x) * k) / source.w,
            cy: cur.cy - ((point.y - prev.y) * k) / source.h,
        });
    };

    const endPointer = (e) => {
        pointers.current.delete(e.pointerId);
        if (pointers.current.size < 2) pinchLast.current = null;
        if (pointers.current.size === 0) setDragging(false);
    };

    const onKeyDown = (e) => {
        const cur = getView(source, curAspect, liveCrop.current);
        const stepX = (cur.vw * 0.04) / source.w;
        const stepY = (cur.vh * 0.04) / source.h;
        const map = {
            ArrowLeft: { cx: cur.cx - stepX },
            ArrowRight: { cx: cur.cx + stepX },
            ArrowUp: { cy: cur.cy - stepY },
            ArrowDown: { cy: cur.cy + stepY },
        };
        if (map[e.key]) {
            e.preventDefault();
            apply({ zoom: cur.zoom, cx: cur.cx, cy: cur.cy, ...map[e.key] });
        } else if (e.key === '+' || e.key === '=') {
            e.preventDefault();
            const r = frameRef.current.getBoundingClientRect();
            zoomAt(r.left + r.width / 2, r.top + r.height / 2, 1.12);
        } else if (e.key === '-') {
            e.preventDefault();
            const r = frameRef.current.getBoundingClientRect();
            zoomAt(r.left + r.width / 2, r.top + r.height / 2, 1 / 1.12);
        }
    };

    const view = getView(source, curAspect, crop);
    const portrait = curAspect < 1;

    return (
        <div
            ref={frameRef}
            className={`ic-frame ${dragging ? 'is-dragging' : ''} ${portrait ? 'is-portrait' : 'is-landscape'}`}
            style={{ '--ar': curAspect }}
            tabIndex={0}
            role="application"
            aria-label={`Cadrage ${target.shortLabel}. Flèches pour déplacer, plus et moins pour zoomer.`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endPointer}
            onPointerCancel={endPointer}
            onKeyDown={onKeyDown}
        >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                className="ic-img"
                src={source.url}
                alt=""
                draggable={false}
                style={{
                    width: `${(source.w / view.vw) * 100}%`,
                    left: `${(-view.left / view.vw) * 100}%`,
                    top: `${(-view.top / view.vh) * 100}%`,
                }}
            />
            {showOverlay && <HeroOverlay portrait={portrait} />}
            <div className="ic-grid" aria-hidden="true" />
            <div className="ic-frame-hint" aria-hidden="true">
                <Move size={13} /> Glissez pour cadrer
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Fenêtre principale                                                   */
/* ------------------------------------------------------------------ */
export default function ImageCropperModal({
    items: initialItems,
    targets = HERO_CROP_TARGETS,
    title = 'Cadrer vos photos',
    confirmLabel,
    heroPreview = true,
    onCancel,
    onConfirm,
    onComplete,
}) {
    const [list, setList] = useState(initialItems);
    const [activeIdx, setActiveIdx] = useState(0);
    const [activeTarget, setActiveTarget] = useState(targets[0].key);
    const [sources, setSources] = useState({});
    const [crops, setCrops] = useState(() => {
        const init = {};
        initialItems.forEach((item) => {
            init[item.id] = {};
            targets.forEach((t) => {
                init[item.id][t.key] = { ...defaultCrop(t), ...(item.crops?.[t.key] || {}) };
            });
        });
        return init;
    });
    const [showOverlay, setShowOverlay] = useState(false);
    const [processing, setProcessing] = useState(null); // { done, total }
    const [error, setError] = useState('');

    const aliveRef = useRef(true);
    const startedRef = useRef(new Set());
    const urlsRef = useRef([]);

    useEffect(() => {
        aliveRef.current = true;
        return () => {
            aliveRef.current = false;
        };
    }, []);

    // Libère les URL temporaires à la fermeture réelle de la fenêtre
    useEffect(() => {
        const urls = urlsRef.current;
        return () => {
            urls.forEach((u) => URL.revokeObjectURL(u));
        };
    }, []);

    // Verrouille le défilement de la page derrière la fenêtre + Échap pour fermer
    useEffect(() => {
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prevOverflow;
        };
    }, []);

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape' && !processing) onCancel?.();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onCancel, processing]);

    // Chargement (décodage) de chaque photo, une seule fois
    useEffect(() => {
        list.forEach((item) => {
            if (startedRef.current.has(item.id)) return;
            startedRef.current.add(item.id);
            loadSource(item)
                .then((src) => {
                    urlsRef.current.push(src.url);
                    if (!aliveRef.current) return;
                    setSources((prev) => ({ ...prev, [item.id]: { status: 'ready', ...src } }));

                    // Détection automatique du ratio d'origine (pour préserver 16:9, 4:5, 4:3, etc. sans forcer 1:1)
                    const imgRatio = src.w / src.h;
                    setCrops((prev) => {
                        const itemCrops = prev[item.id];
                        if (!itemCrops) return prev;
                        let modified = false;
                        const nextTargetCrops = { ...itemCrops };
                        targets.forEach((t) => {
                            const cur = nextTargetCrops[t.key];
                            if (cur && !cur.touched && t.aspectOptions) {
                                const detected = findClosestAspect(imgRatio, t.aspectOptions, cur.aspect || t.aspect);
                                if (detected && Math.abs(detected - (cur.aspect || 0)) > 0.01) {
                                    nextTargetCrops[t.key] = { ...cur, aspect: detected };
                                    modified = true;
                                }
                            }
                        });
                        return modified ? { ...prev, [item.id]: nextTargetCrops } : prev;
                    });
                })
                .catch(() => {
                    if (!aliveRef.current) return;
                    setSources((prev) => ({ ...prev, [item.id]: { status: 'error' } }));
                });
        });
    }, [list, targets]);

    const item = list[activeIdx] || list[0];
    const source = item ? sources[item.id] : null;
    const multi = list.length > 1;
    const multiTargets = targets.length > 1;

    const setCrop = useCallback((itemId, key, patch) => {
        setCrops((prev) => ({
            ...prev,
            [itemId]: { ...prev[itemId], [key]: { ...prev[itemId][key], ...patch, touched: true } },
        }));
    }, []);

    const goTo = (idx) => setActiveIdx(clamp(idx, 0, list.length - 1));

    const removeItem = (idx) => {
        if (list.length <= 1) {
            onCancel?.();
            return;
        }
        setList((prev) => prev.filter((_, i) => i !== idx));
        setActiveIdx((cur) => clamp(idx < cur ? cur - 1 : cur === idx ? Math.min(cur, list.length - 2) : cur, 0, list.length - 2));
    };

    const applyToAll = () => {
        const current = crops[item.id];
        setCrops((prev) => {
            const next = { ...prev };
            list.forEach((it) => {
                if (it.id === item.id) return;
                next[it.id] = { ...prev[it.id] };
                targets.forEach((t) => {
                    next[it.id][t.key] = {
                        ...prev[it.id][t.key],
                        zoom: current[t.key].zoom,
                        cx: current[t.key].cx,
                        cy: current[t.key].cy,
                        aspect: current[t.key].aspect,
                        enabled: current[t.key].enabled,
                        touched: true,
                    };
                });
            });
            return next;
        });
    };

    const handleConfirm = async () => {
        setError('');
        setProcessing({ done: 0, total: list.length });
        try {
            const results = [];
            for (let i = 0; i < list.length; i += 1) {
                const it = list[i];
                const src = sources[it.id];
                const outputs = {};
                if (src?.status === 'ready') {
                    for (const t of targets) {
                        const c = crops[it.id][t.key];
                        if (!c.enabled) continue;
                        outputs[t.key] = await renderCrop(src, t, c, baseNameOf(it));
                    }
                } else if (it.file) {
                    // Format non lisible par le navigateur (ex. HEIC) : on garde le fichier tel quel
                    const first = targets.find((t) => !t.optional) || targets[0];
                    outputs[first.key] = it.file;
                }
                results.push({
                    id: it.id,
                    name: it.name || it.file?.name || '',
                    original: it.file || null,
                    outputs,
                    crops: crops[it.id],
                    unreadable: src?.status === 'error',
                });
                if (aliveRef.current) setProcessing({ done: i + 1, total: list.length });
            }
            const callback = onConfirm || onComplete;
            if (callback) {
                await callback(results);
            }
        } catch (err) {
            console.error('Crop error:', err);
            if (aliveRef.current) {
                setError(err?.message || 'Une erreur est survenue pendant le recadrage.');
                setProcessing(null);
            }
        }
    };

    if (typeof document === 'undefined' || !item) return null;

    const unreadableCount = list.filter((it) => sources[it.id]?.status === 'error').length;
    const ready = source?.status === 'ready';
    const activeCropState = crops[item.id] || {};

    const targetIcon = (t, size = 16) => {
        if (t.icon === 'mobile') return <Smartphone size={size} />;
        if (t.icon === 'square') return <Square size={size} />;
        if (t.icon === 'file') return <FileText size={size} />;
        if (t.icon === 'image') return <ImageIcon size={size} />;
        return <Monitor size={size} />;
    };

    const modal = (
        <div className="ic-backdrop" role="dialog" aria-modal="true" aria-label={title}>
            <div className="ic-dialog">
                {/* En-tête */}
                <header className="ic-header">
                    <div className="ic-header-text">
                        <h2 className="ic-title">{title}</h2>
                        <p className="ic-subtitle">
                            {multi ? `Photo ${activeIdx + 1} sur ${list.length} · ` : ''}
                            Déplacez et zoomez la photo : ce que vous voyez dans le cadre sera publié.
                        </p>
                    </div>
                    {heroPreview && (
                        <button
                            type="button"
                            className={`ic-chip ${showOverlay ? 'is-on' : ''}`}
                            onClick={() => setShowOverlay((v) => !v)}
                            aria-pressed={showOverlay}
                            title="Affiche le dégradé et le texte par-dessus la photo, comme sur le site"
                        >
                            {showOverlay ? <EyeOff size={15} /> : <Eye size={15} />}
                            <span>Voir comme sur le site</span>
                        </button>
                    )}
                    <button type="button" className="ic-icon-btn" onClick={onCancel} disabled={!!processing} aria-label="Fermer">
                        <X size={20} />
                    </button>
                </header>

                {/* Corps */}
                <div className="ic-body">
                    {multiTargets && (
                        <div className="ic-tabs" role="tablist" aria-label="Format à cadrer">
                            {targets.map((t) => {
                                const c = activeCropState[t.key];
                                const off = t.optional && c && !c.enabled;
                                return (
                                    <button
                                        key={t.key}
                                        type="button"
                                        role="tab"
                                        aria-selected={activeTarget === t.key}
                                        className={`ic-tab ${activeTarget === t.key ? 'is-active' : ''} ${off ? 'is-off' : ''}`}
                                        onClick={() => setActiveTarget(t.key)}
                                    >
                                        {targetIcon(t, 16)}
                                        <span>{t.shortLabel}</span>
                                        <em>{t.ratioLabel}</em>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {(!source || source.status === 'loading') && (
                        <div className="ic-state">
                            <Loader2 size={28} className="ic-spin" />
                            <p>Chargement de la photo…</p>
                        </div>
                    )}

                    {source?.status === 'error' && (
                        <div className="ic-state is-error">
                            <ImageOff size={30} />
                            <p>
                                <strong>Cette photo ne peut pas être affichée pour le recadrage.</strong>
                                <br />
                                {item.file
                                    ? 'Le format n’est pas lu par votre navigateur (ex. HEIC). Elle sera importée telle quelle, sans recadrage.'
                                    : 'Impossible de charger cette image (source externe ou fichier introuvable). Importez-la à nouveau depuis votre appareil.'}
                            </p>
                        </div>
                    )}

                    {ready && (
                        <div className={`ic-targets count-${targets.length}`}>
                            {targets.map((t) => {
                                const c = activeCropState[t.key] || defaultCrop(t);
                                const curAspect = c.aspect || t.aspect;
                                const isActive = activeTarget === t.key;
                                const portrait = curAspect < 1;
                                const view = getView(source, curAspect, c);
                                const currentRatioLabel = t.aspectOptions?.find((o) => Math.abs(o.value - curAspect) < 0.01)?.shortLabel || t.ratioLabel;
                                return (
                                    <section
                                        key={t.key}
                                        className={`ic-target ${portrait ? 'is-portrait' : 'is-landscape'} ${isActive ? 'is-active' : ''}`}
                                        aria-label={`Cadrage ${t.label}`}
                                    >
                                        <div className="ic-target-head">
                                            <span className="ic-target-name">
                                                {targetIcon(t, 16)} {t.label}
                                                <em>{currentRatioLabel}</em>
                                            </span>
                                            {t.optional && (
                                                <button
                                                    type="button"
                                                    className={`ic-switch ${c.enabled ? 'is-on' : ''}`}
                                                    onClick={() => setCrop(item.id, t.key, { enabled: !c.enabled })}
                                                    aria-pressed={c.enabled}
                                                    title={c.enabled ? 'Désactiver ce format' : 'Activer ce format'}
                                                >
                                                    <Power size={13} />
                                                    {c.enabled ? 'Activé' : 'Désactivé'}
                                                </button>
                                            )}
                                        </div>

                                        {t.aspectOptions && t.aspectOptions.length > 1 && (
                                            <div className="ic-ratio-bar" role="group" aria-label="Format de cadrage">
                                                <span className="ic-ratio-title">Format :</span>
                                                <div className="ic-ratio-options">
                                                    {t.aspectOptions.map((opt) => {
                                                        const isCur = Math.abs(curAspect - opt.value) < 0.01;
                                                        return (
                                                            <button
                                                                key={opt.shortLabel || opt.label}
                                                                type="button"
                                                                className={`ic-ratio-btn ${isCur ? 'is-active' : ''}`}
                                                                onClick={() => setCrop(item.id, t.key, { aspect: opt.value, zoom: 1, cx: 0.5, cy: 0.5 })}
                                                                title={opt.label}
                                                            >
                                                                {opt.shortLabel || opt.label}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {c.enabled ? (
                                            <>
                                                <CropFrame
                                                    source={source}
                                                    target={t}
                                                    crop={c}
                                                    onChange={(patch) => setCrop(item.id, t.key, patch)}
                                                    showOverlay={showOverlay}
                                                />
                                                <div className="ic-controls">
                                                    <button
                                                        type="button"
                                                        className="ic-icon-btn is-small"
                                                        onClick={() => setCrop(item.id, t.key, { zoom: clamp(view.zoom - 0.25, MIN_ZOOM, MAX_ZOOM) })}
                                                        disabled={view.zoom <= MIN_ZOOM}
                                                        aria-label="Dézoomer"
                                                    >
                                                        <ZoomOut size={16} />
                                                    </button>
                                                    <input
                                                        type="range"
                                                        className="ic-range"
                                                        min={MIN_ZOOM}
                                                        max={MAX_ZOOM}
                                                        step="0.01"
                                                        value={view.zoom}
                                                        onChange={(e) => setCrop(item.id, t.key, { zoom: parseFloat(e.target.value) })}
                                                        aria-label={`Zoom ${t.shortLabel}`}
                                                    />
                                                    <button
                                                        type="button"
                                                        className="ic-icon-btn is-small"
                                                        onClick={() => setCrop(item.id, t.key, { zoom: clamp(view.zoom + 0.25, MIN_ZOOM, MAX_ZOOM) })}
                                                        disabled={view.zoom >= MAX_ZOOM}
                                                        aria-label="Zoomer"
                                                    >
                                                        <ZoomIn size={16} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="ic-chip is-small"
                                                        onClick={() => setCrop(item.id, t.key, { zoom: 1, cx: 0.5, cy: 0.5 })}
                                                        title="Remettre le cadrage au centre"
                                                    >
                                                        <RotateCcw size={13} /> Recentrer
                                                    </button>
                                                </div>
                                                <p className="ic-hint">{t.hint}</p>
                                            </>
                                        ) : (
                                            <div className="ic-disabled" style={{ '--ar': curAspect }}>
                                                <Smartphone size={26} />
                                                <p>{t.disabledHint || 'Ce format est désactivé.'}</p>
                                                <button
                                                    type="button"
                                                    className="ic-chip"
                                                    onClick={() => setCrop(item.id, t.key, { enabled: true })}
                                                >
                                                    Activer ce format
                                                </button>
                                            </div>
                                        )}
                                    </section>
                                );
                            })}
                        </div>
                    )}

                    {/* Bandeau de vignettes : plusieurs photos */}
                    {multi && (
                        <div className="ic-strip-wrap">
                            <div className="ic-strip" role="listbox" aria-label="Photos à cadrer">
                                {list.map((it, idx) => {
                                    const s = sources[it.id];
                                    const touched = targets.some((t) => crops[it.id]?.[t.key]?.touched);
                                    return (
                                        <div key={it.id} className={`ic-thumb ${idx === activeIdx ? 'is-active' : ''}`}>
                                            <button
                                                type="button"
                                                className="ic-thumb-btn"
                                                role="option"
                                                aria-selected={idx === activeIdx}
                                                onClick={() => goTo(idx)}
                                                aria-label={`Photo ${idx + 1}`}
                                            >
                                                {s?.status === 'ready' ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={s.url} alt="" draggable={false} />
                                                ) : s?.status === 'error' ? (
                                                    <ImageOff size={18} />
                                                ) : (
                                                    <Loader2 size={16} className="ic-spin" />
                                                )}
                                                <span className="ic-thumb-num">{idx + 1}</span>
                                                {touched && <span className="ic-thumb-ok"><Check size={11} /></span>}
                                            </button>
                                            <button
                                                type="button"
                                                className="ic-thumb-remove"
                                                onClick={() => removeItem(idx)}
                                                aria-label={`Retirer la photo ${idx + 1}`}
                                                title="Retirer cette photo"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="ic-strip-actions">
                                <button type="button" className="ic-icon-btn is-small" onClick={() => goTo(activeIdx - 1)} disabled={activeIdx === 0} aria-label="Photo précédente">
                                    <ChevronLeft size={18} />
                                </button>
                                <button type="button" className="ic-icon-btn is-small" onClick={() => goTo(activeIdx + 1)} disabled={activeIdx === list.length - 1} aria-label="Photo suivante">
                                    <ChevronRight size={18} />
                                </button>
                                {ready && (
                                    <button type="button" className="ic-chip is-small" onClick={applyToAll} title="Reprend le zoom et la position de cette photo pour toutes les autres">
                                        <Copy size={13} /> Même cadrage pour toutes
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {unreadableCount > 0 && ready && (
                        <p className="ic-warning">
                            {unreadableCount} photo{unreadableCount > 1 ? 's' : ''} ne peu{unreadableCount > 1 ? 'vent' : 't'} pas être recadrée{unreadableCount > 1 ? 's' : ''} (format non lisible) - elle{unreadableCount > 1 ? 's seront importées' : ' sera importée'} telle{unreadableCount > 1 ? 's' : ''} quelle{unreadableCount > 1 ? 's' : ''}.
                        </p>
                    )}
                    {error && <p className="ic-error">{error}</p>}
                </div>

                {/* Pied */}
                <footer className="ic-footer">
                    <p className="ic-footer-hint">
                        <Move size={14} /> Glisser · molette ou pincement pour zoomer · flèches du clavier
                    </p>
                    <div className="ic-footer-actions">
                        <button type="button" className="ic-btn is-secondary" onClick={onCancel} disabled={!!processing}>
                            Annuler
                        </button>
                        <button
                            type="button"
                            className="ic-btn is-primary"
                            onClick={handleConfirm}
                            disabled={!!processing || list.some((it) => !['ready', 'error'].includes(sources[it.id]?.status))}
                        >
                            {processing ? (
                                <>
                                    <Loader2 size={16} className="ic-spin" /> Préparation {processing.done}/{processing.total}…
                                </>
                            ) : (
                                <>
                                    <Check size={16} />
                                    {confirmLabel || (multi ? `Valider les ${list.length} photos` : 'Valider le cadrage')}
                                </>
                            )}
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );

    return createPortal(modal, document.body);
}
