import { createSignal, For, type JSXElement, Match, onMount, Show, Switch } from "solid-js"
import IconTwitter from "~icons/cib/twitter"
import IconGithub from "~icons/cib/github"
import IconDiscord from "~icons/cib/discord"
import IconClose from "~icons/material-symbols/close-rounded"
import IconSignOut from "~icons/material-symbols/logout-rounded"
import IconMenu from "~icons/material-symbols/menu-rounded"
import IconExpand from "~icons/material-symbols/expand-more-rounded"
import { useLocalStorage } from "#src/services/local-storage/index.js"
import { showToast } from "#src/components/Toast.jsx"
import { currentPageContext } from "#src/renderer/state.js"
import { onSignOut } from "#src/services/auth/index.js"
import { telemetryBrowser } from "@inlang/telemetry"
import { Button, type buttonType } from "./index/components/Button.jsx"
import { SectionLayout } from "./index/components/sectionLayout.jsx"
import { defaultLanguage, extractLocale } from "#src/renderer/_default.page.route.js"
import { useI18n } from "@solid-primitives/i18n"
import { NewsletterForm } from "#src/components/NewsletterForm.jsx"

/**
 * Ensure that all elements use the same margins.
 *
 * Why are the classes below not applied to the outer layout?
 *
 * The dividers of the Header and Footer would not span the
 * entire width of the screen.
 */
const layoutMargins = "max-w-screen-xl w-full mx-auto px-4"

