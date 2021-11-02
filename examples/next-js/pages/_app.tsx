import "../styles/globals.css";
import "tailwindcss/tailwind.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import TypesafeI18n, { I18nContext } from "../i18n/i18n-react";
import { useRouter } from "next/dist/client/router";
import { Locales } from "../i18n/i18n-types";
import { useContext } from "react";

/**
 * Detects changes of the language parameter in the route and sets
 * typesafe-i18n's locale accordingly.
 *
 *
 * @returns null
 */
function AutoDetectLanguage() {
  // internal state of typesafe-i18n
  const { setLocale, locale } = useContext(I18nContext);
  // state of i18n routing read more here https://docs.inlang.dev/definitions/i18n-routing
  const router = useRouter();

  if (router.locale !== locale) {
    setLocale(router.locale as Locales);
  }

  // should not return anything
  return null;
}

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  return (
    <>
      {/* --- bedin embedding https://bromb.co feedback widget  */}
      <Head>
        <script async defer src="https://app.bromb.co/widget.js"></script>
      </Head>
      {/* --- end */}
      <TypesafeI18n initialLocale={router.locale as Locales | undefined}>
        <AutoDetectLanguage />
        <Component {...pageProps} />
      </TypesafeI18n>
    </>
  );
}
export default MyApp;
