"use client";
import { useTranslations } from "next-intl";

export default function ClientPart() {
  const t = useTranslations("Home");
  return (
    <section>
      <p data-k="client-cart-0">{t("cart", { count: 0 })}</p>
      <p data-k="client-cart-1">{t("cart", { count: 1 })}</p>
      <p data-k="client-cart-5">{t("cart", { count: 5 })}</p>
    </section>
  );
}
