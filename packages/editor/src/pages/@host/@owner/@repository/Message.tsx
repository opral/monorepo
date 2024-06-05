import { createEffect, createSignal, For, on, Show } from "solid-js"
import { useEditorState } from "./State.jsx"
import { createVisibilityObserver } from "@solid-primitives/intersection-observer"
import { PatternEditor } from "./components/PatternEditor.jsx"
import { showFilteredMessage } from "./helper/showFilteredMessage.js"
import IconLink from "~icons/material-symbols/link"
import copy from "clipboard-copy"
import { showToast } from "#src/interface/components/Toast.jsx"
import type { MessageLintReport, Message as MessageType } from "@inlang/sdk"
import { sortLanguageTags } from "./helper/sortLanguageTags.js"
import { setMessageCount } from "./+Page.jsx"

export function Message(props: { id: string }) {
	const { project, filteredLanguageTags, filteredIds, filteredMessageLintRules, textSearch } =
		useEditorState()
	const [message, setMessage] = createSignal<MessageType>()
	const [lintReports, setLintReports] = createSignal<readonly MessageLintReport[]>([])
	const [shouldMessageBeShown, setShouldMessageBeShown] = createSignal(true)
	// const [blockChangeMessageIsFocused, setBlockChangeMessageIsFocused]  = createSignal<Date>(new Date())

	// performance optimization to only render visible elements
	// see https://github.com/opral/monorepo/issues/333
	const useVisibilityObserver = createVisibilityObserver()
	let patternListElement: HTMLDivElement | undefined
	const elementIsVisible = useVisibilityObserver(() => patternListElement)
	// has been rendered should be true if the element was visible
	const [hasBeenRendered, setHasBeenRendered] = createSignal(false)
	const [hasBeenLinted, setHasBeenLinted] = createSignal(false)

	createEffect(() => {
		if (elementIsVisible()) {
			setHasBeenRendered(true)
		}
	})

	createEffect(() => {
		if (!project.loading) {
			project()!.query.messages.get.subscribe({ where: { id: props.id } }, (message) =>
				setMessage(message)
			)
		}
	})

	createEffect(() => {
		if (!project.loading && message()?.id) {
			project()!.query.messageLintReports.get.subscribe(
				{ where: { messageId: message()!.id } },
				(report) => {
					if (report) {
						setLintReports(report)
						setHasBeenLinted(true)
					}
				}
			)
		}
	})

	createEffect(
		on(
			[filteredLanguageTags, filteredMessageLintRules, filteredIds, textSearch, hasBeenLinted],
			() => {
				setShouldMessageBeShown((prev) => {
					const result = !showFilteredMessage(message())
					// check if message count changed and update the global message count
					if (result !== prev && result === true) {
						setMessageCount((prev) => prev - 1)
					} else if (result !== prev && result === false) {
						setMessageCount((prev) => prev + 1)
					}
					return result
				})
			}
		)
	)

	return (
		<div
			ref={patternListElement}
			class="group"
			// Classlist "hidden" is a performance optimization to only render visible elements.
			//
			// Using a <Show> would re-trigger the render of all pattern and
			// web components. See https://github.com/opral/monorepo/pull/555
			classList={{
				["hidden"]: message() ? shouldMessageBeShown() : true,
				["animate-fadeInBottom"]: !shouldMessageBeShown(),
			}}
		>
			<div class="flex w-full gap-2 items-center self-stretch flex-grow-0 flex-shrink-0 h-11 relative px-4 bg-surface-2 border-x border-b-0 border-[#DFE2E4]">
				<h3
					slot="summary"
					class="flex-grow-0 flex-shrink-0 max-w-[calc(100%_-_38px)] text-[13px] font-medium text-left text-on-surface before:text-on-surface truncate"
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
								message()?.id
						),
							showToast({
								variant: "success",
								title: "Message ID link copied to clipboard",
								duration: 3000,
							})
					}}
					class="opacity-0 transition-all group-hover:opacity-100 text-info/70 h-7 w-7 text-sm rounded flex items-center justify-center hover:bg-on-background/10 hover:text-info cursor-pointer"
				>
					<IconLink />
				</div>
				<h3
					slot="summary"
					class="flex-grow-0 flex-shrink-0 text-[13px] font-medium text-left text-on-surface before:text-on-surface"
				>
					{message() && Object.keys(message()!.alias).length > 0
						? message()!.alias[Object.keys(message()!.alias)[0]!]
						: ""}
				</h3>
			</div>
			<div>
				<For
					each={sortLanguageTags(
						project()?.settings()?.languageTags || [],
						// eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
						project()?.settings()?.sourceLanguageTag!
					)}
				>
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
									// fallback={
									// 	<div
									// 		class="h-[46px] flex justify-start items-start w-full gap-5 px-4 py-1.5 bg-background border first:mt-0 -mt-[1px] border-surface-3 hover:bg-[#FAFAFB] hover:bg-opacity-75 focus-within:relative focus-within:border-primary focus-within:ring-[3px] focus-within:ring-hover-primary/50"
									// 	>
									// 		<div class="flex justify-start items-start gap-2 py-[5px]">
									// 			<div class="flex justify-start items-center flex-grow-0 flex-shrink-0 w-[72px] gap-2 py-0">
									// 				<div class="flex justify-start items-start flex-grow-0 flex-shrink-0 relative gap-2">
									// 					<p class="flex-grow-0 flex-shrink-0 text-[13px] font-medium text-left text-on-surface-variant()">
									// 						{languageTag}
									// 					</p>
									// 				</div>
									// 				{index() === 0 && (
									// 					<sl-badge prop:variant="neutral">ref</sl-badge>
									// 				)}
									// 			</div>
									// 			<div class="w-full px-[6px] py-[2px] focus-within:border-none focus-within:ring-0 focus-within:outline-none">
									// 				<div class={"animate-pulse rounded-sm bg-surface-2 h-5 " +
									// 					(index() % 3 === 0 ? " w-32" : index() % 3 === 1 ? " w-24" : " w-28")
									// 				} />
									// 			</div>
									// 		</div>
									// 	</div>
									// }
								>
									<PatternEditor
										languageTag={languageTag}
										message={message()!}
										lintReports={lintReports() as MessageLintReport[]}
										// hidden={!(filteredLanguageTags().includes(languageTag) || filteredLanguageTags().length === 0)}
									/>
								</Show>
							</>
						)
					}}
				</For>
			</div>
		</div>
	)
}
