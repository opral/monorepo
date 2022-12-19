import IconGithub from "~icons/cib/github";

export function Hero() {
	return (
		<div class="py-8 sm:py-20">
			<h1 class="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-on-backround">
				<span class="block xl:inline">Developer-first localization</span>

				<span class="block text-primary">infrastructure</span>
			</h1>
			<p class="mt-3 text-base text-on-backround  sm:mt-5 sm:max-w-xl sm:text-lg md:mt-5 md:text-xl ">
				Brisket swine hamburger landjaeger tenderloin, meatball ham hock
				shoulder sausage meatloaf chislic. Filet mignon burgdoggen tenderloin,
				pastrami ball tip bacon shoulder t-bone turducken landjaeger cupim
				picanha venison.
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
						View on Github
					</sl-button>
				</div>
			</div>
		</div>
	);
}
