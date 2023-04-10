import { createSignal, For, JSXElement, Match, Show, Switch } from "solid-js"
import IconTwitter from "~icons/cib/twitter"
import IconGithub from "~icons/cib/github"
import IconDiscord from "~icons/cib/discord"
import IconClose from "~icons/material-symbols/close-rounded"
import IconSignOut from "~icons/material-symbols/logout-rounded"
import IconMenu from "~icons/material-symbols/menu-rounded"
import IconExpand from "~icons/material-symbols/expand-more-rounded"
import { useLocalStorage } from "@src/services/local-storage/index.js"
import { showToast } from "@src/components/Toast.jsx"
import { currentPageContext } from "@src/renderer/state.js"
import { onSignOut } from "@src/services/auth/index.js"
import { telemetryBrowser } from "@inlang/telemetry"
import { Button, buttonType } from "./index/components/Button.jsx"
import { SectionLayout } from "./index/components/sectionLayout.jsx"

/**
 * Ensure that all elements use the same margins.
 *
 * Why are the classes below not applied to the outer layout?
 *
 * The dividers of the Header and Footer would not span the
 * entire width of the screen.
 */
const layoutMargins = "max-w-screen-xl w-full mx-auto px-4 sm:px-10 "

// command-f this repo to find where the layout is called
export function Layout(props: { children: JSXElement }) {
	return (
		<div class="flex flex-col">
			<Header />
			{/* the outer div is growing to occupy the entire height and thereby
			push the footer to the bottom */}
			<div class={"grow flex flex-col min-h-screen " + layoutMargins}>
				{/* the children are wrapped in a div to avoid flex and grow being applied to them from the outer div */}
				{props.children}
			</div>
			<Footer isLandingPage={false} />
		</div>
	)
}

export const LandingPageLayout = (props: { children: JSXElement; landingpage?: boolean }) => {
	return (
		<div class="flex flex-col min-h-screen">
			<Header landingpage={props.landingpage} />
			{/* the outer div is growing to occupy the entire height and thereby
			push the footer to the bottom */}
			<div class={"grow flex flex-col "}>
				{/* the children are wrapped in a div to avoid flex and grow being applied to them from the outer div */}
				{props.children}
			</div>
			<Footer isLandingPage />
		</div>
	)
}

const socialMediaLinks = [
	{
		name: "Twitter",
		href: "https://twitter.com/inlangHQ",
		Icon: IconTwitter,
		screenreader: "Twitter Profile",
	},
	{
		name: "GitHub",
		href: "https://github.com/inlang/inlang",
		Icon: IconGithub,
		screenreader: "GitHub Repository",
	},
	{
		name: "Discord",
		href: "https://discord.gg/gdMPPWy57R",
		Icon: IconDiscord,
		screenreader: "Discord Server",
	},
]

function Header(props: { landingpage?: boolean }) {
	const links = [
		{ name: "Blog", href: "/blog", type: "text" as buttonType },
		{ name: "Docs", href: "/documentation/getting-started", type: "text" as buttonType },
		{
			name: "Feedback",
			external: currentPageContext.urlParsed.pathname.includes("editor"),
			href: "https://github.com/inlang/inlang/discussions/categories/feedback",
			type: "text" as buttonType,
		},
	]

	const [localStorage] = useLocalStorage()
	const [mobileMenuIsOpen, setMobileMenuIsOpen] = createSignal(false)

	return (
		<>
			<header
				// bg-surface-1 is with fixed hex value to avoid transparency with dooms scrolling behaviour
				class="sticky top-0 z-50 w-full bg-background border-b border-surface-400/10"
			>
				<div class={`w-full h-full py-4 px-4 sm:px-10 + ${props.landingpage && "px-10"}`}>
					<nav class={"max-w-screen-xl w-full mx-auto xl:px-10"}>
						<div class="flex">
							<a href="/" class="flex items-center w-fit">
								<img class="h-9 w-9" src="/favicon/safari-pinned-tab.svg" alt="Company Logo" />
								<span class="self-center pl-2 text-left font-semibold text-surface-900">
									inlang
								</span>
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
													<span class="sr-only">{link.name}</span>
												</a>
											)}
										</For>
									</div>
									<For each={links}>
										{(link) => (
											<Button type={link.type} href={link.href} chevron={Boolean(link.external)}>
												{link.name}
											</Button>
										)}
									</For>
									<Show when={currentPageContext.urlParsed.pathname.includes("editor") === false}>
										<Button type="secondary" href="/editor">
											Open Editor
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
									{mobileMenuIsOpen() ? (
										<IconClose class="w-6 h-6" />
									) : (
										<IconMenu class="w-6 h-6" />
									)}
								</button>
							</div>
						</div>
						{/* MobileNavbar includes the Navigation for the Documentations sites  */}
						<Show when={mobileMenuIsOpen()}>
							<ol class="space-y-1 relativ w-full min-h-full pt-3 overflow">
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
		</>
	)
}

