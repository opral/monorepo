import "../styles/globals.css";
import "tailwindcss/tailwind.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import TypesafeI18n from "../i18n/i18n-react";
import { useRouter } from "next/dist/client/router";
import { Locales } from "../i18n/i18n-types";

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
        <Component {...pageProps} />
      </TypesafeI18n>
    </>
  );
}
export default MyApp;
