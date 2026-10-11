"use client";
import { useTranslations } from "next-intl";

export function Nav() {
  const t = useTranslations("Nav");
  return (
    <nav>
      {t("home")} · {t("about")}
    </nav>
  );
}
