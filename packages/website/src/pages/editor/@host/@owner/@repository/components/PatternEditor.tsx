import { createEffect, createSignal, onMount, Show } from "solid-js"
import { useEditorIsFocused, createTiptapEditor } from "solid-tiptap"
import type * as ast from "@inlang/core/ast"
import { useLocalStorage } from "@src/services/local-storage/index.js"
import { useEditorState } from "../State.jsx"
import type { SlDialog } from "@shoelace-style/shoelace"
import { query } from "@inlang/core/query"
import { showToast } from "@src/components/Toast.jsx"
import MaterialSymbolsCommitRounded from "~icons/material-symbols/commit-rounded"
import MaterialSymbolsTranslateRounded from "~icons/material-symbols/translate-rounded"
import { Notification, NotificationHint } from "./Notification/NotificationHint.jsx"
import { getLintReports, LintedMessage } from "@inlang/core/lint"
import { Shortcut } from "./Shortcut.jsx"
import type { Resource } from "@inlang/core/ast"
import { rpc } from "@inlang/rpc"
import { telemetryBrowser } from "@inlang/telemetry"
import { getTextValue, setTipTapMessage } from "../helper/parse.js"
import { getEditorConfig } from "../helper/editorSetup.js"
import { FloatingMenu } from "./FloatingMenu.jsx"

/**
 * The pattern editor is a component that allows the user to edit the pattern of a message.
 */
