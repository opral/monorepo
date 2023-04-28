import type * as ast from "@inlang/core/ast"
import { For } from "solid-js"

export const FloatingMenu = (props: { variableReferences: ast.VariableReference[] }) => {
	return (
		<div class="test">
			<For each={props.variableReferences}>
				{(variableReference) => <div>{variableReference.name}</div>}
			</For>
		</div>
	)
}
