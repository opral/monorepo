import IconGithub from "~icons/cib/github"
import CibGit from "~icons/cib/git"
import MaterialSymbolsArrowRightAltRounded from "~icons/material-symbols/arrow-right-alt-rounded"
import Calcom from "./sections/01-hero/assets/clacom.jsx"

export function Hero() {
	return (
		<div class="mx-auto max-w-3xl py-16 md:py-24">
			{/* <div class="hidden sm:mb-8 sm:flex sm:justify-center">
        <div class="relative overflow-hidden rounded-full py-1.5 px-4 text-sm leading-6 ring-1 ring-primary-container hover:ring-primary">
          <span>
            We are hiring engineers to make localization simple.{" "}
            <a
              target="_blank"
              href="https://angel.co/l/2ykzNn"
              class="font-semibold text-primary"
            >
              <span class="absolute inset-0" aria-hidden="true" />
              Careers <span aria-hidden="true">&rarr;</span>
            </a>
          </span>
        </div>
      </div> */}
			<div>
				<h1 class="text-3xl sm:text-4xl font-bold tracking-tight sm:text-center md:text-5xl lg:text-6xl">
					<span class="block xl:inline text-primary">
						Localization infrastructure{" "}
						<span class="text-on-background">
							for software built on{" "}
							<span class="inline-block">
								git
								{/* custom git color */}
								<CibGit class="text-[#F54D27] inline pl-2 md:pl-3" />
							</span>
						</span>
					</span>
				</h1>
				<p class="mt-2 md:mt-6 text-base sm:text-lg md:leading-6 text-gray-600 sm:text-center">
					Inlang makes localization (i18n) simple by leveraging git repositories as collaboration
					and automation hub for localization.
				</p>
				<div class="mt-8 flex gap-x-4 sm:justify-center">
					<sl-button prop:href="/documentation" prop:size="large" prop:variant="primary">
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
	)
}
