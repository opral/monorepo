import { Match, Switch } from "solid-js"
import {
	AppIcon,
	LanguageTagIcon,
	LibraryIcon,
	LintRuleIcon,
	MessageIcon,
	PluginIcon,
	ProjectIcon,
} from "./icons/TinyIcons.jsx"
import { isSelected } from "./index.page.jsx"
import { getDocsBaseUrl } from "#src/interface/sdkDocs/SdkDocsHeader.jsx"
import { currentPageContext } from "#src/renderer/state.js"

const NavbarIcon = (props: { slug: string }) => {
	return (
		<div
			class={
				getDocsBaseUrl(currentPageContext.urlParsed.pathname) !== "/documentation"
					? "hidden"
					: isSelected(props.slug)
					? "text-primary opacity-100"
					: "text-surface-700 opacity-50"
			}
		>
			<Switch>
				<Match when={props.slug === "concept/app"}>
					<div class="pr-3">
						<AppIcon />
					</div>
				</Match>
				<Match when={props.slug === "concept/project"}>
					<div class="pr-3">
						<ProjectIcon />
					</div>
				</Match>
				<Match when={props.slug === "concept/message"}>
					<div class="pr-3">
						<MessageIcon />
					</div>
				</Match>
				<Match when={props.slug === "concept/library"}>
					<div class="pr-3">
						<LibraryIcon />
					</div>
				</Match>
				<Match when={props.slug === "concept/language-tag"}>
					<div class="pr-3">
						<LanguageTagIcon />
					</div>
				</Match>
				<Match when={props.slug === "plugin"}>
					<div class="pr-3">
						<PluginIcon />
					</div>
				</Match>
				<Match when={props.slug === "lint-rule"}>
					<div class="pr-3">
						<LintRuleIcon />
					</div>
				</Match>
			</Switch>
		</div>
	)
}

export default NavbarIcon
