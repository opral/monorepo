import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { Toc } from "../lib/build-doc-map";
import { Header, MenuIcon } from "./header";

export type SidebarSection = {
  label: string;
  items: Array<{
    label: string;
    href: string;
    relativePath: string;
  }>;
};

export type PageTocItem = {
  id: string;
  label: string;
  level: number;
};

/**
 * VitePress-style documentation shell with header, left sidebar, and main content.
 *
 * The sidebar is driven from the docs table of contents and highlights the
 * active entry based on the current doc relative path.
 *
 * @example
 * <DocsLayout
 *   toc={toc}
 *   sidebarSections={[
 *     { label: "Overview", items: [{ label: "What is Lix?", href: "/docs/what-is-lix", relativePath: "./what-is-lix.md" }] },
 *   ]}
 *   activeRelativePath="./what-is-lix.md"
 *   pageToc={[{ id: "intro", label: "Intro", level: 2 }]}
 * >
 *   <MarkdownPage title="Hello" html="<h1>Hello</h1>" />
 * </DocsLayout>
 */
export function DocsLayout({
  toc,
  sidebarSections,
  activeRelativePath,
  pageToc,
  children,
}: {
  toc: Toc;
  sidebarSections: SidebarSection[];
  activeRelativePath?: string;
  pageToc?: PageTocItem[];
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const hasPageToc = Boolean(pageToc && pageToc.length > 0);
  const [activeTocId, setActiveTocId] = useState<string | null>(null);

  useEffect(() => {
    if (!pageToc || pageToc.length === 0) return;

    const headings = pageToc
      .map((item) => document.getElementById(item.id))
      .filter((node): node is HTMLElement => Boolean(node));

    if (headings.length === 0) return;

    setActiveTocId(headings[0].id);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible[0]?.target instanceof HTMLElement) {
          setActiveTocId(visible[0].target.id);
        }
      },
      {
        rootMargin: "0px 0px -70% 0px",
        threshold: [0, 1],
      },
    );

    for (const heading of headings) {
      observer.observe(heading);
    }

    return () => {
      observer.disconnect();
    };
  }, [pageToc]);

  const SidebarContent = () => (
    <nav
      aria-label="Documentation sidebar"
      className="px-6 pt-6 pb-8 space-y-6"
    >
      {sidebarSections.map((section) => (
        <section key={section.label} className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-900">
            {section.label}
          </h2>
          <ul className="space-y-2">
            {section.items.map((item) => {
              const isActive = item.relativePath === activeRelativePath;
              return (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={[
                      "block py-1 text-sm transition-colors",
                      isActive
                        ? "font-medium text-[#0891B2]"
                        : "text-slate-600 hover:text-slate-900",
                    ].join(" ")}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="sticky top-0 z-50">
        <Header />
        {/* Mobile menu bar - below header, above content */}
        <div className="border-b border-gray-200 bg-white lg:hidden">
          <div className="mx-auto flex w-full max-w-[1440px] items-center px-6 py-2">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="flex items-center gap-2 text-sm font-medium text-gray-700"
              aria-label="Open menu"
            >
              <MenuIcon className="h-5 w-5" />
              <span>Menu</span>
            </button>
          </div>
        </div>
      </div>
      {/* Mobile sidebar overlay */}
      {isMobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 left-0 w-full bg-slate-50 border-r border-slate-200 overflow-y-auto z-50 lg:hidden">
            <div className="sticky top-0 bg-slate-50 px-6 py-3 flex justify-end items-center">
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-slate-600 hover:text-slate-900"
                aria-label="Close menu"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <SidebarContent />
          </aside>
        </>
      )}
      <div className="relative">
        <div className="absolute left-0 top-14 hidden h-[calc(100vh-3.5rem)] w-64 bg-slate-50 -z-10 lg:block" />
        <div className="mx-auto flex w-full max-w-[1440px]">
          <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-64 shrink-0 overflow-y-auto border-r border-slate-200 lg:block">
            <SidebarContent />
          </aside>

          <main id="VPContent" className="min-w-0 flex-1">
            <div className="px-6 py-8 lg:px-8">
              <div className="mx-auto w-full max-w-3xl">{children}</div>
            </div>
          </main>

          {hasPageToc && (
            <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-64 shrink-0 xl:block">
              <nav
                aria-label="On this page"
                className="px-6 py-8 text-sm text-slate-600"
              >
                <div className="text-sm font-semibold text-slate-900">
                  On this page
                </div>
                <ul className="mt-3 space-y-2 border-l border-slate-200 pl-4">
                  {pageToc?.map((item) => {
                    const isActive = item.id === activeTocId;
                    return (
                      <li key={item.id} className="relative">
                        {isActive && (
                          <span
                            className="absolute -left-4 top-1/2 h-5 w-0.5 -translate-y-1/2 bg-[#0891B2]"
                            aria-hidden="true"
                          />
                        )}
                        <a
                          href={`#${item.id}`}
                          className={[
                            "block transition-colors",
                            item.level > 2 ? "pl-3" : "",
                            isActive
                              ? "font-medium text-[#0891B2]"
                              : "text-slate-600 hover:text-slate-900",
                          ].join(" ")}
                        >
                          {item.label}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
