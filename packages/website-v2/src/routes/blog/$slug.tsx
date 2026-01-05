import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { parse } from "@opral/markdown-wc";
import { useEffect, useState } from "react";
import "../../components/markdown-interactive";
import markdownCss from "../../markdown.css?url";
import { getBlogDescription, getBlogTitle } from "../../blog/blogMetadata";

const ogImage =
  "https://cdn.jsdelivr.net/gh/opral/inlang@latest/packages/website/public/opengraph/inlang-social-image.jpg";
const ogImageWidth = 1200;
const ogImageHeight = 630;

type Author = {
  name: string;
  role?: string;
  avatar?: string | null;
  twitter?: string;
  github?: string;
};

function calculateReadingTime(text: string): number {
  const wordsPerMinute = 200;
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

const loadBlogPost = createServerFn({ method: "GET" }).handler(async (ctx) => {
  const data = ctx.data as { slug?: string } | undefined;
  const slug = data?.slug;
  if (!slug) {
    throw new Error("Missing blog slug");
  }

  const fs = await import("node:fs/promises");
  const repositoryRoot = import.meta.url.slice(
    0,
    import.meta.url.lastIndexOf("inlang/packages")
  );
  const blogDir = repositoryRoot + "inlang/blog/";

  // Load authors
  const authorsPath = blogDir + "authors.json";
  const authorsContent = await fs.readFile(new URL(authorsPath), "utf-8");
  const authorsMap = JSON.parse(authorsContent) as Record<string, Author>;

  // Load table of contents
  const tocPath = blogDir + "table_of_contents.json";
  const tocContent = await fs.readFile(new URL(tocPath), "utf-8");
  const toc = JSON.parse(tocContent) as Array<{
    path: string;
    slug: string;
    date?: string;
    authors?: string[]; // Author IDs
  }>;

  const entry = toc.find((item) => item.slug === slug);
  if (!entry) {
    throw new Error(`Blog post not found: ${slug}`);
  }

  // Resolve author IDs to full author objects
  const authors = entry.authors
    ?.map((authorId) => authorsMap[authorId])
    .filter(Boolean);

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
  const ogImageOverride =
    typeof parsed.frontmatter?.["og:image"] === "string"
      ? parsed.frontmatter["og:image"]
      : undefined;
  const ogImageAlt =
    typeof parsed.frontmatter?.["og:image:alt"] === "string"
      ? parsed.frontmatter["og:image:alt"]
      : undefined;

  const readingTime = calculateReadingTime(rawMarkdown);

  const imports = parsed.frontmatter?.imports as string[] | undefined;

  return {
    post: {
      slug: entry.slug,
      title,
      description,
      date: entry.date,
      authors,
      readingTime,
      ogImage: ogImageOverride ?? ogImage,
      ogImageAlt,
      imports,
    },
    html: parsed.html,
    rawMarkdown,
  };
});

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    try {
      // @ts-expect-error - TanStack Start server function type inference
      return await loadBlogPost({ data: { slug: params.slug } });
    } catch {
      throw redirect({ to: "/blog" });
    }
  },
  head: ({ loaderData }) => {
    const title = loaderData?.post.title;
    const description = loaderData?.post.description;
    const slug = loaderData?.post.slug;
    const ogImageUrl = loaderData?.post.ogImage ?? ogImage;
    const ogImageAlt =
      loaderData?.post.ogImageAlt ??
      (title ? `${title} cover` : "inlang blog post");
    const canonicalUrl = slug
      ? `https://inlang.com/blog/${slug}`
      : "https://inlang.com/blog";
    const meta: Array<
      | { title: string }
      | { name: string; content: string }
      | { property: string; content: string }
    > = [
      { title: title ? `${title} | inlang Blog` : "Blog | inlang" },
      { property: "og:url", content: canonicalUrl },
      { property: "og:type", content: "article" },
      { property: "og:site_name", content: "inlang" },
      { property: "og:locale", content: "en_US" },
      { property: "og:image", content: ogImageUrl },
      { property: "og:image:width", content: String(ogImageWidth) },
      { property: "og:image:height", content: String(ogImageHeight) },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: ogImageUrl },
      { name: "twitter:image:alt", content: ogImageAlt },
      { name: "twitter:site", content: "@inlanghq" },
    ];

    if (description) {
      meta.push(
        { name: "description", content: description },
        { property: "og:description", content: description },
        { name: "twitter:description", content: description }
      );
    }

    if (title) {
      meta.push(
        { property: "og:title", content: `${title} | inlang Blog` },
        { name: "twitter:title", content: `${title} | inlang Blog` }
      );
    }

    if (loaderData?.post.date) {
      meta.push({
        property: "article:published_time",
        content: loaderData.post.date,
      });
    }

    if (loaderData?.post.authors) {
      loaderData.post.authors.forEach((author) => {
        meta.push({
          property: "article:author",
          content: author.name,
        });
      });
    }

    return {
      meta,
      links: [
        { rel: "stylesheet", href: markdownCss },
        { rel: "canonical", href: canonicalUrl },
      ],
      scripts: slug
        ? [
            {
              type: "application/ld+json",
              children: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "BlogPosting",
                headline: title ?? slug,
                description,
                url: canonicalUrl,
                image: ogImageUrl,
                ...(loaderData?.post.date
                  ? { datePublished: loaderData.post.date }
                  : {}),
                ...(loaderData?.post.authors
                  ? {
                      author: loaderData.post.authors.map((author) => ({
                        "@type": "Person",
                        name: author.name,
                        ...(author.avatar ? { image: author.avatar } : {}),
                        ...(author.twitter || author.github
                          ? {
                              sameAs: [author.twitter, author.github].filter(
                                (value): value is string => Boolean(value)
                              ),
                            }
                          : {}),
                      })),
                    }
                  : {}),
              }),
            },
            ...(loaderData?.post.authors
              ? loaderData.post.authors.map((author) => ({
                  type: "application/ld+json",
                  children: JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "Person",
                    name: author.name,
                    ...(author.avatar ? { image: author.avatar } : {}),
                    ...(author.twitter || author.github
                      ? {
                          sameAs: [author.twitter, author.github].filter(
                            (value): value is string => Boolean(value)
                          ),
                        }
                      : {}),
                  }),
                }))
              : []),
          ]
        : [],
    };
  },
  component: BlogPostPage,
});

