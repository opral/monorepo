import { redirect } from "@/lib/i18n";
import * as m from "@/paraglide/messages.js";
import { languageTag } from "@/paraglide/runtime";
import { Metadata } from "next";
import ServerActionTester from "./ServerAction";

export function generateMetadata(): Metadata {
  const locale = languageTag();
  return {
    title: m.paraglide_and_next_app_router(),
    description: m.this_app_was_localised_with_paraglide(),
    icons: "/favicon.png",
    openGraph: {
      locale,
    },
  };
}

export default function About() {
  async function redirectHome() {
    "use server";
    redirect("/");
  }

  return (
    <>
      <main>
        <h1>{m.about()}</h1>

        <form action={redirectHome}>
          <button type="submit">Home</button>
        </form>

        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation ullamco laboris nisi ut
          aliquip ex ea commodo consequat. Duis aute irure dolor in
          reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
          pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
          culpa qui officia deserunt mollit anim id est laborum.
        </p>
        <ServerActionTester />
      </main>
    </>
  );
}