// command-f this repo to find where the layout is called
export function Layout(props: { children: JSXElement }) {
	return (
		<div class="relative flex flex-col">
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

export const LandingPageLayout = (props: {
	children: JSXElement
	landingpage?: boolean
	darkmode?: boolean
	transparent?: boolean
}) => {
	return (
		<div class="flex flex-col min-h-screen">
			<Header
				landingpage={props.landingpage}
				darkmode={props.darkmode}
				transparent={props.transparent}
			/>
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
		href: "https://github.com/inlang/monorepo",
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

function Header(props: { landingpage?: boolean; darkmode?: boolean; transparent?: boolean }) {
	const getMarketplaceLinks = () => {
		return [
			{
				name: `Application`,
				href: "/application",
				type: props.darkmode ? "textBackground" : ("text" as buttonType),
			},
			{
				name: `Website`,
				href: "/website",
				type: props.darkmode ? "textBackground" : ("text" as buttonType),
			},
			{
				name: `Markdown`,
				href: "/markdown",
				type: props.darkmode ? "textBackground" : ("text" as buttonType),
			},
			{
				name: `Missing something?`,
				href: "https://github.com/inlang/monorepo/discussions",
				type: props.darkmode ? "textBackground" : ("text" as buttonType),
			},
		]
	}

	const getLinks = () => {
		return [
			{
				name: `Developers`,
				href: "/documentation",
				type: props.darkmode ? "textBackground" : ("text" as buttonType),
			},
		]
	}

	const [mobileMenuIsOpen, setMobileMenuIsOpen] = createSignal(false)
	const [t, { locale }] = useI18n()

	const getLocale = () => {
		const language = locale() || defaultLanguage
		return language !== defaultLanguage ? "/" + language : ""
	}
	return (
		<>
			<Show
				when={!currentPageContext.urlParsed.pathname.includes("editor")}
				fallback={<EditorHeader />}
			>
				<header class="sticky top-0 w-full z-[100]">
					<div
						class={
							"z-[80] w-full border-b transition-colors h-[76px] " +
							(!props.transparent && props.darkmode
								? " bg-surface-900 border-b-surface-800"
								: !props.transparent && !props.darkmode
								? "bg-background border-surface-2"
								: "" + props.transparent && props.darkmode
								? "bg-transparent border-b-surface-900 bg-surface-900"
								: "bg-transparent border-b-background bg-background")
						}
					>
						<Show when={props.transparent}>
							<div class="absolute left-1/2 -translate-x-1/2 h-full max-w-screen-xl w-full mx-auto">
								<div class="invisible xl:visible absolute top-0 left-0 h-full w-full z-0 ">
									<div class="flex w-full h-full justify-between mx-auto">
										<div class="h-full w-[2px] bg-surface-400 opacity-[7%]" />
										<div class="h-full w-[2px] bg-surface-400 opacity-[7%]" />
										<div class="h-full w-[2px] bg-surface-400 opacity-[7%]" />
										<div class="h-full w-[2px] bg-surface-400 opacity-[7%]" />
										<div class="h-full w-[2px] bg-surface-400 opacity-[7%]" />
									</div>
								</div>
							</div>
						</Show>
						<div class={`w-full h-full relative z-10`}>
							<nav class={"md:p-0 max-w-[1248px] w-full flex justify-center mx-auto h-full"}>
								{/* <div class="md:py-4 md:px-4 max-lg:hidden">
									<MarketplaceBar
										links={getMarketplaceLinks()}
										type={props.darkmode ? "dark" : "light"}
									/>
								</div> */}

								<Show when={mobileMenuIsOpen()}>
									<ol class="pl-8 pb-8 space-y-3 relativ w-full pt-24 overflow text-surface-100 bg-background border border-surface-200 h-[480px]">
										<For each={[getMarketplaceLinks(), getLinks()].flat()}>
											{(link) => (
												<>
													<Show when={link.name === "Developers"}>
														<div class="py-4">
															<div class="w-24 h-[1px] bg-surface-200 ml-8" />
														</div>
													</Show>
													<sl-tree>
														<a
															class={
																(props.darkmode ? "text-surface-100" : "text-on-surface") +
																" grow min-w-full w-full"
															}
															href={link.href}
															onClick={() => setMobileMenuIsOpen(!mobileMenuIsOpen())}
														>
															<sl-tree-item>{link.name}</sl-tree-item>
														</a>
													</sl-tree>
												</>
											)}
										</For>
									</ol>
								</Show>
							</nav>
						</div>
					</div>
					<div class="pl-6 lg:pl-4 xl:pl-0 absolute z-[90] top-0 h-[72px] left-0 w-full text-surface-200 pointer-events-none">
						<div class="max-w-[1248px] w-full mx-auto">
							<a
								href={getLocale() + "/"}
								class="flex items-center w-fit pt-[18px] pointer-events-auto"
							>
								<img
									class={
										"h-9 w-9 " + (!mobileMenuIsOpen() && props.darkmode ? "filter invert" : "")
									}
									src="/favicon/safari-pinned-tab.svg"
									alt="Company Logo"
								/>
								<span
									class={
										"self-center pl-2 text-left font-semibold " +
										(!mobileMenuIsOpen() && props.darkmode ? "text-background" : "text-surface-900")
									}
								>
									inlang
								</span>
							</a>
						</div>
					</div>
					<div class="absolute pr-4 xl:pr-0 z-[90] top-0 h-[72px] left-0 w-full text-surface-200 pointer-events-none">
						<div class="max-w-[1248px] w-full mx-auto justify-end hidden lg:flex gap-8 items-center pt-[18px]">
							<For each={getLinks()}>
								{(link) => (
									<>
										<Button type={link.type} href={link.href}>
											{link.name}
										</Button>
									</>
								)}
							</For>
							<Show
								when={
									currentPageContext.urlParsed.pathname.includes("editor") === false &&
									currentPageContext.urlParsed.pathname.includes("documentation") === false &&
									currentPageContext.urlParsed.pathname.includes("blog") === false
								}
							>
								<LanguagePicker darkmode={props.darkmode} />
							</Show>
							<Show when={currentPageContext.urlParsed.pathname.includes("editor") === false}>
								<Button type={props.darkmode ? "primary" : "secondary"} href="/editor">
									{t("header.openEditor")}
								</Button>
							</Show>
						</div>
						<div class="lg:hidden flex items-center justify-end h-[76px] pr-4">
							<button
								onClick={() => setMobileMenuIsOpen(!mobileMenuIsOpen())}
								type="button"
								class="inline-flex items-center justify-center text-primary pointer-events-auto"
							>
								<span class="sr-only">{mobileMenuIsOpen() ? "Close menu" : "Open menu"}</span>
								{mobileMenuIsOpen() ? <IconClose class="w-6 h-6" /> : <IconMenu class="w-6 h-6" />}
							</button>
						</div>
					</div>
				</header>
			</Show>
		</>
	)
}

function EditorHeader() {
	const getLinks = () => {
		return [
			{
				name: `Editor Projects`,
				href: "/editor",
			},
			{
				name: `Apps`,
				href: "/application",
			},
		]
	}
	const [, { locale }] = useI18n()
	const getLocale = () => {
		const language = locale() || defaultLanguage
		return language !== defaultLanguage ? "/" + language : ""
	}
	const [mobileMenuIsOpen, setMobileMenuIsOpen] = createSignal(false)
	return (
		<>
			<header class="sticky top-0 z-[9999] w-full border-b transition-colors bg-transparent border-b-background bg-background">
				<div class="`w-full h-full py-4 px-6 md:px-4 relative z-10">
					<nav class="max-w-[1248px] w-full mx-auto">
						<div class="flex">
							<a href={getLocale() + "/"} class="flex items-center w-fit">
								<img class={"h-9 w-9"} src="/favicon/safari-pinned-tab.svg" alt="Company Logo" />
								<span class={"self-center pl-2 text-left font-semibold text-surface-900"}>
									inlang
								</span>
							</a>
							<div class="w-full content-center">
								<div class="hidden md:flex justify-end items-center gap-8">
									<For each={getLinks()}>
										{(link) => (
											<>
												<Button type="text" href={link.href}>
													{link.name}
												</Button>
											</>
										)}
									</For>
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
							<ol class="space-y-1 relativ w-full min-h-full pt-3 pl-[10px] overflow">
								<For each={getLinks()}>
									{(link) => (
										<sl-tree>
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

const productsLinks = [
	{
		name: `Global Document`,
		href: "/document",
		type: "text" as buttonType,
	},
	{
		name: `Global Application`,
		href: "/application",
		type: "text" as buttonType,
	},
	{
		name: `Global Email`,
		href: "/email",
		type: "text" as buttonType,
	},
	{
		name: `Global Payment`,
		href: "/payment",
		type: "text" as buttonType,
	},
	{
		name: `Global Website`,
		href: "/website",
		type: "text" as buttonType,
	},
]

const Footer = (props: { isLandingPage: boolean }) => {
	const [t] = useI18n()

	const getProductsLinks = () => {
		return [...productsLinks]
	}

	// const getDocLinks = () => {
	// 	return [
	// 		{
	// 			name: `${t("footer.docs.gettingStarted")}`,
	// 			href: "/documentation/quick-start",
	// 			type: "text" as buttonType,
	// 		},
	// 		{ name: `${t("footer.docs.whyInlang")}`, href: "/documentation", type: "text" as buttonType },
	// 		{
	// 			name: `${t("footer.docs.contribute")}`,
	// 			href: "/documentation/contributing",
	// 			type: "text" as buttonType,
	// 		},
	// 	]
	// }
	const getResourceLinks = () => {
		return [
			{
				name: `${t("footer.resources.marketplace")}`,
				href: "/marketplace",
				type: "text" as buttonType,
			},
			{
				name: `${t("footer.resources.roadmap")}`,
				href: "https://github.com/orgs/inlang/projects?query=is%3Aopen",
				type: "text" as buttonType,
			},
			{
				name: `Developers`,
				href: "/documentation",
				type: "text" as buttonType,
			},
		]
	}
	const getContactLinks = () => {
		return [
			{
				name: `${t("footer.contact.getInTouch")}`,
				href: "mailto:hello@inlang.com",
				type: "text" as buttonType,
			},
			{
				name: `${t("footer.contact.join")}`,
				href: "https://github.com/inlang/monorepo/tree/main/careers",
				type: "text" as buttonType,
			},
			{
				name: `${t("footer.contact.feedback")}`,
				href: "https://github.com/inlang/monorepo/discussions/categories/feedback",
				type: "text" as buttonType,
			},
			{ name: `${t("footer.contact.blog")}`, href: "/blog", type: "text" as buttonType },
		]
	}

	return (
		<footer class="border-t border-surface-100 overflow-hidden">
			<SectionLayout showLines={props.isLandingPage} type="lightGrey">
				<div class="flex flex-row flex-wrap-reverse py-16 px-6 md:px-4 xl:px-0 gap-10 sm:gap-x-0 md:gap-y-10 xl:gap-0">
					<div class="w-full md:w-1/4 xl:px-4 flex flex-row items-center sm:items-start md:flex-col gap-10 md:justify-start justify-between flex-wrap">
						<div>
							<a href="/" class="flex items-center w-fit mb-6">
								<img class="h-9 w-9" src="/favicon/safari-pinned-tab.svg" alt="Company Logo" />
								<span class="self-center pl-2 text-left font-semibold text-surface-900">
									inlang
								</span>
							</a>
							<p class="text-surface-600 text-sm">The ecosystem to go global</p>
						</div>
						<div class="flex gap-4">
							<For each={socialMediaLinks}>
								{(link) => (
									<a
										target="_blank"
										class={"link link-primary flex space-x-2 items-center"}
										href={link.href}
									>
										<link.Icon class="w-5 h-5" />
										<span class="sr-only">{link.name}</span>
									</a>
								)}
							</For>
						</div>
					</div>
					<div class="w-full sm:w-1/3 md:w-1/4 xl:px-4 flex flex-col pt-2">
						<p class="font-semibold text-surface-900 pb-3">{t("footer.resources.title")}</p>
						<For each={getResourceLinks()}>
							{(link) => (
								<div class="w-fit opacity-80">
									<Button type={link.type} href={link.href}>
										{link.name}
									</Button>
								</div>
							)}
						</For>
					</div>
					<div class="w-full sm:w-1/3 md:w-1/4 xl:px-4 flex flex-col pt-2">
						<p class="font-semibold text-surface-900 pb-3">Products</p>
						<For each={getProductsLinks()}>
							{(link) => (
								<div class="w-fit opacity-80">
									<Button type={link.type} href={link.href}>
										{link.name}
									</Button>
								</div>
							)}
						</For>
					</div>
					<div class="w-full sm:w-1/3 md:w-1/4 xl:px-4 xl:flex flex-col pt-2">
						<p class="font-semibold text-surface-900 pb-3">{t("footer.contact.title")}</p>
						<For each={getContactLinks()}>
							{(link) => (
								<div class="w-fit opacity-80">
									<Button type={link.type} href={link.href}>
										{link.name}
									</Button>
								</div>
							)}
						</For>
					</div>
				</div>
				<div class="px-6 md:px-4 xl:px-0 flex flex-col xl:flex-row justify-between items-end gap-8 pb-16">
					<div class="xl:px-4 xl:flex flex-col gap-2 md:gap-4 pt-2 max-xl:w-full">
						<NewsletterForm />
					</div>
					<div class="xl:w-1/4 xl:px-4 flex items-center justify-between pt-2 max-xl:w-full">
						<p class="text-surface-700 font-medium w-fit">© inlang 2023</p>
						<LanguagePicker />
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
							<div class="w-5 h-5 opacity-50">
								<IconExpand />
							</div>
						</div>
						<sl-menu>
							<div class="px-7 py-2 bg-surface-1 text-on-surface">
								<p>Signed in as</p>
								<p class="font-medium">{localStorage.user?.username}</p>
							</div>
							<sl-menu-item onClick={handleSignOut}>
								<IconSignOut
									// @ts-ignore
									slot="prefix"
								/>
								Sign out
							</sl-menu-item>
						</sl-menu>
					</sl-dropdown>
				</Match>
			</Switch>
		</>
	)
}

/**
 * Language picker for the landing page.
 */
function LanguagePicker(props: { darkmode?: boolean }) {
	const [localeIsLoaded, setLocaleIsLoaded] = createSignal(false)
	const [, { locale }] = useI18n()

	onMount(() => {
		setLocaleIsLoaded(true)
	})

	const languages = [
		{
			code: "en",
			name: "English",
		},
		{
			code: "de",
			name: "Deutsch",
		},
		{
			code: "zh",
			name: "中文",
		},
		{
			code: "sk",
			name: "Slovak",
		},
		{
			code: "pt_BR",
			name: "Portuguese Brazil",
		},
	]

	const handleSwitchTranslation = (language: { code: string; name: string }) => {
		window.history.pushState(
			{},
			"",
			(language.code !== defaultLanguage ? "/" + language.code : "") +
				extractLocale(currentPageContext.urlParsed.pathname).urlWithoutLocale
		)
		locale(language.code)
	}

	return (
		<div class="w-fit">
			<Show when={localeIsLoaded()}>
				<sl-dropdown>
					<div
						slot="trigger"
						class={
							"cursor-pointer h-10 flex items-center font-medium text-sm " +
							(props.darkmode
								? "text-background hover:text-surface-300"
								: "text-surface-700 hover:text-primary")
						}
					>
						<p>{locale().toUpperCase()}</p>
						<IconExpand class="w-5 h-5 opacity-50" />
					</div>
					<sl-menu>
						<For each={languages}>
							{(language) => (
								<sl-menu-item
									prop:type="checkbox"
									// @ts-ignore
									checked={locale() === language.code}
									onClick={() => handleSwitchTranslation(language)}
								>
									{language.name}
									<p class="opacity-50" slot="suffix">
										{language.code}
									</p>
								</sl-menu-item>
							)}
						</For>
					</sl-menu>
				</sl-dropdown>
			</Show>
		</div>
	)
}

/**
 * Language picker for the landing page.
 */
// function ProductDropdown(props: { darkmode?: boolean }) {
// 	const languages = [
// 		{
// 			code: "en",
// 			name: "English",
// 		},
// 		{
// 			code: "de",
// 			name: "Deutsch",
// 		},
// 		{
// 			code: "zh",
// 			name: "中文",
// 		},
// 		{
// 			code: "sk",
// 			name: "Slovak",
// 		},
// 		{
// 			code: "pt_BR",
// 			name: "Portuguese Brazil",
// 		},
// 	]

// 	return (
// 		<div class="w-fit">
// 			<sl-dropdown>
// 				<div
// 					slot="trigger"
// 					class={
// 						"cursor-pointer h-10 flex items-center font-medium text-sm " +
// 						(props.darkmode
// 							? "text-background hover:text-surface-300"
// 							: "text-surface-700 hover:text-primary")
// 					}
// 				>
// 					<p>Products</p>
// 					<IconExpand class="w-5 h-5 opacity-50" />
// 				</div>
// 				<sl-menu>
// 					<For each={productsLinks}>
// 						{(product) => (
// 							<sl-menu-item>
// 								<a class="w-full block" href={product.href}>
// 									{product.name.replace("Global ", "")}
// 								</a>
// 							</sl-menu-item>
// 						)}
// 					</For>
// 				</sl-menu>
// 			</sl-dropdown>
// 		</div>
// 	)
// }
