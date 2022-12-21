import IconGithub from "~icons/cib/github";
import CibGit from "~icons/cib/git";
import MaterialSymbolsArrowRightAltRounded from "~icons/material-symbols/arrow-right-alt-rounded";

export function Hero() {
	return (
		<main>
			<div class="absolute inset-x-0 top-[-10rem] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[-20rem]">
				<svg
					class="relative left-[calc(50%-11rem)] -z-10 h-[21.1875rem] max-w-none -translate-x-1/2 rotate-[30deg] sm:left-[calc(50%-30rem)] sm:h-[42.375rem]"
					viewBox="0 0 1155 678"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						fill="url(#45de2b6b-92d5-4d68-a6a0-9b9b2abad533)"
						fill-opacity=".3"
						d="M317.219 518.975L203.852 678 0 438.341l317.219 80.634 204.172-286.402c1.307 132.337 45.083 346.658 209.733 145.248C936.936 126.058 882.053-94.234 1031.02 41.331c119.18 108.451 130.68 295.337 121.53 375.223L855 299l21.173 362.054-558.954-142.079z"
					/>
					<defs>
						<linearGradient
							id="45de2b6b-92d5-4d68-a6a0-9b9b2abad533"
							x1="1155.49"
							x2="-78.208"
							y1=".177"
							y2="474.645"
							gradientUnits="userSpaceOnUse"
						>
							<stop stop-color="#9089FC"></stop>
							<stop offset="1" stop-color="#FF80B5"></stop>
						</linearGradient>
					</defs>
				</svg>
			</div>
			<div class="relative px-6 lg:px-8">
				<div class="mx-auto max-w-3xl pt-20 pb-32 sm:pt-48 sm:pb-40">
					<div>
						<div class="hidden sm:mb-8 sm:flex sm:justify-center">
							<div class="relative overflow-hidden rounded-full py-1.5 px-4 text-sm leading-6 ring-1 ring-primary-container hover:ring-primary">
								<span>
									We are hiring engineers and designers.{" "}
									<a
										target="_blank"
										href="https://inlang.notion.site/Careers-82277169d07a4d30b9c9b5a625a6a0ef"
										class="font-semibold text-primary"
									>
										<span class="absolute inset-0" aria-hidden="true"></span>
										Careers <span aria-hidden="true">&rarr;</span>
									</a>
								</span>
							</div>
						</div>
						<div>
							<h1 class="text-3xl sm:text-4xl font-bold tracking-tight sm:text-center md:text-5xl lg:text-6xl">
								<span class="block xl:inline">
									Developer-first localization
								</span>
								<span class="inline xl:block text-primary">
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
							<p class="mt-6 text-base sm:text-lg leading-8 text-gray-600 sm:text-center">
								Inlang turns your git repository into the collaboration and
								automation hub for localization while keeping full control and
								flexibility.
							</p>
							<div class="mt-8 flex gap-x-4 sm:justify-center">
								<sl-button
									prop:href="/documentation/introduction"
									prop:size="large"
									prop:variant="primary"
								>
									Get started
									<MaterialSymbolsArrowRightAltRounded slot="suffix"></MaterialSymbolsArrowRightAltRounded>
								</sl-button>

								<sl-button
									prop:href="https://github.com/inlang/inlang"
									prop:target="_blank"
									prop:size="large"
								>
									View on GitHub
									<IconGithub slot="suffix"></IconGithub>
								</sl-button>
							</div>
						</div>
						<div class="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]">
							<svg
								class="relative left-[calc(50%+3rem)] h-[21.1875rem] max-w-none -translate-x-1/2 sm:left-[calc(50%+36rem)] sm:h-[42.375rem]"
								viewBox="0 0 1155 678"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									fill="url(#ecb5b0c9-546c-4772-8c71-4d3f06d544bc)"
									fill-opacity=".3"
									d="M317.219 518.975L203.852 678 0 438.341l317.219 80.634 204.172-286.402c1.307 132.337 45.083 346.658 209.733 145.248C936.936 126.058 882.053-94.234 1031.02 41.331c119.18 108.451 130.68 295.337 121.53 375.223L855 299l21.173 362.054-558.954-142.079z"
								/>
								<defs>
									<linearGradient
										id="ecb5b0c9-546c-4772-8c71-4d3f06d544bc"
										x1="1155.49"
										x2="-78.208"
										y1=".177"
										y2="474.645"
										gradientUnits="userSpaceOnUse"
									>
										<stop stop-color="#9089FC"></stop>
										<stop offset="1" stop-color="#FF80B5"></stop>
									</linearGradient>
								</defs>
							</svg>
						</div>
					</div>
				</div>
			</div>
		</main>
	);
}
