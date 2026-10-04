import './admin.css';

export const metadata = {
    title: 'Administration | Mamé Fricoto',
    robots: {
        index: false,
        follow: false,
        nocache: true,
        googleBot: {
            index: false,
            follow: false,
        },
    },
};

export default function AdminLayout({ children }) {
    return children;
}
