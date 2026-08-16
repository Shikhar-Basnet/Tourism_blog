import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { Clock, Eye, CalendarDays, ArrowLeft, ArrowUp, Share2, Check } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import { fetchBlogBySlug, toggleBlogLike } from "../services/blogService.js";
import LikeButton from "../components/LikeButton.jsx";
import CommentSection from "../components/CommentSection.jsx";
import BlogCard from "../components/BlogCard.jsx";
import { DetailSkeleton } from "../components/LoadingState.jsx";

const SITE_URL = "https://www.nepaltourism.example";
const CARD_SHADOW = "shadow-[0_1px_2px_0_rgba(60,64,67,0.3),0_1px_3px_1px_rgba(60,64,67,0.15)]";

const TAG_COLORS = [
  "bg-blue-50 text-blue-700 hover:bg-blue-100",
  "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
  "bg-amber-50 text-amber-700 hover:bg-amber-100",
  "bg-rose-50 text-rose-700 hover:bg-rose-100",
  "bg-purple-50 text-purple-700 hover:bg-purple-100",
  "bg-cyan-50 text-cyan-700 hover:bg-cyan-100",
];

// Word-boundary truncation so meta descriptions never cut mid-word —
// Google renders roughly 150-160 chars of a snippet.
function truncate(str = "", max = 155) {
  if (str.length <= max) return str;
  const cut = str.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(" ")) + "…";
}

// Fixed top progress bar — a small but very "senior UX" touch on long-form
// reading pages. Tracks scroll through the <article> only, not the footer/
// related-posts sections, so it reads 100% right as the content ends.
function ReadingProgressBar({ targetRef }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = targetRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const scrolled = Math.min(Math.max(-rect.top, 0), Math.max(total, 1));
      setProgress(total > 0 ? (scrolled / total) * 100 : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [targetRef]);

  return (
    <div className="fixed inset-x-0 top-0 z-40 h-0.5 bg-transparent">
      <div
        className="h-full bg-gradient-to-r from-blue-500 to-sky-400 transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

// Copy-link share button with a small "Copied" confirmation state —
// avoids the ambiguity of a share icon that gives no feedback on click.
function ShareButton({ url, className = "" }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ url });
        return;
      }
    } catch {
      // user cancelled the native share sheet — fall through to clipboard
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard unavailable — silently no-op
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className={`flex touch-manipulation items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-all active:scale-[0.97] ${
        copied
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50"
      } ${className}`}
    >
      {copied ? <Check size={15} /> : <Share2 size={15} />}
      {copied ? "Link copied" : "Share"}
    </button>
  );
}

