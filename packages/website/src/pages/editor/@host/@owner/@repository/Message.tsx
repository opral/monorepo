import { createEffect, createSignal, For, Show } from "solid-js"
import { useEditorState } from "./State.jsx"
import { createVisibilityObserver } from "@solid-primitives/intersection-observer"
import { PatternEditor } from "./components/PatternEditor.jsx"
import { showFilteredMessage } from "./helper/showFilteredMessage.js"
import IconCopy from "~icons/material-symbols/content-copy-outline"
import copy from "clipboard-copy"
import { showToast } from "#src/components/Toast.jsx"
import type { Message as MessageType } from "@inlang/app"

export function Message(props: { id: string }) {
	const { inlang, filteredLanguageTags } = useEditorState()
	const [message, setMessage] = createSignal<MessageType>()

	// performance optimization to only render visible elements
	// see https://github.com/inlang/inlang/issues/333
	const useVisibilityObserver = createVisibilityObserver()
	let patternListElement: HTMLDivElement | undefined
	const elementIsVisible = useVisibilityObserver(() => patternListElement)
	// has been rendered should be true if the element was visible
	const [hasBeenRendered, setHasBeenRendered] = createSignal(false)

	createEffect(() => {
		if (elementIsVisible()) {
			setHasBeenRendered(true)
		}
	})

	createEffect(() => {
		if (!inlang.loading) {
			inlang()!.query.messages.get.subscribe({ where: { id: props.id } }, (message) =>
				setMessage(message),
			)
		}
	})

	return (
		<div
			ref={patternListElement}
			class="group"
			// Classlist "hidden" is a performance optimization to only render visible elements.
			//
			// Using a <Show> would re-trigger the render of all pattern and
			// web components. See https://github.com/inlang/inlang/pull/555
			classList={{
				["hidden"]: message() ? !showFilteredMessage(message()) : true,
			}}
		>
			<div class="flex gap-2 items-center self-stretch flex-grow-0 flex-shrink-0 h-11 relative px-4 bg-surface-2 border-x border-b-0 border-surface-2">
				<h3
					slot="summary"
					class="flex-grow-0 flex-shrink-0 text-[13px] font-medium text-left text-on-surface before:text-on-surface"
				>
					{message() ? message()!.id : "id"}
				</h3>
				<div
					onClick={() => {
						copy(
							document.location.protocol +
								"//" +
								document.location.host +
								document.location.pathname +
								"?id=" +
								message()?.id,
						),
							showToast({ variant: "success", title: "Copy to clipboard", duration: 3000 })
					}}
					class="opacity-0 transition-all group-hover:opacity-100 text-info/70 h-7 w-7 text-sm rounded flex items-center justify-center hover:bg-on-background/10 hover:text-info cursor-pointer"
				>
					<IconCopy />
				</div>
			</div>
			<div>
				<For each={inlang()?.config().languageTags}>
					{(languageTag) => {
						return (
							<>
								<Show
									when={
										(filteredLanguageTags().includes(languageTag) ||
											filteredLanguageTags().length === 0) &&
										// only render if visible or has been rendered before
										(elementIsVisible() || hasBeenRendered()) &&
										message()
									}
								>
									<PatternEditor languageTag={languageTag} message={message()!} />
								</Show>
							</>
						)
					}}
				</For>
			</div>
		</div>
	)
}
