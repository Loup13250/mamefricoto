import './admin.css';

export const metadata = {
    title: 'Administration',
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
