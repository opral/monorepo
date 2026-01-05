import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { parse } from "@opral/markdown-wc";
import { getBlogDescription, getBlogTitle } from "../../blog/blogMetadata";

const ogImage =
  "https://cdn.jsdelivr.net/gh/opral/inlang@latest/packages/website/public/opengraph/inlang-social-image.jpg";

const loadBlogIndex = createServerFn({ method: "GET" }).handler(async () => {
  const fs = await import("node:fs/promises");
  const repositoryRoot = import.meta.url.slice(
    0,
    import.meta.url.lastIndexOf("inlang/packages")
  );
  const blogDir = repositoryRoot + "inlang/blog/";
  const tocPath = blogDir + "tableOfContents.json";
  const tocContent = await fs.readFile(new URL(tocPath), "utf-8");
  const toc = JSON.parse(tocContent) as Array<{
    path: string;
    slug: string;
    date?: string;
  }>;

  const posts = await Promise.all(
    toc.map(async (item) => {
      const relativePath = item.path.startsWith("./")
        ? item.path.slice(2)
        : item.path;
      const markdownPath = blogDir + relativePath;
      const rawMarkdown = await fs.readFile(new URL(markdownPath), "utf-8");
      const parsed = await parse(rawMarkdown);
      const title = getBlogTitle({
        rawMarkdown,
        frontmatter: parsed.frontmatter,
      });
      const description = getBlogDescription({
        rawMarkdown,
        frontmatter: parsed.frontmatter,
      });

      return {
        slug: item.slug,
        title,
        description,
        date: item.date,
      };
    })
  );

  posts.sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  return { posts };
});

export const Route = createFileRoute("/blog/")({
  loader: async () => {
    return await loadBlogIndex();
  },
  head: () => ({
    meta: [
      { title: "Blog | inlang" },
      {
        name: "description",
        content:
          "Thoughts on i18n, git-based architecture, and building developer tools for globalization.",
      },
      { name: "og:title", content: "Blog | inlang" },
      {
        name: "og:description",
        content:
          "Thoughts on i18n, git-based architecture, and building developer tools for globalization.",
      },
      { name: "og:image", content: ogImage },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: ogImage },
      { name: "twitter:title", content: "Blog | inlang" },
      {
        name: "twitter:description",
        content:
          "Thoughts on i18n, git-based architecture, and building developer tools for globalization.",
      },
    ],
  }),
  component: BlogIndexPage,
});

function BlogIndexPage() {
  const { posts } = Route.useLoaderData();

  return (
    <main className="bg-white text-slate-900">
      <div className="mx-auto max-w-3xl px-6 py-16">
        {/* Header */}
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-12">
          Blog
        </h1>

        {/* Blog post list */}
        <div className="flex flex-col gap-1">
          {posts.map((post) => (
            <Link
              key={post.slug}
              to={`/blog/${post.slug}`}
              className="group block rounded-xl p-6 -mx-6 hover:bg-slate-50 transition-colors"
            >
              <article>
                <h2 className="text-xl font-semibold text-slate-900 group-hover:text-slate-700 transition-colors">
                  {post.title ?? post.slug}
                </h2>
                {post.date && (
                  <time className="mt-3 block text-sm text-slate-400">
                    {formatDate(post.date)}
                  </time>
                )}
              </article>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}
