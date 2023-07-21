import { createSignal, For, JSXElement, Match, onMount, Show, Switch } from "solid-js"
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
import { rpc } from "@inlang/rpc"
import { defaultLanguage, extractLocale } from "@src/renderer/_default.page.route.js"
import { useI18n } from "@solid-primitives/i18n"

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
	const getLinks = () => {
		return [
			{ name: `${t("header.link.blog")}`, href: "/blog", type: "text" as buttonType },
			{ name: `${t("header.link.docs")}`, href: "/documentation", type: "text" as buttonType },
			{
				name: `${t("header.link.feedback")}`,
				href: "https://github.com/inlang/inlang/discussions",
				type: "text" as buttonType,
			},
		]
	}

	const [localStorage] = useLocalStorage()
	const [mobileMenuIsOpen, setMobileMenuIsOpen] = createSignal(false)
	const [t, { locale }] = useI18n()

	const getLocale = () => {
		const language = locale() || defaultLanguage
		return language !== defaultLanguage ? "/" + language : ""
	}

	return (
		<>
			<header
				// bg-surface-1 is with fixed hex value to avoid transparency with dooms scrolling behaviour
				class="sticky top-0 z-[9999] w-full bg-background border-b border-surface-2"
			>
				<div class={`w-full h-full py-4 px-4 sm:px-10 ${props.landingpage && "px-10"}`}>
					<nav class={"max-w-screen-xl w-full mx-auto xl:px-10"}>
						<div class="flex">
							<a href={getLocale() + "/"} class="flex items-center w-fit">
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
									<For each={getLinks()}>
										{(link) => (
											<Button type={link.type} href={link.href}>
												{link.name}
											</Button>
										)}
									</For>
									<Show
										when={
											currentPageContext.urlParsed.pathname.includes("editor") === false &&
											currentPageContext.urlParsed.pathname.includes("documentation") === false &&
											currentPageContext.urlParsed.pathname.includes("blog") === false
										}
									>
										<LanguagePicker />
									</Show>
									<Show when={currentPageContext.urlParsed.pathname.includes("editor") === false}>
										<Button type="secondary" href="/editor">
											{t("header.openEditor")}
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

const Footer = (props: { isLandingPage: boolean }) => {
	const [t] = useI18n()

	const getDocLinks = () => {
		return [
			{
				name: `${t("footer.docs.gettingStarted")}`,
				href: "/documentation/quick-start",
				type: "text" as buttonType,
			},
			{ name: `${t("footer.docs.whyInlang")}`, href: "/documentation", type: "text" as buttonType },
			{
				name: `${t("footer.docs.contribute")}`,
				href: "/documentation/contributing",
				type: "text" as buttonType,
			},
		]
	}
	const getResourceLinks = () => {
		return [
			{ name: `${t("footer.resources.blog")}`, href: "/blog", type: "text" as buttonType },
			{
				name: `${t("footer.resources.roadmap")}`,
				href: "https://github.com/orgs/inlang/projects?query=is%3Aopen",
				type: "text" as buttonType,
			},
			{
				name: `${t("footer.resources.github")}`,
				href: "https://github.com/inlang/inlang",
				type: "text" as buttonType,
			},
			{
				name: `${t("footer.resources.twitter")}`,
				href: "https://twitter.com/inlangHQ",
				type: "text" as buttonType,
			},
			{
				name: `${t("footer.resources.discord")}`,
				href: "https://discord.gg/gdMPPWy57R",
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
				href: "https://inlang.notion.site/Careers-82277169d07a4d30b9c9b5a625a6a0ef",
				type: "text" as buttonType,
			},
			{
				name: `${t("footer.contact.feedback")}`,
				href: "https://github.com/inlang/inlang/discussions/categories/feedback",
				type: "text" as buttonType,
			},
		]
	}

	return (
		<footer class="border-t border-surface-100 overflow-hidden">
			<SectionLayout showLines={props.isLandingPage} type="lightGrey">
				<div class="flex flex-row flex-wrap-reverse py-16 px-6 md:px-10 xl:px-0 gap-10 md:gap-x-0 md:gap-y-10 xl:gap-0">
					<div class="w-full md:w-1/3 xl:w-1/4 xl:px-10 flex flex-row items-center md:items-start md:flex-col justify-between">
						<a href="/" class="flex items-center w-fit">
							<img class="h-9 w-9" src="/favicon/safari-pinned-tab.svg" alt="Company Logo" />
							<span class="self-center pl-2 text-left font-semibold text-surface-900">inlang</span>
						</a>
					</div>
					<div class="w-full md:w-1/3 xl:w-1/4 xl:px-10 flex flex-col pt-2">
						<p class="font-semibold text-surface-900 pb-3">{t("footer.docs.title")}</p>
						<For each={getDocLinks()}>
							{(link) => (
								<div class="w-fit opacity-80">
									<Button type={link.type} href={link.href}>
										{link.name}
									</Button>
								</div>
							)}
						</For>
					</div>
					<div class="w-full md:w-1/3 xl:w-1/4 xl:px-10 flex flex-col pt-2">
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
					<div class="hidden invisible xl:visible xl:w-1/4 xl:px-10 xl:flex flex-col pt-2">
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
					<div class="flex visible xl:invisible w-full xl:w-1/4 px-10 bg-surface-100 border border-surface-200 xl:hidden flex-col gap-6 py-10 rounded">
						<p class="text-lg text-surface-800 font-semibold">Let's talk</p>
						<p class="text-surface-600">
							We welcome your input, feedback, and ideas! If you would like to get in touch with us,
							please don't hesitate to send us an email.
						</p>
						<a href="mailto:hello@inlang.com">
							<button class="h-10 text-sm text-background px-4 bg-surface-700 w-full rounded-md font-medium">
								Get in Touch
							</button>
						</a>
					</div>
				</div>
				<div class="px-6 xl:px-0 flex flex-col xl:flex-row justify-between items-end gap-8 pb-16">
					<div class="xl:px-10 xl:flex flex-col gap-2 md:gap-4 pt-2 max-xl:w-full">
						<Newsletter />
					</div>
					<div class="xl:w-1/4 xl:px-10 flex items-center justify-between pt-2 max-xl:w-full">
						<p class="text-surface-700 font-medium w-fit">© inlang 2023</p>
						<LanguagePicker />
					</div>
				</div>
			</SectionLayout>
		</footer>
	)
}

const Newsletter = () => {
	const [email, setEmail] = createSignal("")
	const [loading, setLoading] = createSignal(false)
	const [t] = useI18n()

	const fetchSubscriber = async (email: any) => {
		setLoading(true)
		const [response] = await rpc.subscribeNewsletter({ email })
		if (response === "already subscribed") {
			showToast({
				title: "Error",
				variant: "danger",
				message: `${t("footer.newsletter.error.alreadySubscribed")}`,
			})
		} else if (response === "success") {
			showToast({
				title: "Success",
				variant: "success",
				message: `${t("footer.newsletter.success")}`,
			})
		} else {
			showToast({
				title: "Error",
				variant: "danger",
				message: `${t("footer.newsletter.error.generic")}`,
			})
		}

		setLoading(false)
		setEmail("")
	}

	function handleSubscribe() {
		if (loading()) return

		function checkEmail(email: any) {
			const re = /\S+@\S+\.\S+/

			if (email.trim() === "") {
				return "empty"
			} else if (!re.test(email)) {
				return "invalid"
			} else {
				return "valid"
			}
		}

		const emailValue = email()
		if (checkEmail(emailValue) === "empty") {
			showToast({
				title: "Error",
				variant: "danger",
				message: `${t("footer.newsletter.error.emptyEmail")}`,
			})
			return
		} else if (checkEmail(emailValue) === "invalid") {
			showToast({
				title: "Error",
				variant: "danger",
				message: `${t("footer.newsletter.error.invalidEmail")}`,
			})
			return
		}

		fetchSubscriber(emailValue)
	}

	return (
		<div class="flex flex-col items-start justify-center w-full mr-10 max-xl:mb-8">
			<p class="text-surface-800 font-semibold mb-3">{t("footer.newsletter.title")}</p>
			<div
				class={
					"flex items-start justify-stretch gap-3 w-full md:flex-row flex-col transition-opacity duration-150 " +
					(loading() ? "opacity-70 cursor-not-allowed" : "")
				}
			>
				<sl-input
					class={"border-none p-0 md:w-[312px] w-full " + (loading() ? "pointer-events-none" : "")}
					prop:size={"medium"}
					prop:placeholder={t("footer.newsletter.placeholder")}
					// @ts-ignore
					value={email()}
					onInput={(event) => {
						// @ts-ignore
						setEmail(event.target.value)
					}}
					onPaste={(event) => {
						// @ts-ignore
						setEmail(event.target.value)
					}}
					// on enter press
					onKeyDown={(event) => {
						if (event.key === "Enter") {
							handleSubscribe()
						}
					}}
				/>
				<button
					class={
						"h-10 text-sm text-background px-4 bg-surface-700 hover:bg-surface-800 max-md:w-full rounded-md font-medium transition-all duration-200 " +
						(loading() ? "pointer-events-none" : "")
					}
					onClick={handleSubscribe}
				>
					{t("footer.newsletter.button")}
				</button>
			</div>
		</div>
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
function LanguagePicker() {
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
	]

	const handleSwitchTransltion = (language: { code: string; name: string }) => {
		console.log("path", currentPageContext.urlParsed.pathname)
		window.history.pushState(
			{},
			"",
			(language.code !== defaultLanguage ? "/" + language.code : "") +
				extractLocale(currentPageContext.urlParsed.pathname).urlWithoutLocale,
		)
		locale(language.code)
	}

	return (
		<div class="w-fit">
			<Show when={localeIsLoaded()}>
				<sl-dropdown>
					<div
						slot="trigger"
						class="cursor-pointer h-10 flex items-center text-surface-700 font-medium link-primary text-sm"
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
									onClick={() => handleSwitchTransltion(language)}
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
