import { getTranslations, setRequestLocale } from "next-intl/server";
import ClientPart from "./ClientPart";
import { Summary } from "@/components/Summary";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return { title: t("title"), description: t("description") };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Home");
  return (
    <main>
      <h1>{t("title", { appName: "Shop" })}</h1>
      <p>{t("description")}</p>
      <p>{t.rich("terms", { b: (chunks) => <b>{chunks}</b> })}</p>
      <ClientPart />
      <Summary city="Berlin" />
    </main>
  );
}
