import type * as ast from "@inlang/core/ast"
import { createEffect, createSignal, For, Show } from "solid-js"
import { useEditorState } from "./State.jsx"
import { createVisibilityObserver } from "@solid-primitives/intersection-observer"
import { PatternEditor } from "./components/PatternEditor.jsx"
import { getLintReports, LintedMessage } from "@inlang/core/lint"

export function Messages(props: {
	messages: Record<ast.Resource["languageTag"]["name"], LintedMessage | undefined>
}) {
	const { inlangConfig, referenceLanguage, filteredLanguages, textSearch, filteredLintRules } =
		useEditorState()
	// const [matchedLints, setMachtedLints] = createSignal<boolean>(false)
	const referenceMessage = () => {
		return props.messages[referenceLanguage()!]
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

	const matchedLints = (message?: LintedMessage) => {
		if (message === undefined) {
			return false
		}
		const reports = getLintReports(message)
		for (const report of reports) {
			if (
				filteredLintRules().includes(report.id) &&
				// catch all missingMessage reports
				(!report.id.includes("missingMessage") ||
					report.message.match(
						/The pattern contains only only one element which is an empty string\./i,
					) ||
					report.message.match(/Empty pattern (length 0)\./i) ||
					//@ts-ignore
					filteredLanguages().includes(report.message.match(/'([^']+)'/g)![1]?.replace(/'/g, "")) ||
					// fallback for older versions
					report.message.match(/Message with id '([A-Za-z0-9]+(\.[A-Za-z0-9]+)+)' is missing\./i))
			) {
				return true
			}
		}
		return false
	}

	const matchedTextSearch = (message?: LintedMessage) => {
		if (message === undefined) {
			return false
		}
		return (
			textSearch().length > 0 &&
			(id().toLowerCase().includes(textSearch().toLowerCase()) ||
				JSON.stringify(message).toLowerCase().includes(textSearch().toLowerCase()))
		)
	}

	const noFilterSelected = () => filteredLintRules().length === 0 && textSearch().length === 0

	/**
	 * Whether any message should be rendered.
	 */
	const shouldShow = (message?: LintedMessage) =>
		noFilterSelected() || matchedLints(message) || matchedTextSearch(message)

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
		<div
			ref={patternListElement}
			class="group"
			// Classlist "hidden" is a performance optimization to only render visible elements.
			//
			// Using a <Show> would re-trigger the render of all pattern and
			// web components. See https://github.com/inlang/inlang/pull/555
			classList={{
				["hidden"]: Object.values(props.messages).every((message) => shouldShow(message) === false),
			}}
		>
			<div class="flex justify-between items-center self-stretch flex-grow-0 flex-shrink-0 h-11 relative px-4 bg-surface-2 border-x border-b-0 border-surface-2">
				<h3
					slot="summary"
					class="flex-grow-0 flex-shrink-0 text-[13px] font-medium text-left text-on-surface before:content-['#'] before:text-on-surface"
				>
					{id()}
				</h3>
			</div>
			<div>
				<For each={inlangConfig()?.languages}>
					{(language) => (
						<>
							<Show
								when={
									(filteredLanguages().includes(language) || filteredLanguages().length === 0) &&
									// only render if visible or has been rendered before
									(elementIsVisible() || hasBeenRendered())
								}
							>
								<PatternEditor
									referenceLanguage={inlangConfig()!.referenceLanguage}
									language={language}
									id={id()}
									referenceMessage={referenceMessage()}
									message={props.messages[language]}
								/>
							</Show>
						</>
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
