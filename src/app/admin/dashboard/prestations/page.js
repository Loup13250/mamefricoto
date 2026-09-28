import { redirect } from 'next/navigation';

export default function PrestationsRedirect() {
    redirect('/admin/dashboard/tarifs');
}
