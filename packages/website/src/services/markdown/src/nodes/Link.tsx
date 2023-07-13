import { defaultLanguage } from "@src/renderer/_default.page.route.js"
import { useLocalStorage } from "@src/services/local-storage/index.js"
import { JSXElement, Match, Switch } from "solid-js"
import MaterialSymbolsArrowOutward from "~icons/material-symbols/arrow-outward"

/**
 * Custom Link nodes.
 *
 * @example
 *  [title](href)
 */
export function Link(props: { href: string; children: JSXElement }) {
	/** whether a link is an external link */
	const isExternal = () => props.href.startsWith("http")
	const [localStorage] = useLocalStorage()

	const getLocale = () => {
		const locale = localStorage.locale || defaultLanguage
		return locale !== defaultLanguage ? "/" + locale : ""
	}

	return (
		<Switch>
			<Match when={isExternal()}>
				<a
					href={props.href}
					target="_blank"
					class="inline-flex gap-0.5 items-center text-primary hover:text-hover-primary no-underline m-0"
				>
					{props.children}
					{/* using non-rounded version to increase readability on smaller font settings */}
					<MaterialSymbolsArrowOutward />
				</a>
			</Match>
			<Match when={isExternal() === false}>
				<a
					href={getLocale() + props.href}
					class="text-primary hover:text-hover-primary no-underline"
				>
					{props.children}
				</a>
			</Match>
		</Switch>
	)
}
