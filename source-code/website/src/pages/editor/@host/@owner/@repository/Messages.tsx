import type * as ast from "@inlang/core/ast";
import { createEffect, createSignal, For, Show } from "solid-js";
import {
	resources,
	inlangConfig,
	setResources,
	referenceResource,
} from "./state.js";
import MaterialSymbolsCommitRounded from "~icons/material-symbols/commit-rounded";
import { query } from "@inlang/core/query";
import { clickOutside } from "@src/directives/clickOutside.js";
import { showToast } from "@src/components/Toast.jsx";
import { useLocalStorage } from "@src/services/local-storage/LocalStorageProvider.jsx";
import { InlineNotification } from "@src/components/notification/InlineNotification.jsx";
import MaterialSymbolsEditOutlineRounded from "~icons/material-symbols/edit-outline-rounded";
import MaterialSymbolsRobotOutline from "~icons/material-symbols/robot-outline";
import { onMachineTranslate } from "./index.telefunc.js";
import type SlDialog from "@shoelace-style/shoelace/dist/components/dialog/dialog.js";
import { Icon } from "@src/components/Icon.jsx";

export function Messages(props: {
	messages: Record<
		ast.Resource["languageTag"]["language"],
		ast.Message | undefined
	>;
}) {
	const referenceMessage = () =>
		props.messages[inlangConfig()!.referenceLanguage]!;

	return (
		<div class="border border-outline p-4 rounded">
			<h3 slot="summary" class="font-medium pb-4">
				{referenceMessage().id.name}
			</h3>
			<div class="grid gap-2 col-span-5">
				<For each={inlangConfig()?.languages}>
					{(language) => (
						<div class="grid grid-cols-4 gap-4">
							<p class="flex justify-start pt-2">
								<Show
									when={language === inlangConfig()!.referenceLanguage}
									fallback={language}
								>
									{language}
									<sl-tooltip class="hidden md:block">
										<p slot="content">
											The reference message acts as source of truth for the
											other messages.
										</p>
										<span class="ml-1.5 text-secondary underline decoration-dotted underline-offset-2 text-sm hover:cursor-pointer">
											Reference
										</span>
									</sl-tooltip>
								</Show>
							</p>
							<div class="col-span-3">
								<PatternEditor
									language={language}
									referenceMessage={referenceMessage()}
									message={props.messages[language]}
								></PatternEditor>
							</div>
						</div>
					)}
				</For>
			</div>
		</div>
	);
}

