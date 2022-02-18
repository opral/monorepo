// config for the nextra doc theme

/* eslint-disable @next/next/no-img-element */
import { useRouter } from "next/router";

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  projectLink: "https://github.com/inlang/inlang",
  docsRepositoryBase:
    "https://github.com/inlang/inlang/tree/main/website/pages/docs",
  projectChatLink: "https://discord.gg/CUkj4fgz5K",
  titleSuffix: " – inlang",
  logo: (
    <>
      <img className="h-8 pr-1.5" src="/logo.svg" alt="logo"></img>
      <span className="font-bold">inlang</span>
    </>
  ),
  head: (
    <>
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon.ico" />
      <meta name="msapplication-TileColor" content="#ffffff" />
      <meta name="theme-color" content="#ffffff" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Language" content="en" />
      <meta
        name="description"
        content="Inlang: The open source localization solution for software."
      />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@SamuelStros" />
      <meta
        property="og:title"
        content="Inlang: The open source localization solution for software."
      />
      <meta
        property="og:description"
        content="Inlang: The open source localization solution for software."
      />
      <meta name="apple-mobile-web-app-title" content="Inlang" />
    </>
  ),
  search: true,
  unstable_flexsearch: true,
  unstable_stork: false,
  prevLinks: true,
  nextLinks: true,
  floatTOC: true,
  footer: true,
  footerEditLink: ({ locale }) => "Edit this page on GitHub",
  footerText: <>{new Date().getFullYear()} © Inlang.</>,
  feedbackLink: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { locale } = useRouter();
    const translations = {
      en: "Question? Give us feedback →",
      de: "Fragen? Gib Feedback →",
    };
    return translations[locale] || translations["en"];
  },
  feedbackLabels: "feedback",
  i18n: [
    { locale: "en", text: "English" },
    { locale: "de", text: "Deutsch" },
  ],
};
