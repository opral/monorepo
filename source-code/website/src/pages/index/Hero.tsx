import IconGithub from "~icons/cib/github";
import CibGit from "~icons/cib/git";
import MaterialSymbolsArrowRightAltRounded from "~icons/material-symbols/arrow-right-alt-rounded";

export function Hero() {
  return (
    <div class="mx-auto max-w-3xl pt-16 pb-24 sm:pt-32 sm:pb-40">
      <div class="hidden sm:mb-8 sm:flex sm:justify-center">
        <div class="relative overflow-hidden rounded-full py-1.5 px-4 text-sm leading-6 ring-1 ring-primary-container hover:ring-primary">
          <span>
            We are hiring engineers and designers.{" "}
            <a
              target="_blank"
              href="https://inlang.notion.site/Careers-82277169d07a4d30b9c9b5a625a6a0ef"
              class="font-semibold text-primary"
            >
              <span class="absolute inset-0" aria-hidden="true" />
              Careers <span aria-hidden="true">&rarr;</span>
            </a>
          </span>
        </div>
      </div>
      <div>
        <h1 class="text-3xl sm:text-4xl font-bold tracking-tight sm:text-center md:text-5xl lg:text-6xl">
          <span class="block xl:inline">Developer-first localization</span>
          <span class="inline xl:block text-primary">
            infrastructure{" "}
            <span class="text-on-background">
              built on{" "}
              <span class="inline-block">
                git
                {/* custom git color */}
                <CibGit class="text-[#F54D27] inline pl-2 md:pl-3" />
              </span>
            </span>
          </span>
        </h1>
        <p class="mt-2 md:mt-6 text-base sm:text-lg md:leading-6 text-gray-600 sm:text-center">
          Inlang turns your git repository into the collaboration and automation
          hub for localization while keeping full control and flexibility.
        </p>
        <div class="mt-8 flex gap-x-4 sm:justify-center">
          <sl-button
            prop:href="/documentation"
            prop:size="large"
            prop:variant="primary"
          >
            Get started
            <MaterialSymbolsArrowRightAltRounded slot="suffix" />
          </sl-button>
          <sl-button
            prop:href="https://github.com/inlang/inlang"
            prop:target="_blank"
            prop:size="large"
          >
            View on GitHub
            <IconGithub slot="suffix" />
          </sl-button>
        </div>
      </div>
    </div>
  );
}
