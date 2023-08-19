import { createEffect, createSignal, on, onMount, Show } from "solid-js"
import { createTiptapEditor, useEditorJSON } from "solid-tiptap"
import { useLocalStorage } from "#src/services/local-storage/index.js"
import { useEditorState } from "../State.jsx"
import type { SlDialog } from "@shoelace-style/shoelace"
import { showToast } from "#src/components/Toast.jsx"
import MaterialSymbolsTranslateRounded from "~icons/material-symbols/translate-rounded"
import MaterialSymbolsCheck from "~icons/material-symbols/check"
import { Notification, NotificationHint } from "./Notification/NotificationHint.jsx"
import { telemetryBrowser } from "@inlang/telemetry"
import { getTextValue, setTipTapMessage } from "../helper/parse.js"
import { getEditorConfig } from "../helper/editorSetup.js"
import { FloatingMenu } from "./FloatingMenu.jsx"
import {
	Message,
	VariableReference,
	LanguageTag,
	Variant,
	createVariant,
	updateVariantPattern,
	getVariant,
} from "@inlang/app"

/**
 * The pattern editor is a component that allows the user to edit the pattern of a message.
 */
export function PatternEditor(props: {
	languageTag: LanguageTag
	message: Message
}) {
	const [localStorage, setLocalStorage] = useLocalStorage()
	const {
		localChanges,
		setLocalChanges,
		userIsCollaborator,
		routeParams,
		filteredLanguageTags,
		inlang,
		sourceLanguageTag
	} = useEditorState()

	const [variableReferences, setVariableReferences] = createSignal<VariableReference[]>([])

	const [hasChanges, setHasChanges] = createSignal(false)

	const [showMachineLearningWarningDialog, setShowMachineLearningWarningDialog] =
		createSignal(false)

	let machineLearningWarningDialog: SlDialog | undefined

	const [isLineItemFocused, setIsLineItemFocused] = createSignal(false)

	const handleLineItemFocusIn = () => {
		if (document.activeElement?.tagName !== "SL-BUTTON") {
			if (document.activeElement !== textArea.children[0]) {
				setIsLineItemFocused(false)
			}
		} else {
			if (
				document.activeElement.parentElement?.parentElement?.parentElement?.children[1] === textArea
			) {
				setIsLineItemFocused(true)
			}
		}
	}

	const sourceMessage = () => props.message.body[sourceLanguageTag()!]

	const variant = () => props.message["body"][props.languageTag]
		? props.message["body"][props.languageTag]![0]
		: undefined

	const newPattern = () => getTextValue(editor) as Variant["pattern"];

	onMount(() => {
		if (sourceMessage()) {
			setVariableReferences(
				sourceMessage()![0]?.pattern
					.filter((pattern) => pattern.type === "VariableReference")
					.map((variableReference) => variableReference) as VariableReference[],
			)
		}

		document.addEventListener("focusin", handleLineItemFocusIn)
		return () => {
			document.removeEventListener("focusin", handleLineItemFocusIn)
		}
	})

	//create editor
	let textArea!: HTMLDivElement
	const editor = createTiptapEditor(() => {
		return getEditorConfig(textArea, variant(), variableReferences())
	})

	const currentJSON = useEditorJSON(() => editor());

	createEffect(on(currentJSON, () => {
		if (currentJSON().content[0].content !== undefined) {
			setHasChanges((prev) => {
				const hasChanged = JSON.stringify(variant()?.pattern) !== JSON.stringify(newPattern())
				if (prev !== hasChanged && hasChanged) {
					setLocalChanges((prev) => prev += 1)
				} else if (prev !== hasChanged && !hasChanged) {
					setLocalChanges((prev) => prev -= 1)
				}
				return hasChanged
			})
		}
	}))

	const autoSave = () => {
		let newMessage;
		if (variant() === undefined) {
			newMessage = createVariant(props.message, {
				where: { languageTag: props.languageTag },
				data: {
					match: {},
					pattern: newPattern(),
				}
			})
		} else {
			newMessage = updateVariantPattern(props.message, {
				where: {
					languageTag: props.languageTag,
					selectors: {},
				},
				data: newPattern(),
			})
		};
		if (newMessage.data) {
			const upsertSuccessful = inlang()?.query.messages.upsert({
				where: { id: props.message.id },
				data: newMessage.data,
			});
			if (!upsertSuccessful) {
				throw new Error("Cannot update message")
			}
		} else {
			throw new Error("Cannot update message: ", newMessage.error)
		}
	}

	// const [_isFork] = createResource(
	// 	() => localStorage.user,
	// 	async (user) => {
	// 		const response = await isFork({
	// 			owner: (currentPageContext.routeParams as EditorRouteParams).owner,
	// 			repository: (currentPageContext.routeParams as EditorRouteParams)
	// 				.repository,
	// 			username: user.username,
	// 		});
	// 		if (response.type === "success") {
	// 			return response.fork;
	// 		} else {
	// 			return response;
	// 		}
	// 	}
	// );

	const [machineTranslationIsLoading, setMachineTranslationIsLoading] = createSignal(false)

	const handleMachineTranslate = async () => {
		if (sourceMessage() === undefined) {
			return showToast({
				variant: "info",
				title: "Can't translate if the reference message does not exist.",
			})
		}
		let text = ""
		Object.values(sourceMessage()!).some((value) => {
			text = value.pattern
				.map((pattern) => {
					if (pattern.type === "Text") {
						return pattern.value.toLocaleLowerCase()
					} else if (pattern.type === "VariableReference") {
						return pattern.name.toLowerCase()
					} else {
						return false
					}
				})
				.join("")
		})

		if (text === "") {
			return showToast({
				variant: "info",
				title: "Can't translate empty text",
			})
		} else if (localStorage.showMachineTranslationWarning) {
			setShowMachineLearningWarningDialog(true)
			return machineLearningWarningDialog?.show()
		}
		setMachineTranslationIsLoading(true)
		const { rpc } = await import("@inlang/rpc");
		const translation = await rpc.machineTranslateMessage({
			message: props.message,
			sourceLanguageTag: inlang()!.config()!.sourceLanguageTag!,
			targetLanguageTags: [props.languageTag],
		})
		if (translation.error !== undefined) {
			showToast({
				variant: "warning",
				title: "Machine translation failed.",
				message: translation.error,
			})
		}
		else {
			const newPattern = getVariant(translation.data, {
				where: {
					languageTag: props.languageTag,
					selectors: {},
				},
			})?.pattern || []
			if (JSON.stringify(newPattern) !== "[]") {
				editor().commands.setContent(setTipTapMessage(
					newPattern
				))
			} else {
				showToast({
					variant: "warning",
					title: "Machine translation failed.",
					message: "Empty pattern already exists for this language.",
				})
			}
		}

		setMachineTranslationIsLoading(false)
	}

	const getNotificationHints = () => {
		const notifications: Array<Notification> = []
		inlang()?.lint.reports().map((report) => {
			if (report.messageId === props.message.id && report.languageTag === props.languageTag) {
				notifications.push({
					notificationTitle: inlang()?.installed.lintRules()
						.filter((lintRule) => !lintRule.disabled)
						.find((rule) => rule.meta.id === report.ruleId)?.meta.displayName["en"] || report.ruleId,
					notificationDescription: report.body.en,
					notificationType: report.level,
				})
			}
		})

		if (hasChanges() && localStorage.user === undefined) {
			notifications.push({
				notificationTitle: "Access:",
				notificationDescription: "Sign in to commit changes.",
				notificationType: "warning",
			})
		}
		if (hasChanges() && userIsCollaborator() === false) {
			notifications.push({
				notificationTitle: "Fork:",
				notificationDescription: "Fork the project to commit changes.",
				notificationType: "warning",
			})
		}
		return notifications
	}

	let timer: ReturnType<typeof setTimeout>;
	const handleShortcut = (event: KeyboardEvent) => {
		// @ts-ignore
		const platform = navigator?.userAgentData?.platform || navigator?.platform
		if (
			((event.ctrlKey && event.code === "KeyS" && platform.toLowerCase().includes("win")) ||
				(event.metaKey && event.code === "KeyS" && platform.toLowerCase().includes("mac"))) &&
			userIsCollaborator()
		) {
			event.preventDefault()
			clearTimeout(timer);
			timer = setTimeout(() => {
				showToast({
					variant: "info",
					title: "Inlang saves automatically but make shure to push your changes."
				})
			}, 500);
		}
	}

	return (
		// outer element is needed for clickOutside directive
		// to close the action bar when clicking outside
		<div
			onClick={() => {
				editor().chain().focus()
			}}
			onFocusIn={() => setIsLineItemFocused(true)}
			onFocusOut={() => { autoSave() }}
			class="flex justify-start items-start w-full gap-5 px-4 py-1.5 bg-background border first:mt-0 -mt-[1px] border-surface-3 hover:bg-[#FAFAFB] hover:bg-opacity-75 focus-within:relative focus-within:border-primary focus-within:ring-[3px] focus-within:ring-hover-primary/50"
		>
			<div class="flex justify-start items-start gap-2 py-[5px]">
				<div class="flex justify-start items-center flex-grow-0 flex-shrink-0 w-[72px] gap-2 py-0">
					<div class="flex justify-start items-start flex-grow-0 flex-shrink-0 relative gap-2">
						<p class="flex-grow-0 flex-shrink-0 text-[13px] font-medium text-left text-on-surface-variant()">
							{props.languageTag}
						</p>
					</div>
					{inlang()?.config()?.sourceLanguageTag === props.languageTag && (
						<sl-badge prop:variant="neutral">ref</sl-badge>
					)}
				</div>
			</div>

			{/* tiptap floating menu */}
			<div
				id="parent"
				class="w-full text-sm p-[6px] focus-within:border-none focus-within:ring-0 focus-within:outline-none"
			>
				<FloatingMenu variableReferences={variableReferences()} editor={editor} />

				{/* tiptap editor */}
				<div
					id={props.message.id + "-" + props.languageTag}
					ref={textArea}
					onKeyDown={(event) => handleShortcut(event)}
					onFocusIn={() => {
						setLocalStorage("isFirstUse", false)
						telemetryBrowser.capture("EDITOR clicked in field", {
							targetLanguage: props.languageTag,
							owner: routeParams().owner,
							repository: routeParams().repository,
						})
					}}
				/>
			</div>

			{/* action bar */}
			<div class="w-[164px] h-8 flex justify-end items-center gap-2">
				<div class="flex items-center justify-end gap-2">
					<Show
						when={
							JSON.stringify(getTextValue(editor)) === "[]" || getTextValue(editor) === undefined
						}
					>
						<sl-button
							onClick={handleMachineTranslate}
							// prop:disabled={
							// 	(textValue() !== undefined && textValue() !== "") ||
							// 	props.referenceMessage === undefined
							// }
							prop:loading={machineTranslationIsLoading()}
							prop:variant="neutral"
							prop:size="small"
						>
							{/* @ts-ignore */}
							<MaterialSymbolsTranslateRounded slot="prefix" />
							Machine translate
						</sl-button>
					</Show>
					<Show when={
						hasChanges() &&
						isLineItemFocused()
					}>
						<sl-button
							prop:variant="primary"
							prop:size="small"
							prop:disabled={
								hasChanges() === false ||
								userIsCollaborator() === false}
							onClick={() => {
								editor().commands.setContent(setTipTapMessage(
									variant()?.pattern || []
								))
								textArea.parentElement?.click()
							}}
						>
							Revert
						</sl-button>
					</Show>
				</div >
				<Show when={!isLineItemFocused() && hasChanges()}>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						class="text-hover-primary mr-1"
					>
						<path
							d="M4 12L9 17L19.5 6.5"
							stroke="currentColor"
							stroke-width="2"
							class="animate-draw"
						/>
					</svg>
				</Show>
				{getNotificationHints().length !== 0 && (
					<NotificationHint notifications={getNotificationHints()} />
				)}
				<Show when={showMachineLearningWarningDialog()}>
					<sl-dialog prop:label="Machine translations pitfalls" ref={machineLearningWarningDialog}>
						<ol class="">
							<li>
								1. Machine translations are not always correct. Always check and correct the
								translation as necessary.
							</li>
							<br />
							<li>
								2. Machine translations do not exclude placeholders like "My name is{" "}
								<code class="bg-surface-1 py-0.5 px-1 rounded">{"{name}"}</code>
								{'" '}
								yet. Make sure that placeholders between the reference message and translations
								match. For more information read{" "}
								<a
									href="https://github.com/orgs/inlang/discussions/228"
									target="_blank"
									class="link link-primary"
								>
									#228
								</a>
								.
							</li>
						</ol>
						<sl-button
							prop:variant="warning"
							slot="footer"
							onClick={() => {
								setLocalStorage("showMachineTranslationWarning", false)
								machineLearningWarningDialog?.hide()
								handleMachineTranslate()
							}}
						>
							Proceed with machine translating
						</sl-button>
					</sl-dialog>
				</Show>
			</div>
		</div>
	)
}
