import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { Clock, Eye } from "lucide-react";
import { useEffect, useRef } from "react";
import { fetchBlogBySlug, toggleBlogLike } from "../services/blogService.js";
import LikeButton from "../components/LikeButton.jsx";
import CommentSection from "../components/CommentSection.jsx";
import { DetailSkeleton } from "../components/LoadingState.jsx";

export default function BlogDetail() {
  const { slug } = useParams();
  const hasTrackedView = useRef(false);

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

  if (isLoading) return <DetailSkeleton />;
  if (isError || !data) return <p className="py-16 text-center text-red-600">Blog not found.</p>;

  const blog = data.data;

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <Helmet>
        <title>{blog.seo?.metaTitle || blog.title} | Nepal Tourism</title>
        <meta name="description" content={blog.seo?.metaDescription || blog.excerpt} />
        {blog.seo?.canonicalUrl && <link rel="canonical" href={blog.seo.canonicalUrl} />}
        <meta property="og:title" content={blog.seo?.metaTitle || blog.title} />
        <meta property="og:description" content={blog.seo?.metaDescription || blog.excerpt} />
        {(blog.seo?.ogImage || blog.featuredImage) && (
          <meta property="og:image" content={blog.seo?.ogImage || blog.featuredImage} />
        )}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: blog.title,
            image: blog.featuredImage ? [blog.featuredImage] : undefined,
            datePublished: blog.publishedAt,
            author: { "@type": "Person", name: blog.author?.name },
          })}
        </script>
      </Helmet>

      <nav className="mb-6 text-xs text-gray-600">
        <Link to="/" className="hover:text-blue-600">Home</Link> {" / "}
        <Link to="/blogs" className="hover:text-blue-600">Blogs</Link> {" / "}
        <span className="text-gray-900">{blog.title}</span>
      </nav>

      {blog.category?.name && <span className="text-xs font-medium text-blue-600">{blog.category.name}</span>}
      <h1 className="mb-4 mt-2 text-3xl font-normal text-gray-900">{blog.title}</h1>

      <div className="mb-8 flex items-center gap-4 text-xs text-gray-600">
        <span>{blog.author?.name}</span>
        <span className="flex items-center gap-1">
          <Clock size={12} /> {blog.readingTimeMinutes} min read
        </span>
        <span className="flex items-center gap-1">
          <Eye size={12} /> {blog.views} views
        </span>
      </div>

      {blog.featuredImage && (
        <img src={blog.featuredImage} alt={blog.title} className="mb-8 w-full rounded-2xl object-cover" />
      )}

      <div className="prose max-w-none whitespace-pre-line leading-relaxed text-gray-900">{blog.content}</div>

      <LikeButton
        targetId={blog._id}
        liked={data.isLikedByCurrentUser}
        likesCount={blog.likesCount}
        toggleFn={toggleBlogLike}
        queryKeyToInvalidate={["blog", slug]}
      />

      {data.relatedPosts?.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-lg font-medium text-gray-900">Related posts</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {data.relatedPosts.map((post) => (
              <Link
                key={post._id}
                to={`/blogs/${post.slug}`}
                className="block rounded-xl bg-white p-4 shadow-[0_1px_2px_0_rgba(60,64,67,0.3),0_1px_3px_1px_rgba(60,64,67,0.15)]"
              >
                <p className="line-clamp-2 text-sm font-medium text-gray-900">{post.title}</p>
                <p className="mt-1 text-xs text-gray-600">{post.readingTimeMinutes} min read</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <CommentSection targetType="Blog" targetId={blog._id} />
    </article>
  );
}