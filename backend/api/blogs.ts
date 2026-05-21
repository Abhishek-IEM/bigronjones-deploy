import { seedBlogs } from "../../shared/data/seedBlogs";

export const config = { runtime: "nodejs" };

export default async function handler(req: Request): Promise<Response> {
  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  // Handle preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const slug = searchParams.get("slug");

    if (slug) {
      const blog = seedBlogs.find((b) => b.slug === slug);
      if (!blog) {
        return new Response(JSON.stringify({ error: "Blog not found" }), {
          status: 404,
          headers: corsHeaders,
        });
      }
      return new Response(JSON.stringify(blog), {
        status: 200,
        headers: corsHeaders,
      });
    }

    let blogs = seedBlogs;
    if (category && category !== "All") {
      blogs = blogs.filter((b) => b.category === category);
    }

    return new Response(JSON.stringify(blogs), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("[/api/blogs]", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500, headers: corsHeaders },
    );
  }
}