function BlogPostPage() {
  const { post, html } = Route.useLoaderData();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!post.imports || post.imports.length === 0) return;
    post.imports.forEach((url) => {
      import(/* @vite-ignore */ url).catch((err) => {
        console.error(`Failed to load web component from ${url}:`, err);
      });
    });
  }, [post.imports]);

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy URL:", err);
    }
  };

  return (
    <main className="bg-white text-slate-900">
      {/* Hero header section */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-16">
          {/* Breadcrumb */}
          <nav className="mb-8 flex justify-center">
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
              Blog
            </Link>
          </nav>

          {/* Title - centered */}
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 text-center mb-8">
            {post.title}
          </h1>

          {/* Author(s) - centered */}
          {post.authors && post.authors.length > 0 && (
            <div className="flex justify-center gap-6 mb-8">
              {post.authors.map((author, index) => (
                <div key={index} className="flex items-center gap-3">
                  {author.avatar ? (
                    <img
                      src={author.avatar}
                      alt={author.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-300 flex items-center justify-center text-slate-600 font-medium">
                      {author.name.charAt(0)}
                    </div>
                  )}
                  <span className="font-medium text-slate-900">
                    {author.name}
                  </span>
                  {author.twitter && (
                    <a
                      href={author.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-slate-600 transition-colors"
                      aria-label={`${author.name} on X`}
                    >
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    </a>
                  )}
                  {author.github && (
                    <a
                      href={author.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-slate-600 transition-colors"
                      aria-label={`${author.name} on GitHub`}
                    >
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                      </svg>
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Meta row: reading time, copy URL, date */}
          <div className="flex items-center justify-between text-sm text-slate-500 pt-6 border-t border-slate-200">
            <div className="flex items-center gap-4">
              {/* Reading time */}
              <span className="flex items-center gap-1.5">
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {post.readingTime} min read
              </span>

              {/* Copy URL */}
              <button
                onClick={copyUrl}
                className="flex items-center gap-1.5 text-cyan-600 hover:text-cyan-700 transition-colors"
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
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                {copied ? "Copied!" : "Copy URL"}
              </button>
            </div>

            {/* Date on the right */}
            {post.date && (
              <time className="text-slate-500">{formatDate(post.date)}</time>
            )}
          </div>
        </div>
      </header>

      {/* Post content */}
      <div className="mx-auto max-w-3xl px-6 py-12">
        <article
          className="marketplace-markdown [&>h1:first-child]:hidden"
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
