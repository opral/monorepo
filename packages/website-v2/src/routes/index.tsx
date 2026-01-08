import { createFileRoute, Link } from "@tanstack/react-router";
import ReactMarkdown, { type Components } from "react-markdown";
import { registry } from "@inlang/marketplace-registry";
import landingMarkdown from "../content/landingpage.md?raw";

const ogImage =
  "https://cdn.jsdelivr.net/gh/opral/inlang@latest/packages/website/public/opengraph/inlang-social-image.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "inlang" },
      {
        name: "description",
        content:
          "Inlang is an open file format for localizing software (i18n). One file format, multiple solutions, all interoperable.",
      },
      { name: "og:image", content: ogImage },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: ogImage },
      { name: "twitter:image:alt", content: "inlang" },
      { name: "twitter:title", content: "inlang" },
      {
        name: "twitter:description",
        content:
          "Inlang is an open file format for localizing software (i18n). One file format, multiple solutions, all interoperable.",
      },
      { name: "twitter:site", content: "@inlanghq" },
      { name: "twitter:creator", content: "@inlanghq" },
    ],
  }),
  component: App,
});

const featuredIds = [
  "library.inlang.paraglideJs",
  "app.inlang.finkLocalizationEditor",
  "app.inlang.ideExtension",
  "app.inlang.cli",
];

function App() {
  return (
    <main className="bg-white text-slate-900">
      <section className="px-6 pt-10 pb-16">
        <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 flex flex-col gap-6">
            <div className="flex gap-2">
              <a
                href="https://www.npmjs.com/package/@inlang/sdk"
                target="_blank"
                rel="noreferrer"
              >
                <img
                  src="https://img.shields.io/npm/dw/%40inlang%2Fsdk?logo=npm&logoColor=red&labelColor=white&color=gray&label=npm%20downloads"
                  alt="npm downloads"
                />
              </a>
              <a
                href="https://discord.gg/gdMPPWy57R"
                target="_blank"
                rel="noreferrer"
              >
                <img
                  src="https://img.shields.io/discord/897438559458430986?style=flat&logo=discord&color=gray&labelColor=white"
                  alt="Discord"
                />
              </a>
            </div>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
              The open file format and ecosystem for software localization
              (i18n).
            </h1>
            <p className="text-lg text-slate-600 max-w-xl">
              Inlang is an open file format for localizing software (i18n).
              One file format, multiple solutions, all interoperable.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/c/apps"
                className="rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-semibold hover:bg-slate-800 transition-colors"
              >
                Explore ecosystem
              </Link>
              <a
                href="https://github.com/opral/inlang-sdk"
                target="_blank"
                rel="noreferrer"
                className="rounded-lg bg-slate-200 text-slate-900 px-4 py-2 text-sm font-semibold hover:bg-slate-300 transition-colors"
              >
                Documentation
              </a>
            </div>
          </div>
          <div className="lg:col-span-6 flex justify-center lg:justify-end">
            <img
              src="/images/go-global-mockup.png"
              alt="Software localization mockup"
              className="w-full max-w-xl"
            />
          </div>
        </div>
      </section>

      <section className="px-6 pb-10">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-semibold tracking-tight mb-6">
            Popular tools
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {featuredIds.map((id) => {
              const manifest = registry.find((item) => item.id === id);
              if (!manifest) return null;
              const displayName =
                typeof manifest.displayName === "object"
                  ? manifest.displayName.en
                  : manifest.displayName;
              const description =
                typeof manifest.description === "object"
                  ? manifest.description.en
                  : manifest.description;
              const slug = manifest.id.replaceAll(".", "-");
              return (
                <Link
                  key={manifest.id}
                  to="/m/$uid/$slug"
                  params={{ uid: manifest.uniqueID, slug }}
                  className="border border-slate-200 rounded-xl p-5 hover:border-slate-300 hover:shadow-sm transition-all bg-white"
                >
                  <div className="flex items-start gap-3">
                    {manifest.icon ? (
                      <img
                        src={manifest.icon}
                        alt={displayName}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-slate-800 text-white flex items-center justify-center font-semibold">
                        {displayName[0]}
                      </div>
                    )}
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">
                        {displayName}
                      </h3>
                      <div className="mt-2">
                        <span className="text-xs font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                          app
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-slate-600">{description}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="mx-auto max-w-4xl">
          <ReactMarkdown components={markdownComponents}>
            {landingMarkdown}
          </ReactMarkdown>
        </div>
      </section>
    </main>
  );
}

const markdownComponents: Components = {
  h2: ({ children }) => (
    <h2 className="text-2xl font-semibold tracking-tight mt-10 mb-4">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-xl font-semibold tracking-tight mt-8 mb-3">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="text-slate-700 leading-relaxed mb-4">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="list-disc pl-6 text-slate-700 mb-4">{children}</ul>
  ),
  li: ({ children }) => <li className="mb-2">{children}</li>,
  a: ({ children, href }) => (
    <a
      href={href}
      className="text-slate-900 underline underline-offset-2 hover:text-slate-700"
    >
      {children}
    </a>
  ),
  img: ({ alt, src }) => (
    <img
      src={src}
      alt={alt || ""}
      className="w-full rounded-xl border border-slate-200 my-6"
    />
  ),
};
