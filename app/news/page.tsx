import type { Metadata } from "next";
import { getPageMeta } from "@/lib/metadata-i18n";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import NewsPageUI from "@/components/news/news-page-ui";
import { apiFetch, type ApiArticle } from "@/lib/api";
import { getLocalizedArticles, type Article } from "@/components/news/data";
import { getServerLocale } from "@/lib/locale";
import type { Locale } from "@/lib/translations";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const m = getPageMeta("news", locale);
  return {
    title: m.title,
    description: m.description,
    openGraph: {
      title: m.ogTitle,
      description: m.ogDescription,
      url: "https://www.okelcor.com/news",
      type: "website",
    },
    twitter: {
      title: m.twitterTitle,
      description: m.twitterDescription,
    },
  };
}

/** Map API article shape → local Article shape used by NewsCard / ArticleUI. */
function toArticle(a: ApiArticle): Article {
  return {
    slug:     a.slug,
    image:    a.image ?? a.image_url ?? "",
    category: a.category ?? "",
    title:    a.title ?? "",
    date:     a.published_at ?? a.date ?? "",
    readTime: a.read_time ?? "",
    summary:  a.summary ?? "",
    body:     Array.isArray(a.body) ? a.body : [],
  };
}

async function getArticles(locale: string): Promise<Article[]> {
  try {
    const res = await apiFetch<ApiArticle[]>("/articles", {
      locale,
      revalidate: 60,
      tags: ["articles", `articles-${locale}`],
    });
    if (res.data?.length) {
      const articles = res.data.map(toArticle);
      // If every article came back with an empty title the API has no
      // translations for this locale yet — use the static fallback instead.
      if (articles.some((a) => a.title.trim())) return articles;
    }
  } catch {
    // API unreachable — fall through to static data
  }
  return getLocalizedArticles(locale as Locale);
}

export default async function NewsPage() {
  const locale = await getServerLocale();
  const articles = await getArticles(locale);

  return (
    <main>
      <Navbar />
      <NewsPageUI articles={articles} locale={locale} />
      <Footer />
    </main>
  );
}
