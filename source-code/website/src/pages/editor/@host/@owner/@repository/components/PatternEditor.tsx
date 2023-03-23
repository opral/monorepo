import { createEffect, createSignal, Show } from "solid-js"
import type * as ast from "@inlang/core/ast"
import { useLocalStorage } from "@src/services/local-storage/index.js"
import { useEditorState } from "../State.jsx"
import type { SlDialog, SlTextarea } from "@shoelace-style/shoelace"
import { analytics } from "@src/services/analytics/index.js"
import { query } from "@inlang/core/query"
import { showToast } from "@src/components/Toast.jsx"
import { clickOutside } from "@src/directives/clickOutside.js"
import { InlineNotification } from "@src/components/notification/InlineNotification.jsx"
import MaterialSymbolsCommitRounded from "~icons/material-symbols/commit-rounded"
import MaterialSymbolsTranslateRounded from "~icons/material-symbols/translate-rounded"
import { onMachineTranslate } from "./PatternEditor.telefunc.js"
import { Shortcut } from "./Shortcut.jsx"
import { Notification, NotificationHint } from "./NotificationHint.jsx"

/**
 * The pattern editor is a component that allows the user to edit the pattern of a message.
 */
export function PatternEditor(props: {
	referenceLanguage: ast.Resource["languageTag"]["name"]
	language: ast.Resource["languageTag"]["name"]
	id: ast.Message["id"]["name"]
	referenceMessage?: ast.Message
	message: ast.Message | undefined
}) {
	const [localStorage, setLocalStorage] = useLocalStorage()
	const { resources, setResources, referenceResource, userIsCollaborator, routeParams } =
		useEditorState()

	const [showMachineLearningWarningDialog, setShowMachineLearningWarningDialog] =
		createSignal(false)

	let machineLearningWarningDialog: SlDialog | undefined

	/** throw if unimplemented features are used  */
	createEffect(() => {
		if (
			(props.message && props.message?.pattern.elements.length > 1) ||
			(props.message && props.message?.pattern.elements[0].type !== "Text")
		) {
			throw Error(
				"Not implemented. Only messages with one pattern element of type Text are supported for now.",
			)
		}
		// if the message is updated externally, update the text value
		else if (props.message) {
			setTextValue(props.message.pattern.elements[0].value)
		}
	})

	/** whether the pattern is focused */
	const [isFocused, setIsFocused] = createSignal(false)

	/** the value of the pattern */
	const [textValue, setTextValue] = createSignal(
		// eslint-disable-next-line solid/reactivity
		(props.message?.pattern.elements[0] as ast.Text | undefined)?.value,
	)

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

	const hasChanges = () =>
		(props.message?.pattern.elements[0] as ast.Text | undefined)?.value !== textValue() &&
		textValue() !== ""

	/**
	 * Saves the changes of the message.
	 */
	const handleCommit = () => {
		analytics.capture("commit changes", {
			targetLanguage: props.language,
			owner: routeParams().owner,
			repository: routeParams().repository,
		})
		const _copy = copy()
		const _textValue = textValue()
		if (_textValue === undefined) {
			return
		}
		;(_copy?.pattern.elements[0] as ast.Text).value = _textValue
		try {
			const updatedResource = query(resource()).upsert({ message: _copy! }).unwrap()
			setResources([
				...resources.filter(
					(_resource) => _resource.languageTag.name !== resource().languageTag.name,
				),
				updatedResource,
			])
			showToast({
				variant: "info",
				title: "The change has been committed.",
				message: `Don't forget to push the changes.`,
			})
		} catch (e) {
			showToast({
				variant: "danger",
				title: "Error",
				message: (e as Error).message,
			})
			throw e
		}
	}

	const [machineTranslationIsLoading, setMachineTranslationIsLoading] = createSignal(false)

	const handleMachineTranslate = async () => {
		analytics.capture("create machine translation", {
			targetLanguage: props.language,
			owner: routeParams().owner,
			repository: routeParams().repository,
		})
		if (props.referenceMessage === undefined) {
			return showToast({
				variant: "info",
				title: "Can't translate if the reference message does not exist.",
			})
		}
		const text = props.referenceMessage.pattern.elements[0].value
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
		const result = await onMachineTranslate({
			referenceLanguage: referenceResource()!.languageTag.name,
			targetLanguage: props.language,
			text,
		})
		if (result.error) {
			showToast({
				variant: "warning",
				title: "Machine translation failed.",
				message: result.error,
			})
		} else {
			setTextValue(result.data)
		}
		setMachineTranslationIsLoading(false)
	}

	const getNotificationHints = () => {
		const notifications: Array<Notification> = []
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
				notificationType: "info",
			})
		}
		if (textValue() === "") {
			notifications.push({
				notificationTitle: "Empty:",
				notificationDescription: "The translation has not been made.",
				notificationType: "info",
			})
		}
		return notifications
	}

	let textArea: SlTextarea
	const handleFocus = () => {
		setIsFocused(true)
		textArea?.focus()
	}

	return (
		// outer element is needed for clickOutside directive
		// to close the action bar when clicking outside
		<div
			ref={(element) => [
				clickOutside(
					element,
					// only close the action bar if no outstanding changes exist
					// eslint-disable-next-line solid/reactivity
					() => hasChanges() === false && setIsFocused(false),
				),
			]}
			onClick={() => {
				handleFocus()
			}}
			class="flex justify-start items-start w-full gap-5 px-4 py-1.5 bg-background border first:mt-0 -mt-[1px] border-surface-3 hover:bg-[#FAFAFB] hover:bg-opacity-75 focus-within:relative focus-within:z-20 focus-within:border-primary focus-within:ring-[3px] focus-within:ring-hover-primary/50"
		>
			<div class="flex justify-start items-start gap-2 py-[5px]">
				<div class="flex justify-start items-center flex-grow-0 flex-shrink-0 w-[72px] gap-2 py-0">
					<div class="flex justify-start items-start flex-grow-0 flex-shrink-0 relative gap-2">
						<p class="flex-grow-0 flex-shrink-0 text-[13px] font-medium text-left text-on-surface-variant">
							{props.language}
						</p>
					</div>
					{props.referenceLanguage === props.language && (
						<div class="flex justify-center items-center flex-grow-0 flex-shrink-0 w-[25px] relative gap-2 py-[3px] rounded-sm bg-on-surface-variant">
							<p class="flex-grow-0 flex-shrink-0 text-xs font-medium text-left text-background">
								ref
							</p>
						</div>
					)}
				</div>
				{/* TODO: #169 use proper text editor instead of input element */}
			</div>
			<sl-textarea
				ref={textArea}
				class="grow"
				prop:resize="auto"
				prop:size="small"
				prop:rows={1}
				prop:placeholder="Enter translation ..."
				onFocus={() => setIsFocused(true)}
				onFocusOut={(e) => {
					if ((e.relatedTarget as Element)?.tagName !== "SL-BUTTON") {
						setIsFocused(false)
					}
				}}
				prop:value={textValue() ?? ""}
				onInput={(e) => setTextValue(e.currentTarget.value ?? undefined)}
			/>
			{/* <div
					onFocus={() => setIsFocused(true)}
					onInput={(e) => setTextValue(e.currentTarget.textContent ?? undefined)}
					contentEditable={true}
					class="rounded border border-outline focus:outline-none py-2 px-3 focus:border-primary focus:ring focus:ring-primary-container"
			>
					<For each={copy()?.pattern.elements}>
							{(element) => <PatternElement element={element}></PatternElement>}
					</For>
			</div> */}
			{/* action bar */}
			<div class="w-[164px] h-8 flex justify-end items-center gap-2">
				<Show when={isFocused()}>
					<div class="flex items-center justify-end gap-2">
						<Show when={textValue() === ""}>
							<sl-button
								onClick={handleMachineTranslate}
								prop:disabled={true}
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
						<Show when={hasChanges()}>
							<sl-button
								prop:variant="primary"
								prop:size="small"
								prop:disabled={hasChanges() === false || userIsCollaborator() === false}
								onClick={() => {
									handleCommit()
								}}
							>
								<MaterialSymbolsCommitRounded slot="prefix" />
								{/* <Shortcut slot="suffix" color="primary" codes={["ControlLeft", "Enter"]} /> */}
								Commit
							</sl-button>
						</Show>
					</div>
				</Show>
				<Show when={!isFocused() && hasChanges()}>
					<div class="bg-hover-primary w-2 h-2 rounded-full" />
				</Show>
				{getNotificationHints().length !== 0 && (
					<NotificationHint notifications={getNotificationHints()} />
				)}
				{/* <Show when={showMachineLearningWarningDialog()}>
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
				</Show> */}
			</div>
		</div>
	)
}
