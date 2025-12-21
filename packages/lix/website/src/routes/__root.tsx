import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "lix | Documentation",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),

  notFoundComponent: NotFoundPage,
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

/**
 * Fallback UI for unmatched routes.
 *
 * @example
 * <NotFoundPage />
 */
function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col justify-center px-6 py-16 text-slate-900">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
        404
      </p>
      <h1 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl">
        Page not found
      </h1>
      <p className="mt-3 text-base text-slate-600">
        The page you are looking for does not exist.
      </p>
    </div>
  );
}
