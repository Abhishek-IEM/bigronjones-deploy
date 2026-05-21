/**
 * Browser-safe blog client — calls backend API instead of direct file access.
 * Frontend never imports Node.js modules (fs, path).
 */

export interface Blog {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  tags: string[];
  body: string;
  excerpt: string;
  readingTime: string;
  challengeOfTheDay: string;
  publishedAt: string;
  aiGenerated: boolean;
  featured: boolean;
  coverImage: string;
  author: { name: string; avatar: string; title: string };
}

const API_BASE = import.meta.env.VITE_API_URL || "";

class BlogClient {
  private cache: Blog[] | null = null;
  private cacheTime = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  async getAllBlogs(): Promise<Blog[]> {
    if (this.cache && Date.now() - this.cacheTime < this.CACHE_DURATION) {
      return this.cache;
    }

    try {
      const response = await fetch(`${API_BASE}/api/blogs`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch blogs: ${response.statusText}`);
      }

      const data = (await response.json()) as { blogs: Blog[] };
      this.cache = data.blogs;
      this.cacheTime = Date.now();
      return this.cache;
    } catch (error) {
      console.error("[blogClient] Failed to fetch all blogs:", error);
      return [];
    }
  }

  async getBlogBySlug(slug: string): Promise<Blog | null> {
    try {
      const response = await fetch(
        `${API_BASE}/api/blogs/${encodeURIComponent(slug)}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        },
      );

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch blog: ${response.statusText}`);
      }

      const data = (await response.json()) as { blog: Blog };
      return data.blog;
    } catch (error) {
      console.error(`[blogClient] Failed to fetch blog ${slug}:`, error);
      return null;
    }
  }

  async searchBlogs(query: string): Promise<Blog[]> {
    try {
      const blogs = await this.getAllBlogs();
      const lower = query.toLowerCase();
      return blogs.filter(
        (blog) =>
          blog.title.toLowerCase().includes(lower) ||
          blog.excerpt.toLowerCase().includes(lower) ||
          blog.body.toLowerCase().includes(lower) ||
          blog.tags.some((tag) => tag.toLowerCase().includes(lower)),
      );
    } catch (error) {
      console.error("[blogClient] Failed to search blogs:", error);
      return [];
    }
  }

  async getFeaturedBlogs(): Promise<Blog[]> {
    try {
      const blogs = await this.getAllBlogs();
      return blogs.filter((blog) => blog.featured).slice(0, 3);
    } catch (error) {
      console.error("[blogClient] Failed to fetch featured blogs:", error);
      return [];
    }
  }

  clearCache(): void {
    this.cache = null;
    this.cacheTime = 0;
  }
}

export const blogClient = new BlogClient();
