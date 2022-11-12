import { createSignal, For, Show } from "solid-js";

export function Header() {
	const links = [
		{ name: "Docs", href: "/documentation" },
		{ name: "Editor", href: "/editor" },
	];

	const [show, setShow] = createSignal(false);

	return (
		<header class="sticky z-40 top-0   max-w-screen-2xl ">
			<nav class="">
				<div class=" flex gap-8 p-4 bg-background border-b border-outline   ">
					<a href="/" class="flex items-center">
						<img
							class="h-8 w-auto "
							src="/favicon/favicon.ico"
							alt=" Company Logo"
						/>
						<span class=" self-center pl-2 text-xl font-bold">inlang</span>
					</a>
					{/* Start icon social media and normal nav   */}
					<div class="z-10 p-2 grid grid-cols-2 w-full items-center ">
						<Show when={show() == false}>
							<div class="hidden md:flex justify-start gap-10">
								<For each={links}>
									{(link) => (
										<a class="link-primary" href={link.href}>
											{link.name}
										</a>
									)}
								</For>
							</div>

							{/* start icon social media   */}
							<div class="hidden md:flex  justify-end gap-10  ">
								<a href="https://twitter.com/inlangHQ" class="flex space-x-1">
									<span class="">Twitter</span>
									<svg
										class="h-6 w-6"
										fill="currentColor"
										viewBox="0 0 24 24"
										aria-hidden="true"
									>
										<path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
									</svg>
								</a>
								<a
									href="https://github.com/inlang/inlang"
									class="link-primary  flex space-x-1"
								>
									<span class="">GitHub</span>
									<svg
										class="h-6 w-6"
										fill="currentColor"
										viewBox="0 0 24 24"
										aria-hidden="true"
									>
										<path
											fill-rule="evenodd"
											d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
											clip-rule="evenodd"
										/>
									</svg>
								</a>
							</div>
						</Show>
					</div>

					{/* end icon social media   */}

					<div class=" md:hidden z-50">
						<Show
							when={show() == false}
							fallback={
								<button
									onClick={(e) => setShow(false)}
									type="button"
									class="inline-flex items-center justify-center  bg-background p-2 text-primary "
									aria-expanded="false"
								>
									<span class="sr-only">Close menu</span>
									{/* <!-- Heroicon name: outline/x-mark --> */}
									<svg
										class="h-6 w-6"
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										stroke-width="1.5"
										stroke="currentColor"
										aria-hidden="true"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M6 18L18 6M6 6l12 12"
										/>
									</svg>
								</button>
							}
						>
							<>
								<button
									onClick={(e) => setShow(true)}
									type="button"
									class="inline-flex items-center justify-center  bg-background p-2 text-primary "
									aria-expanded="false"
								>
									<span class="sr-only">Open menu</span>
									<svg
										class="h-6 w-6"
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										stroke-width="1.5"
										stroke="currentColor"
										aria-hidden="true"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
										/>
									</svg>
								</button>
							</>
						</Show>
					</div>

					{/*Responsive icon end  */}
				</div>
				<Show when={show()}>
					<div class=" absolute transform  shadow-md  transition ">
						{/* <a href="/" class="flex items-center">
								<img
									class="h-8 w-auto "
									src="/favicon/favicon.ico"
									alt=" Company Logo"
								/>
								<span class=" self-center pl-2 text-xl font-bold">inlang</span>
							</a> */}
						<div class="   w-screen h-full bg-background ">
							{/* Nav, responsive */}

							<div class="p-4">
								{/* Change the grid-cols to have more  than one item in a col. */}
								<div class="grid grid-cols-1 gap-4 ">
									{/* TODO */}

									{/* TODO */}
									<For each={links}>
										{(link) => (
											<a class="link-primary" href={link.href}>
												{link.name}
											</a>
										)}
									</For>
									<div>
										<a
											class="flex  space-x-1.5"
											href="https://github.com/inlang/inlang"
										>
											<p>Github</p>
											<p class="flex items-center self-center md:ml-12">
												{" "}
												{/* <Icon icon="codicon:github-inverted" /> */}
											</p>
										</a>
									</div>
									<div>
										<a
											class="flex  space-x-1.5"
											href="https://twitter.com/inlangHQ"
										>
											<p>Twitter</p>
											<p class="flex items-center self-center md:ml-12">
												{" "}
												{/* <Icon icon="codicon:github-inverted" /> */}
											</p>
										</a>
									</div>
								</div>
							</div>
						</div>
					</div>
				</Show>
			</nav>
		</header>
	);
}
