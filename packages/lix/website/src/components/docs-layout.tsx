import { Link } from "@tanstack/react-router";
import type { Toc } from "../lib/build-doc-map";
import { Header } from "./header";

export type SidebarSection = {
  label: string;
  items: Array<{
    label: string;
    href: string;
    relativePath: string;
  }>;
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
 *     { label: "Overview", items: [{ label: "Hello", href: "/docs/hello-123", relativePath: "./hello.md" }] },
 *   ]}
 *   activeRelativePath="./hello.md"
 * >
 *   <MarkdownPage title="Hello" html="<h1>Hello</h1>" />
 * </DocsLayout>
 */
export function DocsLayout({
  toc,
  sidebarSections,
  activeRelativePath,
  children,
}: {
  toc: Toc;
  sidebarSections: SidebarSection[];
  activeRelativePath?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Header />
      <div className="flex">
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-64 shrink-0 overflow-y-auto border-r border-slate-200 bg-slate-50 px-6 pt-8 pb-8 lg:block">
          <nav aria-label="Documentation sidebar" className="space-y-6">
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
        </aside>

        <main
          id="VPContent"
          className="min-w-0 flex-1 px-6 py-8 lg:px-8"
        >
          <div className="mx-auto w-full max-w-3xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
