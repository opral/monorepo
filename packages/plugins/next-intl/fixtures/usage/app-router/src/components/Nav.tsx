"use client";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const links = [
  { href: "/", key: "home" },
  { href: "/about", key: "about" },
] as const;

export function Nav() {
  const t = useTranslations("Nav");
  const keys = ["home", "about"] as const;
  return (
    <nav aria-label={t("home")}>
      {keys.map((key, index) => (
        <Link key={key} href={links[index]!.href}>
          {t(key)}
        </Link>
      ))}
    </nav>
  );
}
