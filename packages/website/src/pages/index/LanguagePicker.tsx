import { Show, For, onMount, createSignal } from "solid-js";
import IconExpand from "~icons/material-symbols/expand-more-rounded";
import {
  setLanguageTag,
  availableLanguageTags,
  languageTag,
} from "#src/paraglide/runtime.js";
import type { LanguageTag } from "@inlang/sdk";

export function LanguagePicker() {
  const languageNames: Record<LanguageTag, string> = {
    en: "English",
    de: "Deutsch",
    fr: "Français",
    it: "Italiano",
    zh: "中文",
    sk: "Slovak",
    "pt-BR": "Portuguese Brazil",
    name: "English",
  };

  const [isMounted, setIsMounted] = createSignal(false);

  onMount(() => {
    setIsMounted(true);
  });

  return (
    <div class="w-fit">
      <sl-dropdown prop:distance={4}>
        <div
          slot="trigger"
          class={
            "cursor-pointer h-8 flex items-center font-medium text-sm text-surface-700 hover:text-primary bg-surface-100 pl-2 pr-1 rounded-lg"
          }
        >
          <WorldIcon />
          <IconExpand class="w-5 h-5 opacity-50" />
        </div>
        <Show when={isMounted()}>
          <sl-menu>
            <For each={availableLanguageTags}>
              {(language) => (
                <sl-menu-item
                  prop:type="checkbox"
                  prop:checked={language === languageTag()}
                  onClick={() =>
                    language !== languageTag() && setLanguageTag(language)
                  }
                >
                  <div class="flex flex-wrap gap-x-2 items-center">
                    <p class="text-sm">{languageNames[language]}</p>
                    <Show when={language !== "en" && language !== "de"}>
                      <p class="flex items-center text-xs bg-surface-100 border border-surface-300 rounded-full text-surface-500 px-[6px] h-5">
                        {"Community"}
                      </p>
                    </Show>
                  </div>
                  <p class="opacity-50 text-sm" slot="suffix">
                    {language}
                  </p>
                </sl-menu-item>
              )}
            </For>
          </sl-menu>
        </Show>
      </sl-dropdown>
    </div>
  );
}

function WorldIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      fill="none"
      viewBox="0 0 27 27"
    >
      <path
        fill="#334155"
        d="M13.338 0C5.97 0 0 5.971 0 13.338c0 7.366 5.971 13.337 13.338 13.337 7.366 0 13.337-5.971 13.337-13.337C26.675 5.97 20.704 0 13.338 0zm0 24.008l2.667-2.668 1.334-1.334V17.34H14.67v-1.334l-1.333-1.334H9.336v4.002l2.668 2.667v2.576c-5.255-.66-9.336-5.147-9.336-10.578L4 14.67H6.67v-2.667h2.667l4.002-4.001V5.335H10.67L9.336 4.001v-.548a10.597 10.597 0 018.003 0v1.882L16.005 6.67v2.667l1.334 1.334 4.175-4.175a10.646 10.646 0 012.142 4.175H21.34l-2.667 2.668v2.667l1.334 1.334h2.667l.381.381c-1.676 3.702-5.397 6.288-9.717 6.288z"
      />
    </svg>
  );
}
