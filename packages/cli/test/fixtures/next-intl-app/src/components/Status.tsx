"use client";
import { useTranslations } from "next-intl";

export function Status({ state }: { state: "open" | "closed" }) {
  const t = useTranslations("Status");
  return <span>{t(state)}</span>;
}
