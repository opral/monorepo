export function Hero() {
	return (
		<>
			<div class=" h-full overflow-hidden  bg-background sm:px-6 md:px-0 xl:px-4	 ">
				<div class="relative z-10 bg-background my-auto min-h-full    pb-8 sm:pb-16 md:pb-20 lg:w-full lg:max-w-2xl lg:pb-28 xl:pb-32">
					<div>
						<main class="mx-auto  sm:mt-12  md:mt-16 lg:mt-20  ">
							<div class=" text-left">
								<h1 class="text-4xl font-bold tracking-tight text-on-backround sm:text-5xl md:text-6xl">
									<span class="block xl:inline">
										Developer-first localization{" "}
									</span>
									<span class="block text-on-background xl:inline">
										infrastructure for software
									</span>
								</h1>
								<p class="mt-3 text-base text-on-backround  sm:mt-5 sm:max-w-xl sm:text-lg md:mt-5 md:text-xl ">
									Brisket swine hamburger landjaeger tenderloin, meatball ham
									hock shoulder sausage meatloaf chislic. Filet mignon
									burgdoggen tenderloin, pastrami ball tip bacon shoulder t-bone
									turducken landjaeger cupim picanha venison.
								</p>
								<div class="mt-5 sm:mt-8 sm:flex  justify-start">
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
											class="w-full"
											prop:size="large"
											prop:variant="neutral"
										>
											View on Github
										</sl-button>
									</div>
								</div>
							</div>
						</main>
					</div>
				</div>
				{/* <div class="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
					<img
						class="h-56 w-full object-cover sm:h-72 md:h-96 lg:h-full lg:w-full"
						src="https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2850&q=80"
						alt=""
					/>
				</div> */}
			</div>
		</>
	);
}
