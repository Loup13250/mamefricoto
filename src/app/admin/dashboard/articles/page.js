import { getArticles } from '@/lib/data';
import ArticleClient from './ArticleClient';

export const dynamic = 'force-dynamic';

export default function ArticlesPage() {
    const articles = getArticles();
    return <ArticleClient articles={articles} />;
}
