import { createEffect, createSignal, For, Show } from "solid-js"
import { useEditorState } from "./State.jsx"
import { createVisibilityObserver } from "@solid-primitives/intersection-observer"
import { PatternEditor } from "./components/PatternEditor.jsx"
import { showFilteredMessage } from "./helper/showFilteredMessage.js"
import IconCopy from "~icons/material-symbols/content-copy-outline"
import copy from "clipboard-copy"
import { showToast } from "@src/components/Toast.jsx"
import type { Message as MessageType } from "@inlang/app"

export function Message(props: {
	message: MessageType
}) {
	const {
		inlang,
		sourceLanguageTag,
		filteredLanguageTags,
		textSearch,
		filteredId,
		filteredLintRules,
	} = useEditorState()
	const sourceMessage = () => {
		return props.message.body[sourceLanguageTag()!]
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
		<div
			ref={patternListElement}
			class="group"
			// Classlist "hidden" is a performance optimization to only render visible elements.
			//
			// Using a <Show> would re-trigger the render of all pattern and
			// web components. See https://github.com/inlang/inlang/pull/555
			classList={{
				["hidden"]:
					showFilteredMessage(
						props.message,
						filteredLanguageTags(),
						textSearch(),
						filteredLintRules(),
						filteredId(),
					) === undefined,
			}}
		>
			<div class="flex gap-2 items-center self-stretch flex-grow-0 flex-shrink-0 h-11 relative px-4 bg-surface-2 border-x border-b-0 border-surface-2">
				<h3
					slot="summary"
					class="flex-grow-0 flex-shrink-0 text-[13px] font-medium text-left text-on-surface before:text-on-surface"
				>
					{props.message.id}
				</h3>
				<div
					onClick={() => {
						copy(
							document.location.protocol +
								"//" +
								document.location.host +
								document.location.pathname +
								"?id=" +
								props.message.id,
						),
							showToast({ variant: "success", title: "Copy to clipboard", duration: 3000 })
					}}
					class="opacity-0 transition-all group-hover:opacity-100 text-info/70 h-7 w-7 text-sm rounded flex items-center justify-center hover:bg-on-background/10 hover:text-info cursor-pointer"
				>
					<IconCopy />
				</div>
			</div>
			<div>
				<For each={inlang()?.config().languageTags}>
					{(languageTag) => {
						return (
							<>
								<Show
									when={
										(filteredLanguageTags().includes(languageTag) ||
											filteredLanguageTags().length === 0) &&
										// only render if visible or has been rendered before
										(elementIsVisible() || hasBeenRendered())
									}
								>
									<PatternEditor
										sourceLanguageTag={inlang()?.config()?.sourceLanguageTag}
										languageTag={languageTag}
										id={props.message.id}
										sourceMessage={sourceMessage()}
										variant={props.message["body"][languageTag] ? props.message["body"][languageTag]![0] : undefined}
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
