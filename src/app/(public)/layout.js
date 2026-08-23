import { getSiteInfo } from '@/lib/data';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const revalidate = 300;

export default async function PublicLayout({ children }) {
    const siteInfo = await getSiteInfo();

    return (
        <>
            <Header siteInfo={siteInfo} />
            <div style={{ paddingTop: '80px', minHeight: 'calc(100vh - 80px)' }}>
                {children}
            </div>
            <Footer siteInfo={siteInfo} />
        </>
    );
}
