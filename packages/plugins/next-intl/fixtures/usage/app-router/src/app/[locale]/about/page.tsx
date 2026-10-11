import { setRequestLocale } from "next-intl/server";
import About from "@/content/about.mdx";

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <About />;
}
