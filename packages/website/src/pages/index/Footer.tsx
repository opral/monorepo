import { NewsletterForm } from "#src/interface/components/NewsletterForm.jsx"
import { For } from "solid-js"
import { Button } from "./components/Button.jsx"
import IconTwitter from "~icons/cib/twitter"
import IconGithub from "~icons/cib/github"
import IconDiscord from "~icons/cib/discord"

const productsLinks = [
	{
		name: `Global Application`,
		href: "/c/application",
	},
	{
		name: `Global Website`,
		href: "/c/website",
	},
	{
		name: `Global Markdown`,
		href: "/c/markdown",
	},
	{
		name: `Lint Rules`,
		href: "/c/lint-rules",
	},
]

const Footer = () => {
	const getProductsLinks = () => {
		return [...productsLinks]
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

	const getResourceLinks = () => {
		return [
			{
				name: `Roadmap`,
				href: "https://github.com/orgs/inlang/projects?query=is%3Aopen",
			},
			{
				name: `Developer Docs`,
				href: "/documentation",
			},
		]
	}
	const getContactLinks = () => {
		return [
			{
				name: `Get in Touch`,
				href: "mailto:hello@inlang.com",
			},
			{
				name: `Contact`,
				href: "https://github.com/inlang/monorepo/tree/main/careers",
			},
			{
				name: `Feedback`,
				href: "https://github.com/inlang/monorepo/discussions/categories/feedback",
			},
			{ name: `Blog`, href: "/blog" },
		]
	}

	return (
		<footer class="overflow-hidden max-w-7xl mx-auto">
			<div class="flex flex-row flex-wrap-reverse py-16 max-w-7xl mx-auto px-4 xl:px-0 gap-10 sm:gap-x-0 md:gap-y-10 xl:gap-0">
				<div class="w-full md:w-1/4 xl:px-4 flex flex-row items-center sm:items-start md:flex-col gap-10 md:justify-start justify-between flex-wrap">
					<div>
						<a href="/" class="flex items-center w-fit mb-6">
							<img class="h-9 w-9" src="/favicon/safari-pinned-tab.svg" alt="Company Logo" />
							<span class="self-center pl-2 text-left font-semibold text-surface-900">inlang</span>
						</a>
						<p class="text-surface-600 text-sm">The ecosystem to go global</p>
					</div>
					<div class="flex gap-7 flex-wrap">
						<For each={socialMediaLinks}>
							{(link) => (
								<a
									target="_blank"
									class={"link link-primary flex space-x-2 items-center text-xs"}
									href={link.href}
								>
									{link.name}
								</a>
							)}
						</For>
					</div>
				</div>
				<div class="w-full sm:w-1/3 md:w-1/4 xl:px-4 flex flex-col pt-2">
					<p class="font-semibold text-surface-900 pb-3">Resources</p>
					<For each={getResourceLinks()}>
						{(link) => (
							<div class="w-fit opacity-80">
								<Button type="text" href={link.href}>
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
								<Button type="text" href={link.href}>
									{link.name}
								</Button>
							</div>
						)}
					</For>
				</div>
				<div class="w-full sm:w-1/3 md:w-1/4 xl:px-4 xl:flex flex-col pt-2">
					<p class="font-semibold text-surface-900 pb-3">Contact</p>
					<For each={getContactLinks()}>
						{(link) => (
							<div class="w-fit opacity-80">
								<Button type="text" href={link.href}>
									{link.name}
								</Button>
							</div>
						)}
					</For>
				</div>
			</div>
			<div class="px-4 xl:px-0 flex flex-col xl:flex-row justify-between items-end gap-8 pb-16">
				<div class="xl:px-4 xl:flex flex-col gap-2 md:gap-4 pt-2 max-xl:w-full">
					<NewsletterForm />
				</div>
				<p class="text-sm text-surface-500">
					Copyright {new Date().getFullYear().toString()} inlang
				</p>
			</div>
		</footer>
	)
}

export default Footer
