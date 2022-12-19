import IconGithub from "~icons/cib/github";
import CibGit from "~icons/cib/git";

export function Hero() {
	return (
		<div class="py-8 md:py-14 lg:py-20">
			<h1 class="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-on-backround">
				<span class="block xl:inline">Developer-first localization</span>
				<span class="block text-primary">
					infrastructure{" "}
					<span class="text-on-background">
						built on{" "}
						<span class="inline-block">
							git
							{/* custom git color */}
							<CibGit class="text-[#F54D27] inline pl-2 md:pl-3"></CibGit>
						</span>
					</span>
				</span>
			</h1>
			<p class="mt-3 text-base text-on-backround  sm:mt-5 sm:max-w-xl sm:text-lg md:mt-5 md:text-xl ">
				Inlang turns your git repository into the collaboration and automation
				hub for localization while keeping full control and flexibility.
			</p>
			<div class="mt-5 sm:mt-8 sm:flex justify-start">
				<div class="rounded-md shadow ">
					<sl-button
						prop:href="/documentation/intro"
						class="w-full"
						prop:size="large"
						prop:variant="primary"
					>
						Get started
					</sl-button>
				</div>
				<div class="mt-3 sm:mt-0 sm:ml-3">
					<sl-button
						prop:href="https://github.com/inlang/inlang"
						prop:target="_blank"
						class="w-full"
						prop:size="large"
						prop:variant="neutral"
					>
						<IconGithub slot="suffix"></IconGithub>
						View on GitHub
					</sl-button>
				</div>
			</div>
		</div>
	);
}
