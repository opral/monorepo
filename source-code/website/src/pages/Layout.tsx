import { createSignal, For, JSXElement, Show } from "solid-js";
import IconTwitter from "~icons/cib/twitter";
import IconGithub from "~icons/cib/github";
import IconClose from "~icons/material-symbols/close-rounded";
import IconMenu from "~icons/material-symbols/menu-rounded";

/**
 * Ensure that all elements use the same margins.
 *
 * Why are the classes below not applied to the outer layout?
 *
 * The dividers of the Header and Footer would not span the
 * entire width of the screen.
 */
const layoutMargins = "max-w-screen-xl w-full mx-auto px-4";

// command-f this repo to find where the layout is called
export function Layout(props: { children: JSXElement }) {
	return (
		<div class="flex flex-col min-h-screen">
			<Header />
			<div class={`grow ${layoutMargins}`}>{props.children}</div>
			<Footer />
		</div>
	);
}

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
function Header() {
	const links = [
		{ name: "Docs", href: "/documentation" },
		{ name: "Editor", href: "/editor" },
	];

	const [mobileMenuIsOpen, setMobileMenuIsOpen] = createSignal(false);

	return (
		<header class="sticky top-0 z-50 w-full bg-background border-b border-outline-variant py-3">
			<nav class={layoutMargins}>
				<div class="flex gap-8">
					<a href="/" class="flex items-center">
						<img
							class="h-8 w-auto "
							src="/favicon/favicon.ico"
							alt="Company Logo"
						/>
						<span class="self-center pl-2 text-xl font-bold">inlang</span>
					</a>
					<div class="grid grid-cols-2 w-full content-center">
						<div class="hidden md:flex justify-start space-x-6">
							<For each={links}>
								{(link) => (
									<a class="link link-primary" href={link.href}>
										{link.name}
									</a>
								)}
							</For>
						</div>
						<div class="hidden md:flex justify-end space-x-6">
							<For each={socialMediaLinks}>
								{(link) => (
									<a
										target="_blank"
										class="link link-primary flex space-x-2 items-center"
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
							class="inline-flex items-center justify-center  bg-background  text-primary "
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
									<a class="link link-primary" href={link.href}>
										{link.name}
									</a>
								</li>
							)}
						</For>
						<For each={socialMediaLinks}>
							{(link) => (
								<li>
									<a
										class="link link-primary flex space-x-2 items-center"
										href={link.href}
										target="_blank"
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

function Footer() {
	return (
		<footer class="sticky z-40 w-full border-t border-outline-variant py-1">
			<div class={`flex gap-8 bg-background ${layoutMargins}`}>
				<a href="/legal.txt" class="link  link-primary font-light">
					<span class="">legal.txt</span>
				</a>
				<div class="flex  grow justify-end items-center  space-x-4 ">
					<a href="mailto:hello@inlang.com" class="link link-primary ">
						hello@inlang.com
					</a>
					<div class="hidden md:flex justify-end space-x-6">
						<For each={socialMediaLinks}>
							{(link) => (
								<a
									target="_blank"
									class="link link-primary flex space-x-2 items-center"
									href={link.href}
								>
									<link.Icon></link.Icon>
									<span class="sr-only">{link.name}</span>
								</a>
							)}
						</For>
					</div>
				</div>
			</div>
		</footer>
	);
}
