import type * as ast from "@inlang/core/ast";
import { createSignal, For, JSXElement, Match, Show, Switch } from "solid-js";
import { inlangConfig } from "./state.js";
import IconSave from "~icons/material-symbols/save-outline-rounded";

export function Messages(props: {
	referenceBundleId: ast.Bundle["id"]["name"];
	messages: Record<ast.Bundle["id"]["name"], ast.Message | undefined>;
}) {
	const referenceMessage = () => props.messages[props.referenceBundleId]!;

	return (
		<sl-details>
			<h3 slot="summary" class="font-medium">
				{referenceMessage().id.name}
			</h3>
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
										pattern={props.messages[bundleId]?.pattern}
									></PatternEditor>
								</div>
							</div>
						)}
					</For>
				</div>
			</div>
		</sl-details>
	);
}

function PatternEditor(props: { pattern: ast.Pattern | undefined }) {
	const [isFocused, setIsFocused] = createSignal(false);

	return (
		<>
			<div
				contentEditable={true}
				class="rounded border border-outline focus:outline-none py-2 px-3 focus:border-primary focus:ring focus:ring-primary-container"
				onFocus={() => setIsFocused(true)}
				onBlur={() => setIsFocused(false)}
			>
				<For each={props.pattern?.elements}>
					{(element) => <PatternElement element={element}></PatternElement>}
				</For>
			</div>
			{/* action bar */}
			<Show when={isFocused()}>
				<div class="flex items-center justify-end mt-2">
					<sl-button>
						<IconSave slot="prefix"></IconSave>
						Save
					</sl-button>
				</div>
			</Show>
		</>
	);
}

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
									{/* recursive */}
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