const Footer = (props: { isLandingPage: boolean }) => {
	return (
		<footer class="border-t border-surface-100">
			<SectionLayout showLines={props.isLandingPage} type="lightGrey">
				<div class="flex flex-row flex-wrap-reverse py-16 px-10 xl:px-0 gap-10 md:gap-x-0 md:gap-y-10 xl:gap-0">
					<div class="w-full md:w-1/3 xl:w-1/4 xl:px-10 flex flex-row items-center md:items-start md:flex-col justify-between">
						<a href="/" class="flex items-center w-fit">
							<img class="h-9 w-9" src="/favicon/safari-pinned-tab.svg" alt="Company Logo" />
							<span class="self-center pl-2 text-left font-semibold text-surface-900">inlang</span>
						</a>
						<p class="text-surface-700 font-medium">© inlang 2023</p>
					</div>
					<div class="w-full md:w-1/3 xl:w-1/4 xl:px-10 flex flex-col gap-2 md:gap-4 pt-2">
						<p class="font-semibold text-surface-900">Docs</p>
						<a
							href="https://inlang.com/documentation/getting-started"
							class="font-medium text-surface-500 hover:text-primary"
						>
							Getting Started
						</a>

						<a
							href="https://inlang.com/documentation/why-inlang"
							class="font-medium text-surface-500 hover:text-primary"
						>
							Why Inlang
						</a>
						<a
							href="https://inlang.com/documentation/contributing"
							class="font-medium text-surface-500 hover:text-primary"
						>
							Contribute
						</a>
					</div>
					<div class="w-full md:w-1/3 xl:w-1/4 xl:px-10 flex flex-col gap-2 md:gap-4 pt-2">
						<p class="font-semibold text-surface-900">Resources</p>
						<a
							href="https://inlang.com/blog"
							class="font-medium text-surface-500 hover:text-primary"
						>
							Blog
						</a>
						<a
							href="https://github.com/inlang/inlang"
							class="font-medium text-surface-500 hover:text-primary"
						>
							GitHub
						</a>
						<a
							href="https://twitter.com/inlangHQ"
							class="font-medium text-surface-500 hover:text-primary"
						>
							Twitter
						</a>
						<a
							href="https://discord.gg/gdMPPWy57R"
							class="font-medium text-surface-500 hover:text-primary"
						>
							Discord
						</a>
						<a
							href="https://inlang.notion.site/Careers-82277169d07a4d30b9c9b5a625a6a0ef"
							class="font-medium text-surface-500 hover:text-primary"
						>
							Join the Team
						</a>
					</div>
					<div class="hidden invisible xl:visible xl:w-1/4 xl:px-10 xl:flex flex-col gap-2 md:gap-4 pt-2">
						<p class="font-semibold text-surface-900">Let's talk</p>
						<a href="mailto:hello@inlang.com">
							<button class="h-10 text-sm text-background px-4 bg-surface-700 w-full rounded-md">
								Get in Touch
							</button>
						</a>
					</div>
					<div class="flex visible xl:invisible w-full xl:w-1/4 px-10 bg-surface-100 border border-surface-200 xl:hidden flex-col gap-6 py-10 rounded">
						<p class="text-lg text-surface-800 font-semibold">Let's talk</p>
						<p class="text-surface-600">
							We welcome your input, feedback, and ideas! If you would like to get in touch with us,
							please don't hesitate to send us an email.
						</p>
						<a href="mailto:hello@inlang.com">
							<button class="h-10 text-sm text-background px-4 bg-surface-700 w-full rounded-md">
								Get in Touch
							</button>
						</a>
					</div>
				</div>
			</SectionLayout>
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
			telemetryBrowser.reset()
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
