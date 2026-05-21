import { useParams, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import type { Blog } from "@/lib/blogClient";
import { blogClient } from "@/lib/blogClient";
import BlogArticleView from "@/components/blog/BlogArticleView";

export default function BlogArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [related, setRelated] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!slug) {
        setLoading(false);
        return;
      }

      try {
        const blogData = await blogClient.getBlogBySlug(slug);
        if (!blogData) {
          setLoading(false);
          return;
        }

        setBlog(blogData);

        const all = await blogClient.getAllBlogs();
        const sameCategory = all.filter(
          (b) => b.slug !== slug && b.category === blogData.category,
        );
        const others = all.filter(
          (b) =>
            b.slug !== slug && !sameCategory.find((c) => c.slug === b.slug),
        );
        setRelated([...sameCategory, ...others].slice(0, 3));
      } catch (error) {
        console.error("Failed to load blog:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!blog) return <Navigate to="/404" replace />;

  return (
    <>
      <title>{`${blog.title} | BigRonJones`}</title>
      <meta name="description" content={blog.excerpt} />
      <meta property="og:title" content={blog.title} />
      <meta property="og:description" content={blog.excerpt} />
      <meta property="og:type" content="article" />
      <meta property="og:image" content={blog.coverImage} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={blog.title} />
      <meta name="twitter:description" content={blog.excerpt} />
      <meta name="twitter:image" content={blog.coverImage} />
      <BlogArticleView blog={blog} related={related} />
    </>
  );
}
