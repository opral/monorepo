import { createEffect, createSignal, on, onMount, Show } from "solid-js"
import { createTiptapEditor, useEditorJSON } from "solid-tiptap"
import { useLocalStorage } from "#src/services/local-storage/index.js"
import { useEditorState } from "../State.jsx"
import type { SlDialog } from "@shoelace-style/shoelace"
import { showToast } from "#src/interface/components/Toast.jsx"
import MaterialSymbolsTranslateRounded from "~icons/material-symbols/translate-rounded"
import { type Notification, NotificationHint } from "./Notification/NotificationHint.jsx"
import { posthog as telemetryBrowser } from "posthog-js"
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
	Pattern,
	type MessageLintReport,
} from "@inlang/sdk"
import Link from "#src/renderer/Link.jsx"
import { debounce } from "throttle-debounce"

/**
 * The pattern editor is a component that allows the user to edit the pattern of a message.
 */
export function PatternEditor(props: {
	languageTag: LanguageTag
	message: Message
	lintReports: MessageLintReport[]
}) {
	const [localStorage, setLocalStorage] = useLocalStorage()
	const {
		setLocalChanges,
		userIsCollaborator,
		routeParams,
		project,
		sourceLanguageTag,
		lastPullTime,
	} = useEditorState()

	const [variableReferences, setVariableReferences] = createSignal<VariableReference[]>([])

	const [hasChanges, setHasChanges] = createSignal(false)

	const [showMachineLearningWarningDialog, setShowMachineLearningWarningDialog] =
		createSignal(false)

	let machineLearningWarningDialog: SlDialog | undefined

	const [isLineItemFocused, setIsLineItemFocused] = createSignal(false)

	const handleLineItemFocusIn = () => {
		if (
			!document.activeElement?.classList.contains("PatternEditor") &&
			!document.activeElement?.classList.contains("tippy-box")
		) {
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

	const sourceVariant = () =>
		getVariant(props.message, { where: { languageTag: sourceLanguageTag()! } })

	const variant = () => getVariant(props.message, { where: { languageTag: props.languageTag } })

	const [referencePattern, setReferencePattern] = createSignal<Pattern>()

	const newPattern = () => getTextValue(editor) as Variant["pattern"]

	//create editor
	let textArea!: HTMLDivElement
	let editor: any

	/*
		Needs to be refactored, but it works for now:
		- should initialize editor if not created
		- should only rerender editor if variant pattern from query message is different to current editor content
	*/
	const [currentPattern, setCurrentPattern] = createSignal<Variant["pattern"]>(
		// eslint-disable-next-line solid/reactivity
		variant()?.pattern || []
	)

	function createOrUpdateEditor() {
		const newVariant = variant()

		if (JSON.stringify(currentPattern()) !== JSON.stringify(variant())) {
			if (editor) {
				editor.destroy()
			}

			editor = createTiptapEditor(() => {
				return getEditorConfig(textArea, newVariant, variableReferences)
			})

			setCurrentPattern(variant()?.pattern || [])
		}
	}
	// eslint-disable-next-line solid/reactivity
	createOrUpdateEditor()

	const currentJSON = useEditorJSON(() => editor())

	const [previousContent, setPreviousContent] = createSignal()

	onMount(() => {
		if (sourceVariant()) {
			setVariableReferences(
				sourceVariant()
					?.pattern.filter((pattern) => pattern.type === "VariableReference")
					.map((variableReference) => variableReference) as VariableReference[]
			)
		}
		setPreviousContent(currentJSON().content)

		document.addEventListener("focusin", handleLineItemFocusIn)
		return () => {
			document.removeEventListener("focusin", handleLineItemFocusIn)
		}
	})

	createEffect(
		on(lastPullTime, () => {
			setReferencePattern(
				project()
					?.query.messages.get({ where: { id: props.message.id } })
					?.variants.find((variant) => variant.languageTag === props.languageTag)?.pattern
			)
			setHasChanges(false)
		})
	)

	createEffect(
		// debounce to improve performance when typing
		// eslint-disable-next-line solid/reactivity
		on(
			currentJSON,
			debounce(500, () => {
				if (JSON.stringify(currentJSON().content) !== JSON.stringify(previousContent())) {
					autoSave()
					setPreviousContent(currentJSON().content)
					setHasChanges((prev) => {
						const hasChanged =
							JSON.stringify(referencePattern()) !== JSON.stringify(newPattern()) &&
							!(
								referencePattern() === undefined &&
								JSON.stringify(newPattern()) === `[{"type":"Text","value":""}]`
							)
						if (prev !== hasChanged && hasChanged) {
							setLocalChanges((prev) => (prev += 1))
						} else if (prev !== hasChanged && !hasChanged) {
							setLocalChanges((prev) => (prev -= 1))
						}
						return hasChanged
					})
				}
			})
		)
	)

	const autoSave = () => {
		let newMessage
		// missingMessage is a better default than emptyPattern
		if (JSON.stringify(newPattern()) === `[{"type":"Text","value":""}]`) {
			newMessage = { data: props.message }
			newMessage.data.variants = props.message.variants.filter(
				(variant) => variant.languageTag !== props.languageTag
			)
		} else {
			if (variant() === undefined) {
				newMessage = createVariant(props.message, {
					data: {
						languageTag: props.languageTag,
						match: [],
						pattern: newPattern(),
					},
				})
			} else {
				newMessage = updateVariantPattern(props.message, {
					where: {
						languageTag: props.languageTag,
						match: [],
					},
					data: newPattern(),
				})
			}
		}
		if (newMessage.data) {
			const upsertSuccessful = project()?.query.messages.upsert({
				where: { id: props.message.id },
				data: newMessage.data,
			})
			if (!upsertSuccessful) {
				throw new Error("Cannot update message")
			}
		} else {
			throw new Error("Cannot update message: ", newMessage.error)
		}
	}

	const [machineTranslationIsLoading, setMachineTranslationIsLoading] = createSignal(false)

	const handleMachineTranslate = async () => {
		if (sourceVariant() === undefined) {
			return showToast({
				variant: "info",
				title: "Can't translate if the reference message does not exist.",
			})
		}
		const text = sourceVariant()!
			.pattern.map((pattern) => {
				if (pattern.type === "Text") {
					return pattern.value.toLocaleLowerCase()
				} else if (pattern.type === "VariableReference") {
					return pattern.name.toLowerCase()
				} else {
					return false
				}
			})
			.join("")

		if (text === "") {
			return showToast({
				variant: "info",
				title: "Can't translate empty text",
			})
		} else if (localStorage.showMachineTranslationWarning) {
			setShowMachineLearningWarningDialog(true)
			return machineLearningWarningDialog?.show()
		}
		// check if empty Message is present for message
		const hasEmptyPattern = props.lintReports.some(
			(report) =>
				report.messageId === props.message.id &&
				report.languageTag === props.languageTag &&
				report.ruleId === "messageLintRule.inlang.emptyPattern"
		)

		const newMessage = structuredClone(props.message)
		if (hasEmptyPattern) {
			newMessage.variants = newMessage.variants.filter(
				(variant) => variant.languageTag !== props.languageTag
			)
		}

		setMachineTranslationIsLoading(true)
		const { rpc } = await import("@inlang/rpc")
		const translation = await rpc.machineTranslateMessage({
			message: newMessage,
			sourceLanguageTag: project()!.settings()!.sourceLanguageTag!,
			targetLanguageTags: [props.languageTag],
		})

		if (translation.error !== undefined) {
			showToast({
				variant: "warning",
				title: "Machine translation failed.",
				message: translation.error,
			})
		} else {
			const newPattern =
				getVariant(translation.data, {
					where: {
						languageTag: props.languageTag,
						match: [],
					},
				})?.pattern || []
			if (JSON.stringify(newPattern) !== "[]") {
				editor().commands.setContent(setTipTapMessage(newPattern))
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
		props.lintReports.map((report) => {
			if (report.messageId === props.message.id && report.languageTag === props.languageTag) {
				const messageLintRuleName = project()
					?.installed.messageLintRules()
					.find((rule) => rule.id === report.ruleId)?.displayName
				notifications.push({
					notificationTitle:
						typeof messageLintRuleName === "object"
							? messageLintRuleName.en
							: messageLintRuleName || report.ruleId,
					notificationDescription: typeof report.body === "object" ? report.body.en : report.body,
					notificationType: report.level,
				})
			}
		})

		if (hasChanges() && !localStorage.user?.isLoggedIn) {
			notifications.push({
				notificationTitle: "Access:",
				notificationDescription: "Sign in to commit changes.",
				notificationType: "warning",
			})
		}
		if (hasChanges() && localStorage.user?.isLoggedIn && !userIsCollaborator()) {
			notifications.push({
				notificationTitle: "Fork:",
				notificationDescription: "Use a fork to make changes.",
				notificationType: "warning",
			})
		}
		return notifications
	}

	let timer: ReturnType<typeof setTimeout>
	const handleShortcut = (event: KeyboardEvent) => {
		// @ts-ignore
		const platform = navigator?.userAgentData?.platform || navigator?.platform
		if (
			((event.ctrlKey && event.code === "KeyS" && platform.toLowerCase().includes("win")) ||
				(event.metaKey && event.code === "KeyS" && platform.toLowerCase().includes("mac"))) &&
			userIsCollaborator()
		) {
			event.preventDefault()
			clearTimeout(timer)
			timer = setTimeout(() => {
				showToast({
					variant: "info",
					title: "Inlang saves automatically, but make sure you push your changes.",
				})
			}, 500)
		}
	}

	return (
		// outer element is needed for clickOutside directive
		// to close the action bar when clicking outside
		<div
			onClick={() => editor().chain().focus()}
			onFocusIn={() => setIsLineItemFocused(true)}
			class={
				"flex flex-col sm:flex-row justify-start items-start w-full gap-2 sm:gap-5 px-4 py-1.5 bg-background border first:mt-0 -mt-[1px] border-surface-3 hover:bg-[#FAFAFB] hover:bg-opacity-75 focus-within:relative focus-within:border-primary focus-within:ring-[3px] focus-within:ring-hover-primary/50 "
			}
		>
			<div class="flex justify-start items-start gap-2 py-[5px]">
				<div class="flex justify-start items-center flex-grow-0 flex-shrink-0 w-[72px] gap-2 py-0">
					<div class="flex justify-start items-start flex-grow-0 flex-shrink-0 relative gap-2">
						<p class="flex-grow-0 flex-shrink-0 text-[13px] font-medium text-left text-on-surface-variant()">
							{props.languageTag}
						</p>
					</div>
					{project()?.settings()?.sourceLanguageTag === props.languageTag && (
						<sl-badge prop:variant="neutral">ref</sl-badge>
					)}
				</div>
			</div>

			{/* tiptap floating menu */}
			<div
				id="parent"
				class="w-full text-sm sm:p-[6px] focus-within:border-none focus-within:ring-0 focus-within:outline-none"
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
			<div class="w-full sm:w-[164px] h-8 flex justify-end items-center gap-2">
				<div class="flex items-center justify-end gap-2">
					<Show
						when={
							getTextValue(editor) === undefined ||
							JSON.stringify(getTextValue(editor)) === "[]" ||
							JSON.stringify(getTextValue(editor)) === `[{"type":"Text","value":""}]`
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
							class="PatternEditor"
						>
							{/* @ts-ignore */}
							<MaterialSymbolsTranslateRounded slot="prefix" />
							Machine translate
						</sl-button>
					</Show>
					<Show when={hasChanges() && isLineItemFocused()}>
						<sl-button
							prop:variant="default"
							prop:size="small"
							prop:disabled={hasChanges() === false || userIsCollaborator() === false}
							onClick={() => {
								editor().commands.setContent(setTipTapMessage(referencePattern()!))
								textArea.parentElement?.click()
							}}
							class="PatternEditor"
						>
							Revert
						</sl-button>
					</Show>
				</div>
				<Show
					when={
						!isLineItemFocused() &&
						hasChanges() &&
						!(
							getTextValue(editor) === undefined ||
							JSON.stringify(getTextValue(editor)) === "[]" ||
							JSON.stringify(getTextValue(editor)) === `[{"type":"Text","value":""}]`
						)
					}
				>
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
								<Link
									href="https://github.com/orgs/inlang/discussions/228"
									target="_blank"
									class="link link-primary"
								>
									#228
								</Link>
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
