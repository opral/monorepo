import { Show, For } from "solid-js"
import IconExpand from "~icons/material-symbols/expand-more-rounded"
import {
	setLanguageTag,
	availableLanguageTags,
	languageTag,
} from "@inlang/paraglide-js/inlang-marketplace"
import type { LanguageTag } from "@inlang/sdk"

export function LanguagePicker(props: { darkmode?: boolean }) {
	const languageNames: Record<LanguageTag, string> = {
		en: "English",
		de: "Deutsch",
		zh: "中文",
		sk: "Slovak",
		"pt-BR": "Portuguese Brazil",
		name: "English",
	}

	return (
		<div class="w-fit">
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
					<p>{languageTag()}</p>
					<IconExpand class="w-5 h-5 opacity-50" />
				</div>
				<sl-menu>
					<For each={availableLanguageTags}>
						{(language) => (
							<sl-menu-item
								//@ts-ignore
								type="checkbox"
								checked={language === languageTag()}
								onClick={() => setLanguageTag(language)}
							>
								<div class="flex flex-wrap gap-x-2 items-center">
									<p class="text-sm">{languageNames[language]}</p>
									<Show when={language !== "en" && language !== "de"}>
										<p class="flex items-center text-xs bg-surface-100 border border-surface-300 rounded-full text-surface-500 px-[6px] h-5">
											{"Community"}
										</p>
									</Show>
								</div>
								<p class="opacity-50 text-sm" slot="suffix">
									{language}
								</p>
							</sl-menu-item>
						)}
					</For>
				</sl-menu>
			</sl-dropdown>
		</div>
	)
}
