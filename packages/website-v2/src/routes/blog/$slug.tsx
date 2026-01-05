import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { parse } from "@opral/markdown-wc";
import "../../components/markdown-interactive";
import markdownCss from "../../markdown.css?url";
import { getBlogDescription, getBlogTitle } from "../../blog/blogMetadata";

const loadBlogPost = createServerFn({ method: "GET" }).handler(
  async ({ data }) => {
    const slug = (data as { slug?: string } | undefined)?.slug;
    if (!slug) {
      throw new Error("Missing blog slug");
    }

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

    const entry = toc.find((item) => item.slug === slug);
    if (!entry) {
      throw new Error(`Blog post not found: ${slug}`);
    }

    const relativePath = entry.path.startsWith("./")
      ? entry.path.slice(2)
      : entry.path;
    const markdownPath = blogDir + relativePath;
    const rawMarkdown = await fs.readFile(new URL(markdownPath), "utf-8");
    const parsed = await parse(rawMarkdown, {
      assetBaseUrl: `/blog/${slug}/`,
    });
    const title = getBlogTitle({
      rawMarkdown,
      frontmatter: parsed.frontmatter,
    });
    const description = getBlogDescription({
      rawMarkdown,
      frontmatter: parsed.frontmatter,
    });

    return {
      post: {
        slug: entry.slug,
        title,
        description,
        date: entry.date,
      },
      html: parsed.html,
      rawMarkdown,
    };
  }
);

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    try {
      return await loadBlogPost({ data: { slug: params.slug } });
    } catch {
      throw redirect({ to: "/blog" });
    }
  },
  head: ({ loaderData }) => {
    const title = loaderData?.post.title;
    const description = loaderData?.post.description;
    const meta = [
      { title: title ? `${title} | inlang Blog` : "Blog | inlang" },
    ];

    if (description) {
      meta.push(
        { name: "description", content: description },
        { name: "og:description", content: description },
        { name: "twitter:description", content: description }
      );
    }

    if (title) {
      meta.push(
        { name: "og:title", content: `${title} | inlang Blog` },
        { name: "twitter:title", content: `${title} | inlang Blog` }
      );
    }

    meta.push({ name: "twitter:card", content: "summary_large_image" });

    return {
      meta,
      links: [{ rel: "stylesheet", href: markdownCss }],
    };
  },
  component: BlogPostPage,
});

function BlogPostPage() {
  const { post, html } = Route.useLoaderData();

  return (
    <main className="bg-white text-slate-900">
      <div className="mx-auto max-w-3xl px-6 py-12">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Blog
          </Link>
        </nav>

        {/* Post content */}
        <article
          className="marketplace-markdown"
          dangerouslySetInnerHTML={{ __html: html }}
        />
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
