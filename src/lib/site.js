const RAW_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://mamefricoto.vercel.app';

export const SITE_URL = RAW_URL.replace(/\/+$/, '');

export function absoluteUrl(path = '') {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${SITE_URL}${cleanPath}`;
}
