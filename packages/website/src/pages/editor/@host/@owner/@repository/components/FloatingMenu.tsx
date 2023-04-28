import type * as ast from "@inlang/core/ast"
import { For } from "solid-js"

export const FloatingMenu = (props: { variableReferences: ast.VariableReference[] }) => {
	return (
		<div class="test py-2 bg-background flex gap-x-2 gap-y-1 items-center border border-outline rounded-md px-2 shadow-md pointer-events-none flex-wrap">
			<For each={props.variableReferences}>
				{(variableReference) => (
					<div class="h-6 px-1 py-2 bg-primary/10 hover:bg-primary/20 flex flex-col justify-center rounded text-on-primary-container hover:text-on-background cursor-pointer pointer-events-auto">
						{variableReference.name}
					</div>
				)}
			</For>
		</div>
	)
}
