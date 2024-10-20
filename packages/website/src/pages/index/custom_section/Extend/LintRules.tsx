import Link from "#src/renderer/Link.jsx";
import { registry } from "@inlang/marketplace-registry";
import { For } from "solid-js";
import { Arrow } from "../Personas/Developer.jsx";
import { Button } from "../../components/Button.jsx";
import * as m from "#src/paraglide/messages.js";

const LintRulesSection = () => {
  const getLintRules = {
    "messageLintRule.inlang.missingTranslation":
      "/images/lint-rule-covers/lint-rule-cover-missing-message.png",
    "messageLintRule.inlang.camelCaseId":
      "/images/lint-rule-covers/lint-rule-cover-camel-case.png",
    "messageLintRule.inlang.messageWithoutSource":
      "/images/lint-rule-covers/lint-rule-cover-outdated.png",
    "Custom Brand Rule": "/images/lint-rule-covers/lint-rule-cover-brand.png",
  };

  const getCheckList = () => [
    m.home_extend_lint_list_quality(),
    m.home_extend_lint_list_resolve(),
  ];

  return (
    <div class="lg:grid grid-cols-12 w-full">
      <div class="col-span-10 col-start-2 bg-surface-100 w-full px-6 md:px-8 pt-3 pb-6 md:py-8 rounded-2xl border border-surface-200">
        <div class="w-full grid grid-cols-1 md:grid-cols-12 sm:gap-8 lg:gap-0">
          <div class="w-full col-span-12 md:col-span-8 row-start-2 md:row-auto">
            <div class="grid grid-rows-4 sm:grid-rows-2 sm:grid-cols-2 gap-4 w-full lg:-translate-x-16">
              <For each={Object.keys(getLintRules)}>
                {(lintRule) => {
                  const coverImage = (): string =>
                    // @ts-ignore
                    getLintRules[lintRule] ? getLintRules[lintRule] : "";

                  const manifest = registry.find(
                    (manifest) => manifest.id === lintRule,
                  );
                  if (!manifest) {
                    return (
                      <Link
                        href={`/documentation/lint-rule/guide`}
                        class="col-span-1 bg-background border border-surface-200 hover:border-surface-400 rounded-2xl px-6 py-5 pb-4 flex flex-col gap-4 transition-all w-full"
                      >
                        <img
                          class="rounded-xl w-full bg-surface-100"
                          src={coverImage()}
                          alt={lintRule}
                        />
                        <div class="flex justify-between items-center gap-1">
                          <div class="flex items-center gap-2">
                            <div class="w-8 h-8 relative group hover:bg-[#FFEDCA] rounded-lg text-[#FAAB11]">
                              <WarningIcon />
                              <div class="absolute hidden group-hover:block transition-all bg-surface-700 rounded-lg w-24 py-2 -translate-x-8 bottom-9 text-background text-center">
                                {m.home_extend_lint_warning()}
                              </div>
                            </div>

                            <div class="flex-1 font-bold text-surface-600">
                              {lintRule}
                            </div>
                          </div>
                          <div class="w-8 h-8 border border-surface-300 rounded-full flex justify-center items-center group-hover:bg-surface-100 transition-all text-surface-500 group-hover:text-surface-900">
                            <Arrow />
                          </div>
                        </div>
                      </Link>
                    );
                  }
                  const displayName = () =>
                    typeof manifest.displayName === "object"
                      ? manifest.displayName.en
                      : manifest.displayName;

                  return (
                    <Link
                      href={`/m/${manifest.uniqueID}/${manifest.id.replaceAll(".", "-")}`}
                      class="col-span-1 bg-background border border-surface-200 hover:border-surface-400 rounded-2xl px-6 py-5 pb-4 flex flex-col gap-4 transition-all"
                    >
                      <img
                        class="rounded-xl w-full bg-surface-100"
                        src={coverImage()}
                        alt={displayName()}
                      />
                      <div class="flex justify-between items-center gap-1">
                        <div class="flex items-center gap-2">
                          <div class="w-8 h-8 relative group hover:bg-[#FFEDED] rounded-lg text-[#FF4F4F]">
                            <WarningIcon />
                            <div class="absolute hidden group-hover:block transition-all bg-surface-700 rounded-lg w-20 py-2 -translate-x-6 bottom-9 text-background text-center">
                              {m.home_extend_lint_error()}
                            </div>
                          </div>
                          <div class="flex-1 font-bold text-surface-600">
                            {displayName()}
                          </div>
                        </div>
                        <div class="w-8 h-8 border border-surface-300 rounded-full flex justify-center items-center group-hover:bg-surface-100 transition-all text-surface-500 group-hover:text-surface-900">
                          <Arrow />
                        </div>
                      </div>
                    </Link>
                  );
                }}
              </For>
            </div>
          </div>
          <div class="col-span-12 md:col-span-4 row-start-1 md:row-auto flex flex-col justify-between py-4 lg:pr-8 pb-10 sm:pb-0">
            <div class="md:mt-6 flex flex-col gap-3 pb-8">
              <h3 class="font-semibold text-surface-900 text-2xl">
                {m.home_extend_lint_title()}
              </h3>
              <p class="text-surface-500 mt-2">
                {m.home_extend_lint_description()}
              </p>
              <div class="mt-4">
                <For each={getCheckList()}>
                  {(item) => (
                    <div class="flex gap-2 items-center">
                      <CheckIcon />
                      <p class="text-surface-900">{item}</p>
                    </div>
                  )}
                </For>
              </div>
            </div>
            <Button type="secondaryOnGray" href="/c/lint-rules" chevron>
              {m.home_extend_lint_button()}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LintRulesSection;

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="25"
      fill="none"
      viewBox="0 0 24 25"
    >
      <path
        fill="#06B6D4"
        d="M9.55 18.502l-5.7-5.7 1.425-1.425 4.275 4.275 9.175-9.175 1.425 1.425-10.6 10.6z"
      />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      viewBox="0 0 32 32"
    >
      <path
        fill="currentColor"
        d="M14.662 19.997h2.667v2.667h-2.667v-2.667zm0-10.666h2.667v8h-2.667v-8zm1.333-6.667c-7.373 0-13.333 6-13.333 13.333A13.333 13.333 0 1015.995 2.664zm0 24a10.667 10.667 0 110-21.333 10.667 10.667 0 010 21.333z"
      />
    </svg>
  );
}
