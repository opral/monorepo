import { useRouter } from "next/router";

// nav bar logo
const Logo = ({ height }) => (
  <svg
    height={height}
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  ></svg>
);

const TITLE_WITH_TRANSLATIONS = {
  en: "Open Source Software Localization Solution",
};

export default {
  github: "https://github.com/inlang/inlang",
  docsRepositoryBase:
    "https://github.com/inlang/inlang/blob/main/website/pages",
  titleSuffix: " – Inlang",
  search: true,
  unstable_flexsearch: true,
  floatTOC: true,
  feedbackLink: "Question? Give us feedback →",
  feedbackLabels: "feedback",
  logo: () => {
    const { locale } = useRouter();
    return (
      <>
        <Logo height={12} />
        <span
          className="mx-2 font-extrabold hidden md:inline select-none"
          title={"Inlang: " + (TITLE_WITH_TRANSLATIONS[locale] || "")}
        >
          Inlang
        </span>
      </>
    );
  },
  head: ({ title, meta }) => {
    return (
      <>
        {/* Favicons, meta */}
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/favicon/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon/favicon-16x16.png"
        />
        <link rel="manifest" href="/favicon/site.webmanifest" />
        <link
          rel="mask-icon"
          href="/favicon/safari-pinned-tab.svg"
          color="#000000"
        />
        <meta name="msapplication-TileColor" content="#ffffff" />
        <meta httpEquiv="Content-Language" content="en" />
        <meta
          name="description"
          content={
            meta.description ||
            "Inlang is an open source software localization solution build on top of Mozilla's Fluent that strives to make localization (translation) of software easier."
          }
        />
        <meta
          name="og:description"
          content={
            meta.description ||
            "Inlang is an open source software localization solution build on top of Mozilla's Fluent that strives to make localization (translation) of software easier."
          }
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@SamuelStros" />
        <meta
          name="twitter:image"
          // content={
          //   meta.image ||
          //   "https://assets.vercel.com/image/upload/v1572282926/swr/twitter-card.jpg"
          // }
        />
        <meta
          name="og:title"
          content={
            title
              ? title + " – Inlang"
              : "Inlang: Open Source Software Localization Solution"
          }
        />
        <meta
          name="og:image"
          // content={
          //   meta.image ||
          //   "https://assets.vercel.com/image/upload/v1572282926/swr/twitter-card.jpg"
          // }
        />
        <meta name="apple-mobile-web-app-title" content="Inlang" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/docsearch.js@2/dist/cdn/docsearch.min.css"
          media="print"
          onLoad="this.media='all'"
        />
      </>
    );
  },
  footerEditLink: ({ locale }) => {
    switch (locale) {
      // case "de":
      //   return "Bearbeite diese Seite auf GitHub →";
      default:
        return "Edit this page on GitHub →";
    }
  },
  footerText: ({ locale }) => {
    switch (locale) {
      default:
        return (
          <a
            className="flex h-6 gap-2 justify-center"
            href="https://github.com/inlang/inlang"
            target="_blank"
          >
            GitHub
            <svg
              role="img"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <title>GitHub</title>
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
            </svg>
            <img
              alt="stars"
              src="https://badgen.net/github/stars/inlang/inlang"
              className="inline-block mr-2"
            />
          </a>
        );
    }
  },
  i18n: [{ locale: "en-US", text: "English" }],
};