export default function BlogDetail() {
  const { slug } = useParams();
  const hasTrackedView = useRef(false);
  const articleRef = useRef(null);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["blog", slug],
    queryFn: () => fetchBlogBySlug(slug),
  });

  useEffect(() => {
    if (!data?.data?._id || hasTrackedView.current) return;

    hasTrackedView.current = true;
    const viewedAt = window.sessionStorage.getItem(`blog-view:${data.data._id}`);
    if (!viewedAt) {
      window.sessionStorage.setItem(`blog-view:${data.data._id}`, "1");
    }
  }, [data]);

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 900);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  if (isLoading) return <DetailSkeleton />;
  if (isError || !data) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <p className="text-lg font-medium text-gray-900">Blog not found</p>
        <p className="mt-2 text-sm text-gray-600">This story may have been moved or unpublished.</p>
        <Link
          to="/blogs"
          className="mt-6 inline-flex touch-manipulation items-center gap-2 rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-blue-700 active:scale-[0.97]"
        >
          <ArrowLeft size={14} /> Back to all stories
        </Link>
      </div>
    );
  }

  const blog = data.data;
  const canonicalUrl = blog.seo?.canonicalUrl || `${SITE_URL}/blogs/${blog.slug}`;
  const metaTitle = blog.seo?.metaTitle || blog.title;
  const metaDescription = truncate(blog.seo?.metaDescription || blog.excerpt || blog.title);
  const ogImage = blog.seo?.ogImage || blog.featuredImage;
  const publishedDate = blog.publishedAt
    ? new Date(blog.publishedAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
    : null;
  const updatedDate = blog.updatedAt
    ? new Date(blog.updatedAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
    : null;
  const authorInitial = blog.author?.name?.[0]?.toUpperCase();

  return (
    <div className="bg-white">
      <Helmet>
        <title>{`${metaTitle} | Nepal Tourism Blog`}</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={canonicalUrl} />

        <meta property="og:type" content="article" />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:url" content={canonicalUrl} />
        {ogImage && <meta property="og:image" content={ogImage} />}
        {blog.publishedAt && <meta property="article:published_time" content={blog.publishedAt} />}
        {blog.updatedAt && <meta property="article:modified_time" content={blog.updatedAt} />}
        {blog.category?.name && <meta property="article:section" content={blog.category.name} />}
        {blog.tags?.map((tag) => (
          <meta key={tag} property="article:tag" content={tag} />
        ))}

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={metaTitle} />
        <meta name="twitter:description" content={metaDescription} />
        {ogImage && <meta name="twitter:image" content={ogImage} />}

        {/* Article structured data — eligible for Google's article rich results */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: blog.title,
            description: metaDescription,
            image: ogImage ? [ogImage] : undefined,
            datePublished: blog.publishedAt,
            dateModified: blog.updatedAt || blog.publishedAt,
            author: { "@type": "Person", name: blog.author?.name || "Nepal Tourism" },
            publisher: {
              "@type": "Organization",
              name: "Nepal Tourism",
              logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` },
            },
            mainEntityOfPage: canonicalUrl,
          })}
        </script>

        {/* Breadcrumbs */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
              { "@type": "ListItem", position: 2, name: "Blogs", item: `${SITE_URL}/blogs` },
              { "@type": "ListItem", position: 3, name: blog.title, item: canonicalUrl },
            ],
          })}
        </script>
      </Helmet>

      <ReadingProgressBar targetRef={articleRef} />

      {/* ---------------- Magazine-style hero ---------------- */}
      <header className="relative">
        {blog.featuredImage ? (
          <div className="relative h-[46vh] min-h-[320px] w-full overflow-hidden sm:h-[56vh] md:h-[64vh]">
            <img
              src={blog.featuredImage}
              alt={blog.title}
              loading="eager"
              fetchpriority="high"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
            <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/40 to-transparent" />

            <div className="absolute inset-x-0 bottom-0">
              <div className="mx-auto max-w-3xl px-4 pb-8 sm:pb-10">
                <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-xs text-gray-300">
                  <Link to="/" className="touch-manipulation transition-colors hover:text-white">Home</Link>
                  <span>/</span>
                  <Link to="/blogs" className="touch-manipulation transition-colors hover:text-white">Blogs</Link>
                </nav>

                {blog.category?.name && (
                  <Link
                    to="/blogs"
                    className="touch-manipulation mb-3 inline-flex items-center rounded-md bg-blue-600 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-blue-500"
                  >
                    {blog.category.name}
                  </Link>
                )}
                <h1 className="text-2xl font-normal leading-tight text-white sm:text-3xl md:text-4xl">
                  {blog.title}
                </h1>

                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-200 sm:text-sm">
                  <span className="flex items-center gap-2">
                    {blog.author?.avatar ? (
                      <img src={blog.author.avatar} alt="" className="h-6 w-6 rounded-full border border-white/30" />
                    ) : (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-[10px] font-semibold text-white">
                        {authorInitial}
                      </span>
                    )}
                    {blog.author?.name}
                  </span>
                  <span className="flex items-center gap-1"><Clock size={13} /> {blog.readingTimeMinutes} min read</span>
                  <span className="flex items-center gap-1"><Eye size={13} /> {blog.views} views</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // No-image fallback keeps the same layout rhythm as the image case
          <div className="border-b border-gray-100 bg-gray-50 px-4 pb-10 pt-10 sm:pt-14">
            <div className="mx-auto max-w-3xl">
              <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-xs text-gray-500">
                <Link to="/" className="touch-manipulation transition-colors hover:text-blue-600">Home</Link>
                <span>/</span>
                <Link to="/blogs" className="touch-manipulation transition-colors hover:text-blue-600">Blogs</Link>
              </nav>
              {blog.category?.name && (
                <Link
                  to="/blogs"
                  className="touch-manipulation mb-3 inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700 transition-colors hover:bg-blue-100"
                >
                  {blog.category.name}
                </Link>
              )}
              <h1 className="text-2xl font-normal leading-tight text-gray-900 sm:text-3xl md:text-4xl">
                {blog.title}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-600 sm:text-sm">
                <span className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-[10px] font-semibold text-blue-700">
                    {authorInitial}
                  </span>
                  {blog.author?.name}
                </span>
                <span className="flex items-center gap-1"><Clock size={13} /> {blog.readingTimeMinutes} min read</span>
                <span className="flex items-center gap-1"><Eye size={13} /> {blog.views} views</span>
              </div>
            </div>
          </div>
        )}
      </header>

      <div ref={articleRef} className="mx-auto max-w-3xl px-4 py-10 sm:py-12">
        {publishedDate && (
          <p className="mb-8 flex items-center gap-1.5 text-xs text-gray-400">
            <CalendarDays size={12} />
            Published {publishedDate}
            {updatedDate && updatedDate !== publishedDate ? ` · Updated ${updatedDate}` : ""}
          </p>
        )}

        {/* Prose — slightly larger type, generous leading, a styled first-letter
            drop cap for a more editorial feel on longer reads. */}
        <article className="prose prose-gray max-w-none whitespace-pre-line text-[17px] leading-[1.85] text-gray-800 first-letter:float-left first-letter:mr-2 first-letter:text-5xl first-letter:font-semibold first-letter:leading-[0.9] first-letter:text-blue-700">
          {blog.content}
        </article>

        {blog.tags?.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2 border-t border-gray-100 pt-6">
            {blog.tags.map((tag, i) => (
              <span
                key={tag}
                className={`touch-manipulation cursor-default rounded-md px-3 py-1 text-xs font-medium transition-all active:scale-90 ${TAG_COLORS[i % TAG_COLORS.length]}`}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Engagement bar — like + share, sticky-feeling but static, consistent
            spacing with the tag row above it */}
        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-6">
          <LikeButton
            targetId={blog._id}
            liked={data.isLikedByCurrentUser}
            likesCount={blog.likesCount}
            toggleFn={toggleBlogLike}
            queryKeyToInvalidate={["blog", slug]}
          />
          <ShareButton url={canonicalUrl} />
        </div>

        {/* Author card — small credibility/E-E-A-T signal, also good for AdSense
            "who wrote this" trust review criteria */}
        <div className={`mt-8 flex items-center gap-4 rounded-lg border border-gray-100 bg-gray-50 p-5 ${CARD_SHADOW}`}>
          {blog.author?.avatar ? (
            <img src={blog.author.avatar} alt="" className="h-12 w-12 shrink-0 rounded-full" />
          ) : (
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600 text-base font-semibold text-white">
              {authorInitial}
            </span>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900">Written by {blog.author?.name}</p>
            <p className="mt-0.5 text-xs text-gray-600">
              Contributor at Nepal Tourism — verified destination and travel-story author.
            </p>
          </div>
        </div>

        <div className="mt-12">
          <CommentSection targetType="Blog" targetId={blog._id} />
        </div>
      </div>

      {/* ---------------- Related posts — full-width tinted band ---------------- */}
      {data.relatedPosts?.length > 0 && (
        <section className="border-t border-gray-100 bg-gray-50 px-4 py-14">
          <div className="mx-auto max-w-5xl">
            <div className="mb-6 flex items-end justify-between gap-4">
              <h2 className="text-lg font-medium text-gray-900">Keep reading</h2>
              <Link
                to="/blogs"
                className="touch-manipulation flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 active:bg-blue-100"
              >
                All stories <ArrowLeft size={14} className="rotate-180" />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              {data.relatedPosts.map((post) => (
                <BlogCard key={post._id} blog={post} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Back-to-top — appears after scrolling past the hero, mobile-first tap target */}
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Back to top"
        className={`fixed bottom-5 right-5 z-40 flex h-11 w-11 touch-manipulation items-center justify-center rounded-full bg-gray-900 text-white shadow-lg transition-all duration-300 active:scale-90 ${
          showBackToTop ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        <ArrowUp size={18} />
      </button>
    </div>
  );
}