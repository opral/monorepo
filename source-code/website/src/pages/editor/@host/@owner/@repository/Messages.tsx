import type * as ast from "@inlang/core/ast"
import { createEffect, createSignal, For, Show } from "solid-js"
import { useEditorState } from "./State.jsx"
import { createVisibilityObserver } from "@solid-primitives/intersection-observer"
import { PatternEditor } from "./components/PatternEditor.jsx"

export function Messages(props: {
	messages: Record<ast.Resource["languageTag"]["name"], ast.Message | undefined>
}) {
	const { inlangConfig, filteredLanguages } = useEditorState()
	const referenceMessage = () => {
		return props.messages[inlangConfig()!.referenceLanguage]
	}

	/**
	 * The id of the message.
	 *
	 * If the reference language is not defined, the first message id is used.
	 */
	const id: () => ast.Message["id"]["name"] = () => {
		if (referenceMessage()) {
			return referenceMessage()!.id.name
		}
		for (const message of Object.values(props.messages)) {
			if (message?.id.name !== undefined) {
				return message.id.name
			}
		}
		throw Error("No message id found")
	}

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

	return (
		<div class="border border-outline p-4 rounded flex flex-col gap-4">
			<h3 slot="summary" class="font-medium">
				{id()}
			</h3>
			<div ref={patternListElement} class="flex flex-col gap-4">
				<For each={inlangConfig()?.languages}>
					{(language) => (
						<Show
							when={
								filteredLanguages().includes(language) &&
								// only render if visible or has been rendered before
								(elementIsVisible() || hasBeenRendered())
							}
						>
							<PatternEditor
								language={language}
								id={id()}
								referenceMessage={referenceMessage()}
								message={props.messages[language]}
							/>
						</Show>
					)}
				</For>
			</div>
		</div>
	)
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
