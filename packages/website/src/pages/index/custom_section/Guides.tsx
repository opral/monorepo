import { For } from "solid-js";
import * as m from "#src/paraglide/messages.js";
import { registry } from "@inlang/marketplace-registry";
import { Button } from "../components/Button.jsx";
import Link from "#src/renderer/Link.jsx";
import { Arrow } from "./Personas/Developer.jsx";

const Guides = () => {
  const getGuides = () => [
    "guide.nilsjacobsen.buildAGlobalSvelteApp",
    "guide.lorissigrist.buildAGlobalSolidStartApp",
    "guide.lorissigrist.buildAGlobalAstroApp",
    "guide.nilsjacobsen.ecosystemCompatible",
    "guide.nilsjacobsen.reviewSystem",
  ];
  return (
    <div class="w-full flex gap-4 mt-28 mb-4 flex-col-reverse md:flex-row">
      <div class="w-full grid grid-cols-12">
        <div class="col-span-12 md:col-span-4 flex flex-col items-center md:items-start">
          <p class="bg-background px-4 py-1.5 rounded-full text-sm font-medium w-fit border shadow border-surface-300">
            {m.home_guides_tag()}
          </p>
          <h2 class="font-bold text-2xl md:text-4xl text-surface-900 mt-5">
            {m.home_guides_title()}
          </h2>
          <p class="text-lg max-w-[600px] text-center md:text-start text-surface-500 pt-5 pb-10">
            {m.home_guides_description()}
          </p>
          <Button href="/c/guides" type="secondary">
            {m.home_guides_button_text()}
          </Button>
        </div>

        <div class="mt-10 md:mt-0 col-span-12 md:col-start-5 lg:col-start-6 md:col-span-8 lg:col-span-7 flex flex-col divide-y divide-surface-200">
          <For each={getGuides()}>
            {(guide) => {
              const manifest = registry.find(
                (manifest) => manifest.id === guide,
              );
              if (!manifest) {
                return undefined;
              }
              const displayName = () =>
                typeof manifest.displayName === "object"
                  ? manifest.displayName.en
                  : manifest.displayName;
              return (
                <Link
                  href={`/g/${manifest.uniqueID}/${manifest.id.replaceAll(".", "-")}`}
                  class="gap-8 py-6 flex group hover:cursor-pointer items-center"
                >
                  <img
                    class="w-10 h-10 object-cover object-center rounded-lg"
                    src={manifest.icon}
                    alt={displayName()}
                  />
                  <h3 class="flex-1 m-0 text-surface-600 text-xl leading-snug no-underline font-semibold">
                    {displayName()}
                  </h3>
                  <div class="w-8 h-8 border border-surface-300 rounded-full flex justify-center items-center group-hover:bg-surface-100 transition-all text-surface-500 group-hover:text-surface-900">
                    <Arrow />
                  </div>
                </Link>
              );
            }}
          </For>
        </div>
      </div>
    </div>
  );
};

export default Guides;
