import { createSignal, For, Show } from "solid-js";
import IconClose from "~icons/material-symbols/close-rounded";
import IconMenu from "~icons/material-symbols/menu-rounded";
import IconTwitter from "~icons/cib/twitter";
import IconGithub from "~icons/cib/github";

export function Header() {
	const links = [
		{ name: "Docs", href: "/documentation" },
		{ name: "Editor", href: "/editor" },
	];

	const socialMediaLinks = [
		{
			name: "Twitter",
			href: "https://twitter.com/inlangHQ",
			Icon: IconTwitter,
		},
		{
			name: "Github",
			href: "https://github.com/inlang/inlang",
			Icon: IconGithub,
		},
	];

	const [mobileMenuIsOpen, setMobileMenuIsOpen] = createSignal(false);

	return (
		<header class="sticky z-40 top-0  border-b border-outline">
			<nav class="mx-auto max-w-screen-2xl">
				<div class=" flex gap-8 p-4 bg-background">
					<a href="/" class="flex items-center">
						<img
							class="h-8 w-auto "
							src="/favicon/favicon.ico"
							alt="Company Logo"
						/>
						<span class="self-center pl-2 text-xl font-bold">inlang</span>
					</a>
					<div class="z-10 p-2 grid grid-cols-2 w-full items-center">
						<div class="hidden md:flex justify-start space-x-6">
							<For each={links}>
								{(link) => (
									<a class="link-primary" href={link.href}>
										{link.name}
									</a>
								)}
							</For>
						</div>
						<div class="hidden md:flex justify-end space-x-6">
							<For each={socialMediaLinks}>
								{(link) => (
									<a
										class="link-primary flex space-x-2 items-center"
										href={link.href}
									>
										<link.Icon></link.Icon>
										<span>{link.name}</span>
									</a>
								)}
							</For>
						</div>
					</div>
					<div class="md:hidden z-50">
						<button
							onClick={() => setMobileMenuIsOpen(!mobileMenuIsOpen())}
							type="button"
							class="inline-flex items-center justify-center  bg-background p-2 text-primary "
						>
							<span class="sr-only">
								{mobileMenuIsOpen() ? "Close menu" : "Open menu"}
							</span>
							{mobileMenuIsOpen() ? (
								<IconClose class="w-6 h-6"></IconClose>
							) : (
								<IconMenu class="w-6 h-6"></IconMenu>
							)}
						</button>
					</div>
				</div>
				<Show when={mobileMenuIsOpen()}>
					<ol class="p-6 space-y-1 absolute shadow-md transition border-t border-outline w-screen bg-background ">
						<For each={links}>
							{(link) => (
								<li>
									<a class="link-primary" href={link.href}>
										{link.name}
									</a>
								</li>
							)}
						</For>
						<For each={socialMediaLinks}>
							{(link) => (
								<li>
									<a
										class="link-primary flex space-x-2 items-center"
										href={link.href}
									>
										<link.Icon></link.Icon>
										<span>{link.name}</span>
									</a>
								</li>
							)}
						</For>
					</ol>
				</Show>
			</nav>
		</header>
	);
}
