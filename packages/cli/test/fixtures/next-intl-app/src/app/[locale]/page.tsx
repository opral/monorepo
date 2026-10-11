import { getTranslations } from "next-intl/server";
import { Nav } from "@/components/Nav";

export default async function Page() {
  const t = await getTranslations("Home");
  return (
    <main>
      <Nav />
      <h1>{t("title")}</h1>
      <p>{t.rich("terms", { b: (chunks) => <b>{chunks}</b> })}</p>
    </main>
  );
}
