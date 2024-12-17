import "@/lib/ui/styles.css";
import {
  LanguageProvider,
  generateAlternateLinks,
} from "@inlang/paraglide-next";
import { AvailableLanguageTag, languageTag } from "@/paraglide/runtime";
import { Header } from "@/lib/ui/Header";
import * as m from "@/paraglide/messages.js";
import type { Metadata, ResolvingMetadata } from "next";
import { strategy } from "@/lib/i18n";

export function generateMetadata(
  _: unknown,
  parent: ResolvingMetadata,
): Metadata {
  const locale = languageTag();
  return {
    title: m.paraglide_and_next_app_router(),
    description: m.this_app_was_localised_with_paraglide(),
    icons: "/favicon.png",
    openGraph: {
      locale,
    },
    alternates: {
      languages: generateAlternateLinks({
        origin: "https://example.com",
        strategy: strategy,
        resolvingMetadata: parent,
      }),
    },
  };
}

const direction: Record<AvailableLanguageTag, "ltr" | "rtl"> = {
  en: "ltr",
  "de-CH": "ltr",
  de: "ltr",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LanguageProvider>
      <html lang={languageTag()} dir={direction[languageTag()]}>
        <body>
          <Header />
          <main className="container">{children}</main>
        </body>
      </html>
    </LanguageProvider>
  );
}
