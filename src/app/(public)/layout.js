import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function PublicLayout({ children }) {
    return (
        <>
            <Header />
            <div style={{ paddingTop: '80px', minHeight: 'calc(100vh - 80px)' }}>
                {children}
            </div>
            <Footer />
        </>
    );
}
