import { createSignal, For, JSXElement, Match, Show, Switch } from "solid-js"
import IconTwitter from "~icons/cib/twitter"
import IconGithub from "~icons/cib/github"
import IconClose from "~icons/material-symbols/close-rounded"
import IconSignOut from "~icons/material-symbols/logout-rounded"
import IconMenu from "~icons/material-symbols/menu-rounded"
import IconExpand from "~icons/material-symbols/expand-more-rounded"
import { useLocalStorage } from "@src/services/local-storage/index.js"
import { navigate } from "vite-plugin-ssr/client/router"
import { showToast } from "@src/components/Toast.jsx"
import { currentPageContext } from "@src/renderer/state.js"
import { onSignOut } from "@src/services/auth/index.js"
import { analytics } from "@src/services/analytics/index.js"
import { Button, buttonType } from "./index/components/Button.jsx"

/**
 * Ensure that all elements use the same margins.
 *
 * Why are the classes below not applied to the outer layout?
 *
 * The dividers of the Header and Footer would not span the
 * entire width of the screen.
 */
const layoutMargins = "max-w-screen-xl w-full mx-auto px-4 sm:px-8"

// command-f this repo to find where the layout is called
export function Layout(props: { children: JSXElement }) {
	return (
		<div class="flex flex-col min-h-screen">
			<Header />
			{/* the outer div is growing to occupy the entire height and thereby
			push the footer to the bottom */}
			<div class={"grow flex flex-col " + layoutMargins}>
				{/* the children are wrapped in a div to avoid flex and grow being applied to them from the outer div */}
				{props.children}
			</div>
			<Footer />
		</div>
	)
}

export const LandingPageLayout = (props: { children: JSXElement }) => {
	return (
		<div class="flex flex-col min-h-screen">
			<Header />
			{/* the outer div is growing to occupy the entire height and thereby
			push the footer to the bottom */}
			<div class={"grow flex flex-col "}>
				{/* the children are wrapped in a div to avoid flex and grow being applied to them from the outer div */}
				{props.children}
			</div>
			<Footer />
		</div>
	)
}

const socialMediaLinks = [
	{
		name: "Twitter",
		href: "https://twitter.com/inlangHQ",
		Icon: IconTwitter,
	},
	{
		name: "GitHub",
		href: "https://github.com/inlang/inlang",
		Icon: IconGithub,
	},
]
function Header() {
	const links = [
		{ name: "Blog", href: "/blog", type: "text" as buttonType },
		{ name: "Docs", href: "/documentation", type: "text" as buttonType },
	]

	const [localStorage] = useLocalStorage()
	const [mobileMenuIsOpen, setMobileMenuIsOpen] = createSignal(false)

	return (
		<header
			// bg-surface-1 is with fixed hex value to avoid transparency with dooms scrolling behaviour
			class="sticky top-0 z-50 w-full"
		>
			<div class="w-full h-full py-6 px-10">
				<nav class={layoutMargins}>
					<div class="flex">
						<a href="/" class="flex items-center w-fit">
							<img class="h-8 w-auto" src="/favicon/favicon.ico" alt="Company Logo" />
							<span class="self-center pl-2 text-left font-semibold text-surface-900">inlang</span>
						</a>
						<div class="w-full content-center">
							<div class="hidden md:flex justify-end items-center gap-8">
								<div class="flex gap-8">
									<For each={socialMediaLinks}>
										{(link) => (
											<a
												target="_blank"
												class="link link-primary flex space-x-2 items-center"
												href={link.href}
											>
												<link.Icon class="w-5 h-5" />
												{/* <span>{link.name}</span> */}
											</a>
										)}
									</For>
								</div>
								<For each={links}>
									{(link) => (
										<Button type={link.type} href={link.href}>
											{link.name}
										</Button>
									)}
								</For>
								<Show when={currentPageContext.urlParsed.pathname.includes("editor") === false}>
									<Button type="secondary" href="/editor">
										{" "}
										Open Editor{" "}
									</Button>
								</Show>
								{/* not overwhelming the user by only showing login button when not on landig page */}
								<Show
									when={
										localStorage.user || currentPageContext.urlParsed.pathname.includes("editor")
									}
								>
									<UserDropdown />
								</Show>
							</div>
						</div>
						{/* Controll the Dropdown/Navbar  if its open then Show MobileNavMenue */}
						<div class="md:hidden flex items-center">
							<button
								onClick={() => setMobileMenuIsOpen(!mobileMenuIsOpen())}
								type="button"
								class="inline-flex items-center justify-center text-primary "
							>
								<span class="sr-only">{mobileMenuIsOpen() ? "Close menu" : "Open menu"}</span>
								{mobileMenuIsOpen() ? <IconClose class="w-6 h-6" /> : <IconMenu class="w-6 h-6" />}
							</button>
						</div>
					</div>
					{/* MobileNavbar includes the Navigation for the Documentations sites  */}
					<Show when={mobileMenuIsOpen()}>
						<ol class="space-y-1 relativ w-screen min-h-full pt-3 overflow">
							<For each={links}>
								{(link) => (
									<sl-tree class="">
										<a
											class="link grow min-w-full text-on-surface link-primary w-full"
											href={link.href}
											onClick={() => setMobileMenuIsOpen(!mobileMenuIsOpen())}
										>
											<sl-tree-item>{link.name}</sl-tree-item>
										</a>
									</sl-tree>
								)}
							</For>
						</ol>
					</Show>
				</nav>
			</div>
		</header>
	)
}

function Footer() {
	return (
		<footer class="sticky z-40 w-full border-t border-outline bg-background py-1.5">
			<div class={`flex gap-8  ${layoutMargins}`}>
				{/* <a href="/legal.txt" class="link  link-primary font-light">
					<span class="">legal.txt</span>
				</a> */}
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
									<link.Icon />
									<span class="sr-only">{link.name}</span>
								</a>
							)}
						</For>
					</div>
				</div>
			</div>
		</footer>
	)
}

/**
 * Dropdown with user information and actions.
 */
function UserDropdown() {
	const [localStorage, setLocalStorage] = useLocalStorage()

	async function handleSignOut() {
		try {
			await onSignOut({ setLocalStorage })
			showToast({
				title: "Signed out",
				variant: "success",
			})
			// https://posthog.com/docs/integrate/client/js#reset-after-logout
			analytics.reset()
		} catch (error) {
			showToast({
				title: "Error",
				variant: "danger",
				// @ts-ignore
				message: error?.message,
			})
		}
	}

	return (
		<>
			<Switch>
				<Match when={localStorage.user}>
					<sl-dropdown>
						<div slot="trigger" class="flex items-center cursor-pointer">
							<img
								src={localStorage.user?.avatarUrl}
								alt="user avatar"
								class="w-6 h-6 rounded-full"
							/>
							<IconExpand />
						</div>
						<sl-menu>
							<div class="px-7 py-2 bg-surface-1 text-on-surface">
								<p>Signed in as</p>
								<p class="font-medium">{localStorage.user?.username}</p>
							</div>
							<sl-menu-item onClick={handleSignOut}>
								<IconSignOut slot="prefix" />
								Sign out
							</sl-menu-item>
						</sl-menu>
					</sl-dropdown>
				</Match>
			</Switch>
		</>
	)
}
