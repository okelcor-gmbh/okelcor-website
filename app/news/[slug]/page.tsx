import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import ArticleUI from "@/components/news/article-ui";
import { ALL_ARTICLES, getArticleBySlug, getLocalizedArticle, type Article } from "@/components/news/data";
import type { Locale } from "@/lib/translations";
import { SITE_URL } from "@/lib/constants";
import { apiFetch, type ApiArticle } from "@/lib/api";
import { getServerLocale } from "@/lib/locale";

const MONTHS: Record<string, string> = {
  January: "01", February: "02", March: "03", April: "04",
  May: "05", June: "06", July: "07", August: "08",
  September: "09", October: "10", November: "11", December: "12",
};

function toISODate(rawDate: string | null | undefined): string {
  if (!rawDate) return "";
  // Already ISO format (YYYY-MM-DD or ISO 8601)
  if (/^\d{4}-\d{2}-\d{2}/.test(rawDate)) return rawDate.slice(0, 10);
  // Human format: "14 March 2026"
  const [day, month, year] = rawDate.split(" ");
  if (!day || !month || !year) return rawDate;
  return `${year}-${MONTHS[month] ?? "01"}-${day.padStart(2, "0")}`;
}

/** Map API article shape → local Article shape. */
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

type Props = { params: Promise<{ slug: string }> };

// Pre-render static article slugs at build time.
// New articles added via the API CMS are ISR'd on first request.
export function generateStaticParams() {
  return ALL_ARTICLES.map((a) => ({ slug: a.slug }));
}

export const dynamicParams = true;

async function fetchArticle(slug: string, locale: string): Promise<Article | undefined> {
  try {
    const res = await apiFetch<ApiArticle>(`/articles/${slug}`, {
      locale,
      revalidate: 60,
      tags: ["articles", `article-${slug}`, `articles-${locale}`],
    });
    if (res.data) {
      const article = toArticle(res.data);
      // API returned the record but has no translation for this locale yet —
      // fall through to the static locale-aware fallback below.
      if (article.title.trim()) return article;
    }
  } catch {
    // API unreachable — fall through
  }
  // Static fallback: locale-aware first, then English-only as last resort
  return getLocalizedArticle(slug, locale as Locale) ?? getArticleBySlug(slug);
}

async function fetchRelatedArticles(
  slug: string,
  category: string,
  locale: string,
  count = 3
): Promise<Article[]> {
  try {
    const res = await apiFetch<ApiArticle[]>("/articles", {
      locale,
      revalidate: 60,
      tags: ["articles", `articles-${locale}`],
    });
    if (res.data?.length) {
      const mapped = res.data.map(toArticle);
      // Only use API results if they carry translated content
      if (mapped.some((a) => a.title.trim())) {
        return mapped
          .filter((a) => a.slug !== slug && a.category === category)
          .slice(0, count);
      }
    }
  } catch {
    // fall through
  }
  // Static locale-aware fallback
  const { getLocalizedRelatedArticles } = await import("@/components/news/data");
  return getLocalizedRelatedArticles(slug, locale as Locale, count);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getServerLocale();
  const article = await fetchArticle(slug, locale);
  if (!article) return { title: "Article Not Found" };

  return {
    title: article.title,
    description: article.summary,
    alternates: {
      canonical: `https://www.okelcor.com/news/${article.slug}`,
    },
    openGraph: {
      title: `${article.title} – Okelcor`,
      description: article.summary,
      url: `https://www.okelcor.com/news/${article.slug}`,
      type: "article",
      images: [{ url: article.image, width: 1200, height: 630, alt: article.title }],
    },
    twitter: {
      title: `${article.title} – Okelcor`,
      description: article.summary,
      images: [article.image],
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const locale = await getServerLocale();
  const article = await fetchArticle(slug, locale);
  if (!article) notFound();

  const related = await fetchRelatedArticles(slug, article.category, locale);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.summary,
    image: article.image?.startsWith("/") ? `${SITE_URL}${article.image}` : article.image,
    datePublished: toISODate(article.date),
    author: { "@type": "Organization", name: "Okelcor", url: SITE_URL },
    publisher: {
      "@type": "Organization",
      name: "Okelcor",
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/okelcor-logo.svg` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/news/${slug}` },
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <Navbar />
      <ArticleUI slug={slug} article={article} related={related} />
      <Footer />
    </main>
  );
}
