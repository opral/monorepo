import { createSignal, For, Show } from "solid-js";
import { Icon } from "@iconify-icon/solid";

const links = [{ name: "Docs", href: "/documantaion" }];

export function Header() {
	const [show, setShow] = createSignal(false);

	return (
		<header class="sticky top-0 z-40 bg-white 	">
			<div
				class="pointer-events-none absolute inset-0 z-30 "
				aria-hidden="true"
			></div>
			<div class="relative z-20">
				<div class=" px-4 sm:px-6 lg:px-8 mx-auto flex  items-center justify-between  py-5  sm:py-4 md:justify-start md:space-x-10 ">
					<div class="">
						<a href="/" class="flex">
							<img
								class="h-8 w-auto sm:h-10"
								src="/favicon/favicon.ico"
								alt=" Company Logo"
							/>
							<span class=" self-center pl-2 text-2xl	font-bold">inlang</span>
						</a>
					</div>
					{/* Responsive icon start */}

					<div class="-my-2 -mr-2 md:hidden">
						<button
							onClick={(e) => setShow(true)}
							type="button"
							class="inline-flex items-center justify-center rounded-md bg-white p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
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
					</div>
					{/*Responsive icon end  */}
					<div class="hidden   items-center md:flex md:flex-1  md:justify-between">
						<nav class="flex space-x-10">
							<For each={links}>
								{(link) => (
									<a class="link-primary" target="_blank" href={link.href}>
										{link.name}
									</a>
								)}
							</For>
						</nav>
						<div class="flex items-center self-center md:ml-12">
							<a class="flex text-lg" href="https://github.com/inlang/inlang">
								<Icon icon="codicon:github-inverted" />
							</a>
						</div>
					</div>
				</div>

				<div class="border-b-4 border-indigo-500 max-w-max "> </div>
				<hr class="border-slate-200 "></hr>
			</div>
			<Show when={show()}>
				<div
					class={
						"absolute inset-x-0 top-0 z-30 origin-top-right transform p-2 transition md:hidden"
					}
				>
					<div class="divide-y-2 divide-gray-50 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5">
						<div class="px-5 pt-5 pb-6 sm:pb-8">
							<div class="flex items-center justify-between">
								<div class="">
									<a href="/" class="flex">
										<img
											class="h-8 w-auto sm:h-10"
											src="/favicon/favicon.ico"
											alt=" Company Logo"
										/>
										<span class=" self-center pl-2 text-2xl	font-bold">
											inlang
										</span>
									</a>
								</div>
								<div class="-mr-2">
									<button
										onClick={(e) => setShow(false)}
										type="button"
										class="inline-flex items-center justify-center rounded-md bg-white p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
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
								</div>
							</div>
							{/* Nav, responsive */}
						</div>
						<div class="py-6 px-5">
							{/* Change the grid-cols to have more  than one item in a col. */}
							<div class="grid grid-cols-1 gap-4 ">
								{/* TODO */}

								{/* TODO */}
								<For each={links}>
									{(link) => (
										<a class="link-primary" target="_blank" href={link.href}>
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
											<Icon icon="codicon:github-inverted" />
										</p>
									</a>
								</div>
							</div>
						</div>
					</div>
				</div>
			</Show>
		</header>
	);
}
