import { For } from "solid-js"
import type { buttonType } from "./Button.jsx"
import { currentPageContext } from "#src/renderer/state.js"
import { useI18n } from "@solid-primitives/i18n"
import { defaultLanguage } from "#src/renderer/_default.page.route.js"
import { navigate } from "vite-plugin-ssr/client/router"
const MarketplaceBar = (props: {
	links: Array<{ name: string; href: string; type: buttonType }>
	type: "light" | "dark"
}) => {
	const getTheme = () => {
		return props.type === "light"
			? {
					text: "text-surface-500",
					textSelected: "text-surface-900",
					bg: "bg-background",
					bgItem: "bg-transparent",
					bgItemSelected: "bg-surface-200/75",
					border: "border-surface-200",
			  }
			: {
					text: "text-surface-300",
					textSelected: "text-surface-100",
					bg: "bg-surface-900",
					bgItem: "bg-transparent",
					bgItemSelected: "bg-surface-700",
					border: "border-surface-700",
			  }
	}

	const [, { locale }] = useI18n()

	const getLocale = () => {
		const language = locale() || defaultLanguage
		return language !== defaultLanguage ? "/" + language : ""
	}

	return (
		<div
			class={
				"hidden md:flex justify-center items-center gap-1 border px-1.5 py-[5px] rounded-full transition-all" +
				getTheme().bg +
				" " +
				getTheme().border
			}
		>
			<For each={props.links}>
				{(link) => (
					<>
						<button
							class={
								"px-3 py-[6px] rounded-full text-sm " +
								(currentPageContext.urlParsed.pathname.includes(link.href)
									? getTheme().textSelected + " " + getTheme().bgItemSelected
									: getTheme().text + " " + getTheme().bgItem)
							}
							onClick={() => {
								// @ts-ignore - https://github.com/brillout/vite-plugin-ssr/issues/1106
								link.href && navigate(getLocale() + link.href)
							}}
						>
							{link.name}
						</button>
					</>
				)}
			</For>
		</div>
	)
}

export default MarketplaceBar
