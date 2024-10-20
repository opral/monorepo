import { For, Show } from "solid-js";
import { registry } from "@inlang/marketplace-registry";
import { Chip } from "#src/interface/components/Chip.jsx";
import { colorForTypeOf, typeOfIdToTitle } from "#src/pages/m/utilities.js";
import Link from "#src/renderer/Link.jsx";
import * as m from "#src/paraglide/messages.js";

const featuredArray = [
  "library.inlang.paraglideJs",
  "app.inlang.finkLocalizationEditor",
  "app.inlang.cli",
  "app.inlang.ideExtension",
  "plugin.inlang.i18next",
];

const Hero = () => {
  return (
    <div class="w-full flex gap-4 mt-4 md:mt-10 mb-8 flex-col-reverse md:flex-row">
      <div class="w-full md:w-1/4 md:pr-8">
        <p class="pb-2 text-surface-500 text-sm">{m.home_featured_title()}</p>
        <ul class="divide-y divide-surface-3">
          <For each={featuredArray}>
            {(feature) => {
              const m = registry.find((m) => m.id === feature);
              return (
                <Show when={m}>
                  <li>
                    <Link
                      href={
                        m?.id.split(".")[0] === "guide"
                          ? `/g/${m?.uniqueID}/${m?.id.replaceAll(".", "-")}`
                          : `/m/${m?.uniqueID}/${m?.id.replaceAll(".", "-")}`
                      }
                    >
                      <div class="flex gap-4 hover:bg-background px-1 py-[10px] rounded-lg items-center">
                        <img
                          class="w-9 h-9 rounded-md m-0 shadow-lg object-cover object-center"
                          src={m?.icon}
                          alt={m?.id}
                        />
                        <div class="flex w-full flex-col gap-1">
                          <h3 class="text-sm w-full pr-10 text-surface-800 font-semibold truncate">
                            {typeof m?.displayName === "string"
                              ? m.displayName
                              : typeof m?.displayName === "object"
                                ? (m.displayName as { en: string }).en
                                : "Module"}
                          </h3>
                          <Show when={m}>
                            <Chip
                              text={typeOfIdToTitle(m!.id)}
                              color={colorForTypeOf(m!.id)}
                              customClasses="w-fit"
                            />
                          </Show>
                        </div>
                      </div>
                    </Link>
                  </li>
                </Show>
              );
            }}
          </For>
        </ul>
      </div>
      <div class="flex-1 flex flex-col gap-4 md:py-0 bg-background rounded-2xl border border-surface-200 overflow-hidden lg:min-h-[375px]">
        <img
          class="flex-1 hidden md:block w-full max-h-[260px] object-cover object-top"
          src="./images/ecosystem-inlang.jpg"
          alt="inlang Ecosystem"
        />
        <img
          class="md:hidden"
          src="./images/ecosystem-inlang.jpg"
          alt="inlang Ecosystem"
        />
        <div class="flex flex-col md:flex-row items-start md:items-end px-8 pb-6 pt-3">
          <div class="flex flex-col gap-2 flex-1">
            <h1 class="text-base text-surface-900 font-semibold leading-snug">
              Old Title
            </h1>
            <p class="text-sm text-surface-500">
              {m.home_inlang_description()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
