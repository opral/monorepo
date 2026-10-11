import { getTranslations, setRequestLocale } from "next-intl/server";
import ClientPart from "./ClientPart";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Home");
  const nav = await getTranslations("Nav");
  const summary = await getTranslations("Checkout.Summary");
  const root = await getTranslations();
  const rows: Array<[string, React.ReactNode]> = [];
  const has = (key: string) => t.has(key);
  const safe = (key: string, render: () => React.ReactNode) =>
    has(key) ? render() : `MISSING(${key})`;

  rows.push(["title", safe("title", () => t("title", { appName: "Shop" }))]);
  rows.push(["description", safe("description", () => t("description"))]);
  for (const count of [0, 1, 2, 5]) {
    rows.push([`cart-${count}`, safe("cart", () => t("cart", { count }))]);
    rows.push([
      `unread-${count}`,
      safe("unread", () =>
        t.rich("unread", { count, b: (chunks) => <b>{chunks}</b> })
      ),
    ]);
  }
  for (const gender of ["female", "male", "other"]) {
    rows.push([`liked-${gender}`, safe("liked", () => t("liked", { gender }))]);
    for (const count of [1, 5]) {
      rows.push([
        `invites-${gender}-${count}`,
        safe("invites", () => t("invites", { gender, count })),
      ]);
    }
  }
  for (const place of [1, 2, 3, 4, 11, 22]) {
    rows.push([`place-${place}`, safe("place", () => t("place", { place }))]);
  }
  rows.push([
    "terms",
    safe("terms", () =>
      t.rich("terms", {
        b: (chunks) => <b>{chunks}</b>,
        link: (chunks) => <a href="/privacy">{chunks}</a>,
      })
    ),
  ]);
  rows.push(["price", safe("price", () => t("price", { price: 12.5 }))]);
  rows.push([
    "updated",
    safe("updated", () => t("updated", { date: new Date(Date.UTC(2026, 9, 11)) })),
  ]);
  rows.push(["escaped", safe("escaped", () => t("escaped"))]);
  rows.push(["apostrophe", safe("apostrophe", () => t("apostrophe"))]);
  rows.push(["nav-home", nav.has("home") ? nav("home") : "MISSING(home)"]);
  rows.push(["nav-about", nav.has("about") ? nav("about") : "MISSING(about)"]);
  rows.push([
    "nav-links",
    nav.has("links") ? (nav.raw("links") as string[]).join("|") : "MISSING(links)",
  ]);
  rows.push([
    "summary-title",
    summary.has("title") ? summary("title") : "MISSING(title)",
  ]);
  rows.push([
    "summary-shipping",
    summary.has("shipping") ? summary("shipping", { city: "Berlin" }) : "MISSING(shipping)",
  ]);
  rows.push([
    "summary-total",
    summary.has("total") ? summary("total", { amount: "42 €" }) : "MISSING(total)",
  ]);
  rows.push([
    "legacy-dots",
    root.has("Legacy")
      ? String((root.raw("Legacy") as Record<string, string>)["key.with.dots"])
      : "MISSING(Legacy)",
  ]);

  return (
    <main>
      <ul>
        {rows.map(([key, value]) => (
          <li key={key} data-k={key}>
            {value}
          </li>
        ))}
      </ul>
      <ClientPart />
    </main>
  );
}
