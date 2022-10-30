import { createSignal, For } from "solid-js";

const links = [
	{ name: "Docs", href: "/documantaion" },
	{ name: "Docs", href: "/documantaion" },
];

export function Header() {
	return (
		<div class="sticky top-0 z-40 bg-white 	">
			<div
				class="pointer-events-none absolute inset-0 z-30 "
				aria-hidden="true"
			></div>
			<div class="relative z-20">
				<div class="mx-auto flex  items-center justify-between px-4 py-5 sm:px-6 sm:py-4 md:justify-start md:space-x-10 lg:px-8">
					<div class="h-8 w-auto sm:h-10">
						<a href="#" class="flex">
							<span class="sr-only">Inlang</span>
							<img class="h-8 w-auto sm:h-10" src="logo.svg" alt="" />
						</a>
					</div>
					{/* Responsive icon start */}
					<div class="-my-2 -mr-2 md:hidden">
						<button
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
					<div class="hidden md:flex md:flex-1 md:items-center md:justify-between">
						<nav class="flex space-x-10">
							<For each={links}>
								{(link) => (
									<a class="link-primary" target="_blank" href={link.href}>
										{link.name}
									</a>
								)}
							</For>
						</nav>
						<div class="flex items-center md:ml-12">
							<a
								href="#"
								class="text-base font-medium text-gray-500 hover:text-gray-900"
							>
								Sign in
							</a>
							<a
								href="#"
								class="ml-8 inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700"
							>
								Sign up
							</a>
						</div>
					</div>
				</div>
				<hr class="border-slate-200"></hr>
			</div>

			{/* <!--
    Mobile menu, show/hide based on mobile menu state.

    Entering: "duration-200 ease-out"
      From: "opacity-0 scale-95"
      To: "opacity-100 scale-100"
    Leaving: "duration-100 ease-in"
      From: "opacity-100 scale-100"
      To: "opacity-0 scale-95"
  --> */}
			<div class="absolute inset-x-0 top-0 z-30 origin-top-right transform p-2 transition md:hidden">
				<div class="divide-y-2 divide-gray-50 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5">
					<div class="px-5 pt-5 pb-6 sm:pb-8">
						<div class="flex items-center justify-between">
							<div>
								<img
									class="h-8 w-auto"
									src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=600"
									alt="Your Company"
								/>
							</div>
							<div class="-mr-2">
								<button
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
						<div class="grid grid-cols-2 gap-4">
							<a
								href="#"
								class="rounded-md text-base font-medium text-gray-900 hover:text-gray-700"
							>
								Pricing
							</a>
							<a
								href="#"
								class="rounded-md text-base font-medium text-gray-900 hover:text-gray-700"
							>
								Docs
							</a>
						</div>
						<div class="mt-6">
							<a
								href="#"
								class="flex w-full items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700"
							>
								Sign up
							</a>
							<p class="mt-6 text-center text-base font-medium text-gray-500">
								Existing customer?
								<a href="#" class="text-indigo-600 hover:text-indigo-500">
									Sign in
								</a>
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
