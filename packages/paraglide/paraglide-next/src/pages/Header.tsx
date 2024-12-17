import Head from "next/head";
import { useRouter } from "next/router";
import React from "react";

/**
 * Adds alternate links for all available languages to the head.
 */
export default function Header(props: {
  availableLanguageTags: readonly string[];
  sourceLanguageTag: string;
}): React.ReactNode {
  const router = useRouter();

  function getTranslatedPath(languageTag: string) {
    if (languageTag === props.sourceLanguageTag) return router.asPath;
    return `/${languageTag}${router.asPath}`;
  }

  return (
    <Head>
      {props.availableLanguageTags.map((lang) => (
        <link
          rel="alternate"
          hrefLang={lang}
          href={getTranslatedPath(lang)}
          key={lang}
        />
      ))}
    </Head>
  );
}
