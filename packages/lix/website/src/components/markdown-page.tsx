import { useMemo } from "react";

/**
 * Renders pre-parsed markdown HTML inside the docs layout.
 *
 * @example
 * <MarkdownPage title="Hello" html="<h1>Hi from Lix</h1>" />
 */
export function MarkdownPage({
  html,
  title,
  description,
}: {
  html: string;
  title: string;
  description?: string;
}) {
  const renderedHtml = useMemo(() => html, [html]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-16">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-200/70">
            Docs
          </p>
          <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
            {title}
          </h1>
          {description ? (
            <p className="max-w-3xl text-base text-slate-200">{description}</p>
          ) : null}
        </header>

        <article
          className="markdown-body rounded-2xl border border-slate-800 bg-slate-900/70 px-6 py-8 shadow-[0_20px_80px_-40px_rgba(0,0,0,0.8)]"
          dangerouslySetInnerHTML={{ __html: renderedHtml }}
        />
      </div>
    </main>
  );
}
