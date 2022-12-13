import type * as ast from "@inlang/core/ast";
import { createSignal, For, JSXElement, Match, Show, Switch } from "solid-js";
import { bundles, inlangConfig, setBundles } from "@src/pages/editor/state.js";
import MaterialSymbolsCommitRounded from "~icons/material-symbols/commit-rounded";
import { query } from "@inlang/core/query";
import { clickOutside } from "@src/directives/clickOutside.js";
import { showToast } from "@src/components/Toast.jsx";

export function Messages(props: {
	referenceBundleId: ast.Bundle["id"]["name"];
	messages: Record<ast.Bundle["id"]["name"], ast.Message | undefined>;
}) {
	const [isOpen, setIsOpen] = createSignal(false);
	const referenceMessage = () => props.messages[props.referenceBundleId]!;
	return (
		<sl-details
			on:sl-show={() => setIsOpen(true)}
			on:sl-after-hide={() => setIsOpen(false)}
		>
			<h3 slot="summary" class="font-medium">
				{referenceMessage().id.name}
			</h3>
			<Show when={isOpen()}>
				<div class="grid grid-cols-5 gap-2">
					<p class="text-secondary italic">
						TODO: additional information would appear here
					</p>
					<div class="grid gap-2 col-span-4">
						<For each={inlangConfig()?.bundleIds}>
							{(bundleId) => (
								<div class="grid grid-cols-4 gap-4">
									<p class="flex justify-end pt-2">
										<Show
											when={bundleId === props.referenceBundleId}
											fallback={bundleId}
										>
											<sl-tooltip class="hidden md:block">
												<p slot="content">
													The reference message acts as source of truth for the
													other messages.
												</p>
												<span class="mr-1.5 text-secondary underline decoration-dotted underline-offset-2 text-sm hover:cursor-pointer">
													Reference:
												</span>
											</sl-tooltip>
											{bundleId}
										</Show>
									</p>
									<div class="col-span-3">
										<PatternEditor
											bundleId={bundleId}
											referenceMessage={referenceMessage()}
											message={props.messages[bundleId]}
										></PatternEditor>
									</div>
								</div>
							)}
						</For>
					</div>
				</div>
			</Show>
		</sl-details>
	);
}

function PatternEditor(props: {
	bundleId: ast.Bundle["id"]["name"];
	referenceMessage: ast.Message;
	message: ast.Message | undefined;
}) {
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

	/** the bundle the message belongs to */
	const bundle = () =>
		bundles.find((bundle) => bundle.id.name === props.bundleId)!;

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
			></sl-input>
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
				<div class="flex items-center justify-end mt-2">
					<sl-button
						prop:variant="primary"
						prop:disabled={hasChanges() === false}
						onClick={() => {
							const _copy = copy();
							const _textValue = textValue();
							if (_textValue === undefined) {
								return;
							}
							(_copy?.pattern.elements[0] as ast.Text).value = _textValue;
							try {
								const newBundle = query(bundle())
									// TODO: remove hardcoded resource id
									.upsert({ message: _copy!, resourceId: "default" })
									.unwrap();
								setBundles(
									bundles
										.filter((bundle) => bundle.id.name !== props.bundleId)
										.concat([newBundle])
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
						}}
					>
						<MaterialSymbolsCommitRounded slot="prefix"></MaterialSymbolsCommitRounded>
						Commit
					</sl-button>
				</div>
			</Show>
		</div>
	);
}

/** will probably be replaced with #164 */
function PatternElement(props: { element: ast.Text | ast.Placeholder }) {
	/** Switch fallback error (non-exhaustive switch statement) */
	const Error = (props: { code: string }) => (
		<span class="text-danger">
			You encountered a bug. please file the bug and mention code {props.code}
		</span>
	);

	/** visually differentiate between text and placeholder elements */
	const Placeholder = (props: { children: JSXElement }) => (
		<code class="bg-tertiary-container rounded text-on-tertiary-container font-medium">
			{props.children}
		</code>
	);

	return (
		<Switch fallback={<Error code="2903ns"></Error>}>
			<Match when={props.element.type === "Text"}>
				<span>{(props.element as ast.Text).value}</span>
			</Match>
			<Match when={props.element.type === "Placeholder"}>
				<Switch fallback={<Error code="2203sfss"></Error>}>
					{(() => {
						// defining a variable to avoid type assertions and lengthier code
						const expression = (props.element as ast.Placeholder).expression;
						return (
							<>
								<Match when={expression.type === "Literal"}>
									<Placeholder>{(expression as ast.Literal).value}</Placeholder>
								</Match>
								<Match when={expression.type === "Function"}>
									<Placeholder>
										{(expression as ast.Function).id.name}
									</Placeholder>
								</Match>
								<Match when={expression.type === "Variable"}>
									<Placeholder>
										{(expression as ast.Variable).id.name}
									</Placeholder>
								</Match>
								<Match when={expression.type === "Placeholder"}>
									{/* recursively call pattern element */}
									<PatternElement element={props.element}></PatternElement>
								</Match>
							</>
						);
					})()}
				</Switch>
			</Match>
		</Switch>
	);
}