function PatternEditor(props: {
	language: ast.Resource["languageTag"]["language"];
	referenceMessage: ast.Message;
	message: ast.Message | undefined;
}) {
	const [localStorage, setLocalStorage] = useLocalStorage();

	const [
		showMachineLearningWarningDialog,
		setShowMachineLearningWarningDialog,
	] = createSignal(false);

	let machineLearningWarningDialog: SlDialog | undefined;

	/** throw if unimplemented features are used  */
	if (
		(props.message && props.message?.pattern.elements.length > 1) ||
		(props.message && props.message?.pattern.elements[0].type !== "Text")
	) {
		throw Error(
			"Not implemented. Only messages with one pattern element of type Text are supported for now."
		);
	}

	/** whether the pattern is focused */
	const [isFocused, setIsFocused] = createSignal(false);

	/** the value of the pattern */
	const [textValue, setTextValue] = createSignal(
		(props.message?.pattern.elements[0] as ast.Text | undefined)?.value
	);

	/** the resource the message belongs to */
	const resource = () =>
		resources.find(
			(resource) => resource.languageTag.language === props.language
		)!;

	/** copy of the message to conduct and track changes */
	const copy: () => ast.Message | undefined = () => {
		if (props.message) {
			return JSON.parse(JSON.stringify(props.message));
		}
		// create new message
		else {
			return {
				type: "Message",
				id: {
					type: "Identifier",
					name: props.referenceMessage.id.name,
				},
				pattern: {
					type: "Pattern",
					elements: [{ type: "Text", value: "" }],
				},
			};
		}
	};

	const hasChanges = () =>
		(props.message?.pattern.elements[0] as ast.Text | undefined)?.value !==
		textValue();

	/**
	 * Saves the changes of the message.
	 */
	const handleSave = () => {
		const _copy = copy();
		const _textValue = textValue();
		if (_textValue === undefined) {
			return;
		}
		(_copy?.pattern.elements[0] as ast.Text).value = _textValue;
		try {
			const updatedResource = query(resource())
				.upsert({ message: _copy! })
				.unwrap();
			setResources(
				resources
					.filter(
						(_resource) =>
							_resource.languageTag.language !== resource().languageTag.language
					)
					.concat([updatedResource])
			);
			showToast({
				variant: "info",
				title: "The change has been committed.",
				message: `Don't forget to push the changes.`,
			});
		} catch (e) {
			showToast({
				variant: "danger",
				title: "Error",
				message: (e as Error).message,
			});
			throw e;
		}
	};

	const [machineTranslationIsLoading, setMachineTranslationIsLoading] =
		createSignal(false);

	const handleMachineTranslate = async () => {
		const text = props.referenceMessage.pattern.elements[0].value;
		if (text === undefined) {
			return showToast({
				variant: "info",
				title: "Can't translate empty text",
			});
		} else if (localStorage.showMachineTranslationWarning) {
			setShowMachineLearningWarningDialog(true);
			return machineLearningWarningDialog?.show();
		}
		setMachineTranslationIsLoading(true);
		const result = await onMachineTranslate({
			referenceLanguage: referenceResource()!.languageTag.language,
			targetLanguage: props.language,
			text,
		});
		if (result.error) {
			showToast({
				variant: "warning",
				title: "Machine translation failed.",
				message: result.error,
			});
		} else {
			setTextValue(result.data);
		}
		setMachineTranslationIsLoading(false);
	};

	return (
		// outer element is needed for clickOutside directive
		// to close the action bar when clicking outside
		<div
			ref={(element) => [
				clickOutside(
					element,
					// only close the action bar if no outstanding changes exist
					() => hasChanges() === false && setIsFocused(false)
				),
			]}
		>
			{/* TODO: #169 use proper text editor instead of input element */}
			<sl-input
				class="border-none p-0"
				onFocus={() => setIsFocused(true)}
				prop:value={textValue() ?? ""}
				onInput={(e) => setTextValue(e.currentTarget.value ?? undefined)}
			>
				<MaterialSymbolsEditOutlineRounded
					slot="suffix"
					class="text-outline-variant"
				></MaterialSymbolsEditOutlineRounded>
			</sl-input>
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
			<Show when={isFocused()}>
				<div class="flex items-center justify-end mt-2 gap-2">
					<Show when={hasChanges() && localStorage.user === undefined}>
						<InlineNotification
							title="Sign in"
							message="You must be signed in to commit changes."
							variant="info"
						></InlineNotification>
					</Show>
					<sl-button
						onClick={handleMachineTranslate}
						prop:loading={machineTranslationIsLoading()}
					>
						<MaterialSymbolsRobotOutline slot="prefix"></MaterialSymbolsRobotOutline>
						Machine translate
					</sl-button>
					<sl-button
						prop:variant="primary"
						prop:disabled={
							hasChanges() === false || localStorage.user === undefined
						}
						onClick={handleSave}
					>
						<MaterialSymbolsCommitRounded slot="prefix"></MaterialSymbolsCommitRounded>
						Commit
					</sl-button>
				</div>
			</Show>
			<Show when={showMachineLearningWarningDialog()}>
				<sl-dialog
					prop:label="Machine translations pitfalls"
					ref={machineLearningWarningDialog}
				>
					<ol class="">
						<li>
							1. Machine translations are not always correct. Always check and
							correct the translation as necessary.
						</li>
						<br />
						<li>
							2. Machine translations do not exclude placeholders like "My name
							is{" "}
							<code class="bg-surface-1 py-0.5 px-1 rounded">{"{name}"}</code>
							{'" '}
							yet. Make sure that placeholders between the reference message and
							translations match. For more information read{" "}
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
							setLocalStorage("showMachineTranslationWarning", false);
							machineLearningWarningDialog?.hide();
							handleMachineTranslate();
						}}
					>
						Proceed with machine translating
					</sl-button>
				</sl-dialog>
			</Show>
		</div>
	);
}

/** will probably be replaced with #164 */
// function PatternElement(props: { element: ast.Text | ast.Placeholder }) {
// 	/** Switch fallback error (non-exhaustive switch statement) */
// 	const Error = (props: { code: string }) => (
// 		<span class="text-danger">
// 			You encountered a bug. please file the bug and mention code {props.code}
// 		</span>
// 	);

// 	/** visually differentiate between text and placeholder elements */
// 	const Placeholder = (props: { children: JSXElement }) => (
// 		<code class="bg-tertiary-container rounded text-on-tertiary-container font-medium">
// 			{props.children}
// 		</code>
// 	);

// 	return (
// 		<Switch fallback={<Error code="2903ns"></Error>}>
// 			<Match when={props.element.type === "Text"}>
// 				<span>{(props.element as ast.Text).value}</span>
// 			</Match>
// 			<Match when={props.element.type === "Placeholder"}>
// 				<Switch fallback={<Error code="2203sfss"></Error>}>
// 					{(() => {
// 						// defining a variable to avoid type assertions and lengthier code
// 						const expression = (props.element as ast.Placeholder).expression;
// 						return (
// 							<>
// 								<Match when={expression.type === "Literal"}>
// 									<Placeholder>{(expression as ast.Literal).value}</Placeholder>
// 								</Match>
// 								<Match when={expression.type === "Function"}>
// 									<Placeholder>
// 										{(expression as ast.Function).id.name}
// 									</Placeholder>
// 								</Match>
// 								<Match when={expression.type === "Variable"}>
// 									<Placeholder>
// 										{(expression as ast.Variable).id.name}
// 									</Placeholder>
// 								</Match>
// 								<Match when={expression.type === "Placeholder"}>
// 									{/* recursively call pattern element */}
// 									<PatternElement element={props.element}></PatternElement>
// 								</Match>
// 							</>
// 						);
// 					})()}
// 				</Switch>
// 			</Match>
// 		</Switch>
// 	);
// }
