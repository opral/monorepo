import { Match, Switch } from "solid-js"
import {
	AliasIcon,
	AppIcon,
	LanguageTagIcon,
	LibraryIcon,
	LintRuleIcon,
	MessageIcon,
	PluginIcon,
	ProjectIcon,
} from "./icons/TinyIcons.jsx"
import { isSelected } from "./+Page.jsx"
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
					<div class="mr-3 w-4 h-4">
						<AppIcon />
					</div>
				</Match>
				<Match when={props.slug === "concept/project"}>
					<div class="mr-3 w-4 h-4">
						<ProjectIcon />
					</div>
				</Match>
				<Match when={props.slug === "concept/message"}>
					<div class="mr-3 w-4 h-4">
						<MessageIcon />
					</div>
				</Match>
				<Match when={props.slug === "concept/alias"}>
					<div class="mr-3 w-4 h-4">
						<AliasIcon />
					</div>
				</Match>
				<Match when={props.slug === "concept/library"}>
					<div class="mr-3 w-4 h-4">
						<LibraryIcon />
					</div>
				</Match>
				<Match when={props.slug === "concept/language-tag"}>
					<div class="mr-3 w-4 h-4">
						<LanguageTagIcon />
					</div>
				</Match>
				<Match when={props.slug === "plugin"}>
					<div class="mr-3 w-4 h-4">
						<PluginIcon />
					</div>
				</Match>
				<Match when={props.slug === "lint-rule"}>
					<div class="mr-3 w-4 h-4">
						<LintRuleIcon />
					</div>
				</Match>
			</Switch>
		</div>
	)
}

export default NavbarIcon
