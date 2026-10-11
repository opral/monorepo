import { getTranslations } from "next-intl/server";

export async function Summary({ city }: { city: string }) {
  const t = await getTranslations("Checkout.Summary");
  return (
    <section>
      <h2>{t("title")}</h2>
      <p>{t("shipping", { city })}</p>
    </section>
  );
}
