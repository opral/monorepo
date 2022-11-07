export function Hero() {
	return (
		<>
			<div class=" h-full overflow-hidden  bg-background sm:px-6 md:px-0	 ">
				<div class="relative z-10 bg-background my-auto min-h-full    pb-8 sm:pb-16 md:pb-20 lg:w-full lg:max-w-2xl lg:pb-28 xl:pb-32">
					{/* <svg
						class="absolute inset-y-0 right-0 hidden h-full w-48 translate-x-1/2 transform text-white lg:block"
						fill="currentColor"
						viewBox="0 0 100 100"
						preserveAspectRatio="none"
						aria-hidden="true"
					>
						<polygon points="50,0 100,0 50,100 0,100" />
					</svg> */}

					<div>
						{/* <div class="relative px-4 pt-6 sm:px-6 lg:px-8"></div>

						<div class="absolute inset-x-0 top-0 z-10 origin-top-right transform p-2 transition md:hidden">
							<div class="overflow-hidden rounded-lg bg-background shadow-md ring-1 ring-black ring-opacity-5">
								<div class="flex items-center justify-between px-5 pt-4">
									<div>
										<img
											class="h-8 w-auto"
											src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=600"
											alt=""
										/>
									</div>
								</div>
							</div>
						</div> */}

						<main class="mx-auto  sm:mt-12  md:mt-16 lg:mt-20  ">
							<div class="sm:text-center lg:text-left">
								<h1 class="text-4xl font-bold tracking-tight text-on-backround sm:text-5xl md:text-6xl">
									<span class="block xl:inline">
										Developer-first localization{" "}
									</span>
									<span class="block text-indigo-600 xl:inline">
										infrastructure for software
									</span>
								</h1>
								<p class="mt-3 text-base text-on-backround sm:mx-auto sm:mt-5 sm:max-w-xl sm:text-lg md:mt-5 md:text-xl lg:mx-0">
									Brisket swine hamburger landjaeger tenderloin, meatball ham
									hock shoulder sausage meatloaf chislic. Filet mignon
									burgdoggen tenderloin, pastrami ball tip bacon shoulder t-bone
									turducken landjaeger cupim picanha venison.
								</p>
								<div class="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
									<div class="rounded-md shadow">
										<a
											href="/documentation/intro"
											class="flex w-full items-center justify-center rounded-md border border-outline bg-primary px-8 py-3 text-base font-medium text-on-primary  md:py-4 md:px-10 md:text-lg"
										>
											Get started
										</a>
									</div>
									<div class="mt-3 sm:mt-0 sm:ml-3">
										<a
											href="https://github.com/inlang/inlang"
											class="flex w-full items-center justify-center rounded-md border border-outline bg-secondary-container px-8 py-3 text-base font-medium text-on-secondary-container  md:py-4 md:px-10 md:text-lg"
										>
											View on Github
										</a>
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
