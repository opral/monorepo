import { Button } from "#src/pages/index/components/Button.jsx"
import { For } from "solid-js"
import Link from "#src/renderer/Link.jsx"
import { currentPageContext } from "#src/renderer/state.js"

const SdkDocsHeader = () => {
	return (
		<>
			<header class="sticky top-0 w-full z-[9999] bg-background border-b border-surface-200 px-4">
				<div
					class={
						"max-w-7xl mx-auto flex flex-col md:flex-row justify-between md:items-center relative sm:static"
					}
				>
					<div class="flex items-center">
						<Link
							href={"/"}
							class="flex items-center w-fit pointer-events-auto py-4 transition-opacity hover:opacity-75"
						>
							<img class={"h-8 w-8"} src="/favicon/safari-pinned-tab.svg" alt="Company Logo" />
						</Link>
						<p class={"self-center text-left font-regular text-surface-400 pl-4 pr-1"}>/</p>
						<p class={"self-center pl-2 text-left font-medium text-surface-900"}>
							SDK Documentation
						</p>
					</div>
					<div class="flex gap-8">
						<Button type="text" href="https://github.com/inlang/monorepo">
							Github
						</Button>
						<Button type="text" href="https://discord.com/invite/gdMPPWy57R">
							Community
						</Button>
						<Button type="secondary" href="https://github.com/inlang/monorepo/discussions">
							Feedback
						</Button>
					</div>
				</div>
				<SdkDocsSubHeader />
			</header>
		</>
	)
}

export default SdkDocsHeader

const SdkDocsSubHeader = () => {
	const getCategories = () => {
		return [
			{
				name: "SDK",
				href: "/documentation",
			},
			{
				name: "Plugin",
				href: "/documentation/plugin",
			},
			// {
			// 	name: "Lint Rule",
			// 	href: "/documentation/lint-rule",
			// },
			// {
			// 	name: "Publish Content",
			// 	href: "/documentation/content",
			// },
		]
	}

	const getDocsBaseUrl = (link: string) => {
		if (link.split("/")[2] === "plugin") {
			return "/documentation/plugin"
		} else {
			return "/documentation"
		}
	}

	return (
		<nav class="max-w-7xl mx-auto flex gap-4 overflow-x-scroll hide-scrollbar items-center">
			<For each={getCategories()}>
				{(link) => (
					<div
						class={
							//todo: fix this
							(getDocsBaseUrl(currentPageContext.urlParsed.pathname) === link.href
								? "border-hover-primary "
								: "border-background ") +
							" border-b-[2px] pt-[8px] pb-[6px] text-sm bg-transparent group content-box"
						}
					>
						<a href={link.href}>
							<div
								class={
									(getDocsBaseUrl(currentPageContext.urlParsed.pathname) === link.href
										? "text-surface-900 "
										: "text-surface-500 hover:bg-surface-100 ") +
									" px-2 py-[6px] rounded-md transition-colors font-medium cursor-pointer w-max"
								}
							>
								{link.name}
							</div>
						</a>
					</div>
				)}
			</For>
		</nav>
	)
}