export function PatternEditor(props: {
	referenceLanguage: ast.Resource["languageTag"]["name"]
	language: ast.Resource["languageTag"]["name"]
	id: ast.Message["id"]["name"]
	referenceMessage?: ast.Message
	message: ast.Message | undefined
	variableReferences: ast.VariableReference[]
}) {
	const [localStorage, setLocalStorage] = useLocalStorage()
	const {
		resources,
		setResources,
		referenceResource,
		userIsCollaborator,
		routeParams,
		filteredLanguages,
	} = useEditorState()

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

	onMount(() => {
		document.addEventListener("focusin", handleLineItemFocusIn)
		return () => {
			document.removeEventListener("focusin", handleLineItemFocusIn)
		}
	})

	//create editor
	let textArea!: HTMLDivElement
	const editor = createTiptapEditor(() => getEditorConfig(textArea, props.message))

	const getEditorFocus = () => {
		if (editor()) {
			const isFocus = useEditorIsFocused(() => editor())
			return isFocus()
		}
	}

	/** the resource the message belongs to */
	const resource = () => resources.find((resource) => resource.languageTag.name === props.language)!

	/** copy of the message to conduct and track changes */
	const copy: () => ast.Message | undefined = () =>
		props.message
			? // clone message
			  structuredClone(props.message)
			: // new message
			  {
					type: "Message",
					id: {
						type: "Identifier",
						name: props.id,
					},
					pattern: {
						type: "Pattern",
						elements: [{ type: "Text", value: "" }],
					},
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

	const hasChanges = () => {
		const _updatedText =
			JSON.stringify(getTextValue(editor)) === "[]" ? undefined : getTextValue(editor)
		const ast_elements = props.message?.pattern.elements
		if (_updatedText) {
			if (JSON.stringify(_updatedText) !== JSON.stringify(ast_elements)) {
				return _updatedText
			} else {
				return ""
			}
		} else {
			return false
		}
	}

	/**
	 * Saves the changes of the message.
	 */
	const [commitIsLoading, setCommitIsLoading] = createSignal(false)

	const handleCommit = async () => {
		setCommitIsLoading(true)
		const _copy: ast.Message | undefined = copy()
		const _textValue =
			JSON.stringify(getTextValue(editor)) === "[]" ? undefined : getTextValue(editor)
		if (!_textValue || !_copy) {
			return
		}
		_copy.pattern.elements = _textValue as Array<ast.Text | ast.Placeholder>

		const [updatedResource] = query(resource()).upsert({ message: _copy! })

		setResources([
			...(resources.filter(
				(_resource) => _resource.languageTag.name !== resource().languageTag.name,
			) as Resource[]),
			//@ts-ignore
			updatedResource as Resource,
		])
		//this is a dirty fix for getting focus back to the editor after commit
		setTimeout(() => {
			textArea.parentElement?.click()
		}, 500)
		telemetryBrowser.capture("commit changes", {
			targetLanguage: props.language,
			owner: routeParams().owner,
			repository: routeParams().repository,
		})
	}

	createEffect(() => {
		const resource = resources.filter((resource) => resource.languageTag.name === props.language)
		if (resource && textArea) {
			setCommitIsLoading(false)
		}
	})

	const [machineTranslationIsLoading, setMachineTranslationIsLoading] = createSignal(false)

	const handleMachineTranslate = async () => {
		if (props.referenceMessage === undefined) {
			return showToast({
				variant: "info",
				title: "Can't translate if the reference message does not exist.",
			})
		}
		const textArr: Array<string> = []
		props.referenceMessage.pattern.elements.map((element) => {
			if (element.type === "Text") {
				textArr.push(element.value)
			} else if (element.type === "Placeholder") {
				textArr.push(element.body.name)
			}
		})
		const text = textArr.join("")
		//const text = props.referenceMessage.pattern.elements[0]?.value as string
		if (text === undefined) {
			return showToast({
				variant: "info",
				title: "Can't translate empty text",
			})
		} else if (localStorage.showMachineTranslationWarning) {
			setShowMachineLearningWarningDialog(true)
			return machineLearningWarningDialog?.show()
		}
		setMachineTranslationIsLoading(true)
		const [translation, exception] = await rpc.machineTranslate({
			text,
			referenceLanguage: referenceResource()!.languageTag.name,
			targetLanguage: props.language,
			telemetryId: telemetryBrowser.get_distinct_id(),
		})
		if (exception) {
			showToast({
				variant: "warning",
				title: "Machine translation failed.",
				message: exception.message,
			})
		} else {
			const _copy: ast.Message | undefined = copy()
			if (_copy) {
				_copy.pattern.elements = [{ type: "Text", value: translation }] as Array<
					ast.Text | ast.Placeholder
				>
				editor().commands.setContent(setTipTapMessage(_copy))
			}
		}
		setMachineTranslationIsLoading(false)
	}

	const getNotificationHints = () => {
		const notifications: Array<Notification> = []
		if (props.message) {
			const lintReports = getLintReports(props.message as LintedMessage)
			const filteredReports = lintReports.filter((report) => {
				if (
					!report.id.includes("missingMessage") ||
					// catch all missingMessage reports
					report.message.match(
						/The pattern contains only only one element which is an empty string\./i,
					) ||
					report.message.match(/Empty pattern (length 0)\./i) ||
					//@ts-ignore
					filteredLanguages().includes(report.message.match(/'([^']+)'/g)![1]?.replace(/'/g, "")) ||
					// fallback for older versions
					report.message.match(/Message with id '([A-Za-z0-9]+(\.[A-Za-z0-9]+)+)' is missing\./i)
				) {
					return true
				}
				return false
			})
			if (filteredReports) {
				filteredReports.map((lint) => {
					notifications.push({
						notificationTitle: lint.id.includes(".") ? lint.id.split(".")[1]! : lint.id,
						notificationDescription: lint.message,
						notificationType: lint.level,
					})
				})
			}
		}

		if (hasChanges() && localStorage.user === undefined) {
			notifications.push({
				notificationTitle: "Access:",
				notificationDescription: "Sign in to commit changes.",
				notificationType: "warn",
			})
		}
		if (hasChanges() && userIsCollaborator() === false) {
			notifications.push({
				notificationTitle: "Fork:",
				notificationDescription: "Fork the project to commit changes.",
				notificationType: "info",
			})
		}
		return notifications
	}

	const handleShortcut = (event: KeyboardEvent) => {
		if (
			((event.ctrlKey && event.code === "KeyS" && navigator.platform.includes("Win")) ||
				(event.metaKey && event.code === "KeyS" && navigator.platform.includes("Mac"))) &&
			hasChanges() &&
			userIsCollaborator()
		) {
			event.preventDefault()
			handleCommit()
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
			class="flex justify-start items-start w-full gap-5 px-4 py-1.5 bg-background border first:mt-0 -mt-[1px] border-surface-3 hover:bg-[#FAFAFB] hover:bg-opacity-75 focus-within:relative focus-within:border-primary focus-within:ring-[3px] focus-within:ring-hover-primary/50"
		>
			<div class="flex justify-start items-start gap-2 py-[5px]">
				<div class="flex justify-start items-center flex-grow-0 flex-shrink-0 w-[72px] gap-2 py-0">
					<div class="flex justify-start items-start flex-grow-0 flex-shrink-0 relative gap-2">
						<p class="flex-grow-0 flex-shrink-0 text-[13px] font-medium text-left text-on-surface-variant">
							{props.language}
						</p>
					</div>
					{props.referenceLanguage === props.language && (
						<sl-badge prop:variant="neutral">ref</sl-badge>
					)}
				</div>
				{/* TODO: #169 use proper text editor instead of input element */}
			</div>

			{/* tiptap floating menu */}
			<div
				id="parent"
				class="w-full text-sm p-[6px] focus-within:border-none focus-within:ring-0 focus-within:outline-none"
			>
				<Show when={props.variableReferences.length > 0}>
					<FloatingMenu variableReferences={props.variableReferences} editor={editor} />
				</Show>

				{/* tiptap editor */}
				<div
					id={props.id + "-" + props.language}
					ref={textArea}
					onKeyDown={(event) => handleShortcut(event)}
				/>
			</div>

			{/* action bar */}
			<div class="w-[164px] h-8 flex justify-end items-center gap-2">
				<Show when={true}>
					<div class="flex items-center justify-end gap-2">
						<Show
							when={
								JSON.stringify(getTextValue(editor)) === "[]" || getTextValue(editor) === undefined
							}
						>
							<sl-button
								onClick={handleMachineTranslate}
								// prop:disabled={true}
								// prop:disabled={
								// 	(textValue() !== undefined && textValue() !== "") ||
								// 	props.referenceMessage === undefined
								// }
								prop:loading={machineTranslationIsLoading()}
								prop:variant="neutral"
								prop:size="small"
							>
								<MaterialSymbolsTranslateRounded slot="prefix" />
								Machine translate
							</sl-button>
						</Show>
						<Show when={hasChanges() && isLineItemFocused()}>
							<sl-button
								prop:variant="primary"
								prop:size="small"
								prop:loading={commitIsLoading()}
								prop:disabled={hasChanges() === false || userIsCollaborator() === false}
								onClick={() => {
									handleCommit()
								}}
							>
								<MaterialSymbolsCommitRounded slot="prefix" />
								<Shortcut slot="suffix" color="primary" codes={["ControlLeft", "s"]} />
								Commit
							</sl-button>
						</Show>
					</div>
				</Show>
				<Show when={!getEditorFocus() && !isLineItemFocused() && hasChanges()}>
					<div class="bg-hover-primary w-2 h-2 rounded-full" />
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
								//handleMachineTranslate()
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
