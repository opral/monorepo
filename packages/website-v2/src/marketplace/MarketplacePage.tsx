import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import type { MarketplaceManifest } from "@inlang/marketplace-manifest";
import type { MarketplacePageData } from "./marketplaceData";
import "../components/markdown-interactive";

type Heading = { id: string; text: string; level: number };

export default function MarketplacePage({
  data,
}: {
  data: MarketplacePageData;
}) {
  const articleRef = useRef<HTMLDivElement>(null);
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileOnThisPageOpen, setMobileOnThisPageOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(data.rawMarkdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy markdown:", err);
    }
  };

  useEffect(() => {
    if (!data.imports || data.imports.length === 0) return;
    data.imports.forEach((url) => {
      import(/* @vite-ignore */ url);
    });
  }, [data.imports]);

  useEffect(() => {
    const container = articleRef.current;
    if (!container) return;
    const elements = Array.from(
      container.querySelectorAll("h1, h2, h3")
    ) as HTMLElement[];
    const newHeadings = elements.map((element) => {
      const id = slugifyHeading(element.textContent || "");
      element.id = id;
      return {
        id,
        text: element.textContent || "",
        level: Number.parseInt(element.tagName.replace("H", ""), 10),
      };
    });
    setHeadings(newHeadings);
  }, [data.markdown]);

  // Scroll spy: track which heading is currently visible
  useEffect(() => {
    if (headings.length === 0) return;

    const handleScroll = () => {
      const headingElements = headings
        .map((h) => ({ id: h.id, el: document.getElementById(h.id) }))
        .filter((h) => h.el !== null) as { id: string; el: HTMLElement }[];

      if (headingElements.length === 0) return;

      // Find the heading that's closest to the top of the viewport (but above center)
      const scrollTop = window.scrollY;
      const viewportHeight = window.innerHeight;
      const offset = 100; // Account for sticky header

      let currentId = headingElements[0].id;

      for (const { id, el } of headingElements) {
        const rect = el.getBoundingClientRect();
        const elementTop = rect.top;

        // If the heading is above the middle of the viewport, it's the current section
        if (elementTop <= offset + viewportHeight * 0.3) {
          currentId = id;
        } else {
          break;
        }
      }

      setActiveId(currentId);
    };

    // Initial call
    handleScroll();

    // Throttle scroll handler for performance
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [headings]);

  return (
    <>
      <ProductHeader manifest={data.manifest} />

      {/* Mobile navigation bar - visible below lg breakpoint */}
      <div className="sticky top-[118px] sm:top-[153px] z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2 lg:hidden">
        <button
          type="button"
          onClick={() => {
            setMobileMenuOpen(!mobileMenuOpen);
            setMobileOnThisPageOpen(false);
          }}
          className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
          Menu
        </button>
        <button
          type="button"
          onClick={() => {
            setMobileOnThisPageOpen(!mobileOnThisPageOpen);
            setMobileMenuOpen(false);
          }}
          className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          On this page
          <svg
            className={`h-4 w-4 transition-transform ${
              mobileOnThisPageOpen ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="fixed left-0 right-0 bottom-0 top-[162px] sm:top-[197px] z-50 bg-white lg:hidden overflow-y-auto">
          <div className="px-4 pb-8 pt-4">
            <DocNav manifest={data.manifest} currentRoute={data.pagePath} />
          </div>
        </div>
      )}

      {/* Mobile "On this page" Drawer */}
      {mobileOnThisPageOpen && (
        <div className="fixed left-0 right-0 bottom-0 top-[162px] sm:top-[197px] z-50 bg-white lg:hidden overflow-y-auto">
          <div className="px-4 pb-8 pt-4">
            <MobileOnThisPage
              headings={headings}
              activeId={activeId}
              onClose={() => setMobileOnThisPageOpen(false)}
            />
          </div>
        </div>
      )}

      <div className="bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex gap-6">
            <aside className="sticky top-[153px] hidden h-[calc(100vh-153px)] w-56 shrink-0 lg:block">
              <div className="h-full overflow-y-auto pb-8 pr-2 pt-4">
                <DocNav manifest={data.manifest} currentRoute={data.pagePath} />
              </div>
            </aside>

            <section className="min-w-0 flex-1 pb-16 min-h-[calc(100vh-153px)]">
              {(() => {
                // Check if markdown starts with an h1
                const hasH1 = /^<h1[\s>]/i.test(data.markdown.trim());

                const copyButton = (
                  <button
                    type="button"
                    onClick={copyMarkdown}
                    className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                  >
                    {copied ? (
                      <>
                        <svg
                          className="h-4 w-4 text-green-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                        Copy markdown
                      </>
                    )}
                  </button>
                );

                if (hasH1) {
                  // H1 exists: use absolute positioning to align with h1
                  return (
                    <div className="relative">
                      <div className="absolute right-0 top-4 z-10">
                        {copyButton}
                      </div>
                      <div
                        ref={articleRef}
                        className="marketplace-markdown pt-4 pb-2.5"
                        onMouseDown={(event) => {
                          const anchor = (event.target as HTMLElement).closest(
                            "a"
                          );
                          if (anchor?.getAttribute("href")?.startsWith("#")) {
                            event.preventDefault();
                          }
                        }}
                        dangerouslySetInnerHTML={{ __html: data.markdown }}
                      />
                    </div>
                  );
                } else {
                  // No H1: render button in a separate row above content
                  return (
                    <>
                      <div className="flex justify-end pt-4 pb-2">
                        {copyButton}
                      </div>
                      <div
                        ref={articleRef}
                        className="marketplace-markdown pb-2.5"
                        onMouseDown={(event) => {
                          const anchor = (event.target as HTMLElement).closest(
                            "a"
                          );
                          if (anchor?.getAttribute("href")?.startsWith("#")) {
                            event.preventDefault();
                          }
                        }}
                        dangerouslySetInnerHTML={{ __html: data.markdown }}
                      />
                    </>
                  );
                }
              })()}

              <div className="mt-16 rounded-xl border border-slate-200 bg-slate-50 px-6 py-6">
                <p className="text-lg font-semibold text-slate-900">
                  Do you have questions?
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  Join the community on Discord and we will help you out.
                </p>
                <a
                  href="https://discord.gg/gdMPPWy57R"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Join Discord
                </a>
              </div>

              {data.recommends && data.recommends.length > 0 ? (
                <div className="mt-16">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Recommended
                  </h3>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    {data.recommends.map((item) => (
                      <RecommendationCard key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Edit on GitHub link */}
              {(() => {
                const githubLink = getGithubLink(data.manifest, data.pagePath);
                if (!githubLink) return null;
                return (
                  <div className="mt-12 border-t border-slate-200 pt-6">
                    <a
                      href={githubLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      Edit this page on GitHub
                    </a>
                  </div>
                );
              })()}
            </section>

            <aside className="sticky top-[153px] hidden h-[calc(100vh-153px)] w-56 flex-shrink-0 xl:block">
              <div className="h-full overflow-y-auto pb-8 pl-2 pt-4">
                <DocMeta
                  manifest={data.manifest}
                  headings={headings}
                  activeId={activeId}
                />
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}

function ProductHeader({ manifest }: { manifest: MarketplaceManifest }) {
  const displayName =
    typeof manifest.displayName === "object"
      ? manifest.displayName.en
      : manifest.displayName;
  const isInstallable =
    manifest.id.includes("plugin.") || manifest.id.includes("messageLintRule.");

  // Determine category badge based on product type
  const getCategoryBadge = () => {
    if (manifest.id.includes("plugin.")) {
      return "Plugin";
    }
    if (manifest.id.includes("messageLintRule.")) {
      return "Validation Rule";
    }
    // Libraries and apps both show as "App"
    return "App";
  };
  const badge = getCategoryBadge();

  return (
    <div className="sticky top-[62px] sm:top-[97px] z-40 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          {/* Product icon */}
          {manifest.icon ? (
            <img
              src={manifest.icon}
              alt={displayName}
              className="h-7 w-7 rounded-md object-cover"
            />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-800 text-xs font-semibold text-white">
              {displayName[0]}
            </div>
          )}
          {/* Product name */}
          <h2 className="text-sm font-semibold text-slate-900">
            {displayName}
          </h2>
          {/* Category badge */}
          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
            {badge}
          </span>
        </div>

        {/* Open/Install button */}
        {manifest.website && (
          <a
            href={manifest.website}
            className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
          >
            {isInstallable ? "Install" : "Open"}
          </a>
        )}
      </div>
    </div>
  );
}

function DocNav({
  manifest,
  currentRoute,
}: {
  manifest: MarketplaceManifest & { uniqueID: string };
  currentRoute: string;
}) {
  if (!manifest.pages) return null;
  const basePath = manifest.slug
    ? `/m/${manifest.uniqueID}/${manifest.slug}`
    : `/m/${manifest.uniqueID}/${manifest.id.replaceAll(".", "-")}`;

  // Normalize pages structure: convert flat structure to sectioned structure
  const normalizedSections: Array<{
    title: string;
    pages: Array<{ route: string; path: string; isExternal: boolean }>;
  }> = [];

  const entries = Object.entries(manifest.pages);
  const flatPages: Array<{ route: string; path: string; isExternal: boolean }> =
    [];

  for (const [key, value] of entries) {
    if (typeof value === "string") {
      // Flat structure - collect into overview section
      flatPages.push({
        route: key,
        path: value,
        isExternal: !value.endsWith(".md") && !value.endsWith(".html"),
      });
    } else {
      // Nested structure - use key as section title (empty string becomes "Overview")
      const sectionTitle = key || "Overview";
      normalizedSections.push({
        title: sectionTitle,
        pages: Object.entries(value).map(([route, path]) => ({
          route,
          path: path as string,
          isExternal:
            !(path as string).endsWith(".md") &&
            !(path as string).endsWith(".html"),
        })),
      });
    }
  }

  // If we collected flat pages, add them as the first "Overview" section
  if (flatPages.length > 0) {
    normalizedSections.unshift({ title: "Overview", pages: flatPages });
  }

  return (
    <div>
      <div className="flex flex-col gap-1 text-sm text-slate-700">
        {normalizedSections.map((section, index) => (
          <div key={section.title} className={index === 0 ? "" : "pt-4"}>
            <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {section.title}
            </p>
            <div className="flex flex-col gap-1">
              {section.pages.map(({ route, path, isExternal }) => {
                const navTitle = route.split("/").pop() || "Introduction";
                const href = isExternal ? path : basePath + route;
                const isActive = currentRoute === route;

                return isExternal ? (
                  <a
                    key={route}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-md px-3 py-2 text-sm capitalize text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  >
                    {navTitle.replaceAll("-", " ")}
                  </a>
                ) : (
                  <Link
                    key={route}
                    to={href}
                    className={`rounded-md px-3 py-2 text-sm capitalize transition-colors ${
                      isActive
                        ? "bg-slate-200 font-semibold text-slate-900"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    {navTitle.replaceAll("-", " ")}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400 hover:text-slate-600"
      >
        {title}
        <svg
          className={`h-4 w-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {/* Always render children for SEO, use CSS to hide */}
      <div
        className={`overflow-hidden transition-all duration-200 ${
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function DocMeta({
  manifest,
  headings,
  activeId,
}: {
  manifest: MarketplaceManifest & { uniqueID: string };
  headings: Heading[];
  activeId: string;
}) {
  const displayName =
    typeof manifest.displayName === "object"
      ? manifest.displayName.en
      : manifest.displayName;

  // GitHub stars state
  const [starCount, setStarCount] = useState<number | null>(null);
  const repository = (manifest as { repository?: string }).repository;

  // Fetch star count from GitHub API
  useEffect(() => {
    if (!repository) return;
    const match = repository.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) return;
    const owner = match[1];
    const repo = match[2].replace(/\.git$/, "");

    fetch(`https://api.github.com/repos/${owner}/${repo}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.stargazers_count) {
          setStarCount(data.stargazers_count);
        }
      })
      .catch(() => {});
  }, [repository]);

  // Format star count (e.g., 1234 -> "1.2k")
  const formatStars = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1).replace(/\.0$/, "")}k`;
    }
    return count.toString();
  };

  const authorContent = (
    <>
      {manifest.publisherIcon ? (
        <img
          src={manifest.publisherIcon}
          alt={manifest.publisherName}
          className="h-4 w-4 rounded-full"
        />
      ) : (
        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-200 text-[10px] font-medium text-slate-600">
          {displayName[0]}
        </div>
      )}
      <span>{manifest.publisherName}</span>
    </>
  );

  return (
    <div className="text-sm text-slate-700">
      {/* ON THIS PAGE - Primary navigation, always at top */}
      {headings.length > 0 ? (
        <>
          <p className="pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            On this page
          </p>
          <div className="flex flex-col">
            {headings.map((heading) => {
              const isActive = heading.id === activeId;
              const indent =
                heading.level === 3
                  ? "pl-3"
                  : heading.level === 2
                  ? "pl-1"
                  : "";
              return (
                <button
                  key={heading.id}
                  type="button"
                  className={`text-left text-sm py-1 border-l-2 pl-3 transition-colors ${indent} ${
                    isActive
                      ? "border-blue-500 text-slate-900 font-medium"
                      : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
                  }`}
                  onClick={() => scrollToAnchor(heading.id)}
                >
                  {heading.text}
                </button>
              );
            })}
          </div>
          <div className="my-4 h-px w-full bg-slate-200" />
        </>
      ) : null}

      {/* REPOSITORY */}
      {repository && (
        <>
          <p className="pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Repository
          </p>
          {/* Repo link with star badge */}
          <a
            href={repository}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
          >
            <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            <span className="hover:underline">
              {(() => {
                const match = repository.match(/github\.com\/([^/]+\/[^/]+)/);
                return match
                  ? match[1].replace(/\.git$/, "")
                  : "View on GitHub";
              })()}
            </span>
            {starCount !== null && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600">
                <svg
                  className="h-3 w-3 text-yellow-500"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25z" />
                </svg>
                {formatStars(starCount)}
              </span>
            )}
          </a>
          <div className="my-4 h-px w-full bg-slate-200" />
        </>
      )}

      {/* AUTHOR */}
      <p className="pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Author
      </p>
      {manifest.publisherLink ? (
        <a
          href={manifest.publisherLink}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
        >
          {authorContent}
        </a>
      ) : (
        <div className="inline-flex items-center gap-2 text-sm text-slate-600">
          {authorContent}
        </div>
      )}

      <div className="my-4 h-px w-full bg-slate-200" />

      {/* LICENSE */}
      <p className="pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        License
      </p>
      <span className="text-sm text-slate-600">{manifest.license}</span>

      {/* PRICING */}
      {manifest.pricing ? (
        <>
          <div className="my-4 h-px w-full bg-slate-200" />
          <p className="pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Pricing
          </p>
          <span className="text-sm text-slate-600">{manifest.pricing}</span>
        </>
      ) : null}

      {/* KEYWORDS - Collapsible */}
      {manifest.keywords && manifest.keywords.length > 0 ? (
        <>
          <div className="my-4 h-px w-full bg-slate-200" />
          <CollapsibleSection title="Keywords">
            <div className="flex flex-wrap gap-2">
              {manifest.keywords.map((keyword) => (
                <Link
                  key={keyword}
                  to={`/search?q=${encodeURIComponent(keyword)}`}
                  className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700"
                >
                  {keyword}
                </Link>
              ))}
            </div>
          </CollapsibleSection>
        </>
      ) : null}
    </div>
  );
}

function MobileOnThisPage({
  headings,
  activeId,
  onClose,
}: {
  headings: Heading[];
  activeId: string;
  onClose: () => void;
}) {
  return (
    <div className="text-sm text-slate-700">
      <p className="pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        On this page
      </p>
      <div className="flex flex-col">
        {headings.map((heading) => {
          const isActive = heading.id === activeId;
          const indent =
            heading.level === 3 ? "pl-3" : heading.level === 2 ? "pl-1" : "";
          return (
            <button
              key={heading.id}
              type="button"
              className={`text-left text-sm py-2 border-l-2 pl-3 transition-colors ${indent} ${
                isActive
                  ? "border-blue-500 text-slate-900 font-medium"
                  : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
              }`}
              onClick={() => {
                scrollToAnchor(heading.id);
                onClose();
              }}
            >
              {heading.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RecommendationCard({
  item,
}: {
  item: MarketplaceManifest & { uniqueID?: string };
}) {
  const displayName =
    typeof item.displayName === "object"
      ? item.displayName.en
      : item.displayName;
  const description =
    typeof item.description === "object"
      ? item.description.en
      : item.description;
  const slug = item.id.replaceAll(".", "-");
  const href = `/m/${(item as any).uniqueID}/${slug}`;

  return (
    <Link
      to={href}
      className="rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-300 hover:shadow-sm"
    >
      <div className="flex items-start gap-3">
        {item.icon ? (
          <img
            src={item.icon}
            alt={displayName}
            className="h-10 w-10 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-sm font-semibold text-white">
            {displayName[0]}
          </div>
        )}
        <div>
          <p className="text-sm font-semibold text-slate-900">{displayName}</p>
          <p className="mt-2 text-sm text-slate-600">{description}</p>
        </div>
      </div>
    </Link>
  );
}

function typeOfIdToTitle(id: string) {
  if (id.includes("plugin.")) return "Plugin";
  if (id.includes("messageLintRule.")) return "Lint Rule";
  if (id.includes("library.")) return "Library";
  if (id.includes("app.")) return "App";
  return "Product";
}

function slugifyHeading(value: string) {
  return value
    .toLowerCase()
    .replaceAll(" ", "-")
    .replaceAll("/", "")
    .replace("#", "")
    .replaceAll("(", "")
    .replaceAll(")", "")
    .replaceAll("?", "")
    .replaceAll(".", "")
    .replaceAll("@", "")
    .replaceAll(
      /([\uE000-\uF8FF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF])/g,
      ""
    )
    .replaceAll("✂", "")
    .replaceAll(":", "")
    .replaceAll("'", "");
}

function scrollToAnchor(anchor: string) {
  const element = document.getElementById(anchor);
  if (element && window) {
    window.scrollTo({
      top: element.offsetTop - 210,
      behavior: "smooth",
    });
  }
}

function getGithubLink(
  manifest: MarketplaceManifest,
  currentRoute: string
): string | undefined {
  let link: string | undefined;
  if (manifest.pages) {
    for (const [key, value] of Object.entries(manifest.pages)) {
      if (typeof value === "string" && key === currentRoute) {
        link = value;
      } else if (typeof value === "object") {
        for (const [route, path] of Object.entries(value)) {
          if (route === currentRoute) {
            link = path as string;
          }
        }
      }
    }
  } else {
    link =
      typeof manifest.readme === "object"
        ? manifest.readme.en
        : manifest.readme;
  }

  const isExternal = link?.includes("http");

  if (isExternal) {
    if (link?.includes("https://github.com")) {
      return link;
    }
    if (link?.includes("raw.githubusercontent.com")) {
      return link
        .replace("raw.githubusercontent.com", "github.com")
        .replace("refs/heads", "blob");
    }
    if (link?.includes("https://cdn.jsdelivr.net/gh/")) {
      const owner = link
        .replace("https://cdn.jsdelivr.net/gh/", "")
        .split("/")[0];
      const repoPart = link
        .replace("https://cdn.jsdelivr.net/gh/", "")
        .split("/")[1];
      const repo = repoPart?.includes("@") ? repoPart.split("@")[0] : repoPart;
      const rest = link
        .replace("https://cdn.jsdelivr.net/gh/", "")
        .split("/")
        .slice(2)
        .join("/");
      return `https://github.com/${owner}/${repo}/blob/main/${rest}`;
    }
    if (link?.includes("https://cdn.jsdelivr.net/npm/")) {
      return undefined;
    }
  }

  if (!link) return undefined;
  return `https://github.com/opral/monorepo/blob/main/${link.replace(
    "./",
    ""
  )}`;
}

function flattenPages(
  pages: Record<string, string> | Record<string, Record<string, string>>
) {
  const flatPages: Record<string, string> = {};
  for (const [key, value] of Object.entries(pages)) {
    if (typeof value === "string") {
      flatPages[key] = value;
    } else {
      for (const [subKey, subValue] of Object.entries(value)) {
        flatPages[subKey] = subValue;
      }
    }
  }
  return flatPages;
}
