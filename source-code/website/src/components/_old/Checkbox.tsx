import * as checkbox from "@zag-js/checkbox"
import { normalizeProps, useMachine } from "@zag-js/solid"
import { createMemo, createUniqueId, JSXElement, Show } from "solid-js"
import IconClose from "~icons/material-symbols/close-rounded"

/**
 * @example
 *  <Checkbox>select me</Checkbox>
 */
export function Checkbox(
	// picking the props that are supported for now.
	props: Pick<checkbox.Context, "defaultChecked" | "onChange"> & {
		children: JSXElement
	},
) {
	const [state, send] = useMachine(checkbox.machine({ id: createUniqueId(), ...props }))
	const api = createMemo(() => checkbox.connect(state, send, normalizeProps))
	return (
		<>
			<label class="flex gap-1 items-center" {...api().rootProps}>
				<div
					class="rounded w-4 h-4 border"
					classList={{
						[`bg-tertiary border-tertiary`]: api().isChecked,
						[`border-outline`]: api().isChecked === false,
					}}
					{...api().controlProps}
				>
					<Show when={api().isChecked}>
						<IconClose />
					</Show>
				</div>
				<span {...api().labelProps}>{props.children}</span>
				{/* input is hidden and only exists for accessibility purposes */}
				<input {...api().inputProps} class="" />
			</label>
		</>
	)
}
