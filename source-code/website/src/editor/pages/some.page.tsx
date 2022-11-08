import * as checkbox from "@zag-js/checkbox";
import { normalizeProps, useMachine } from "@zag-js/solid";
import { createMemo, createUniqueId } from "solid-js";

export function Page() {
	const [state, send] = useMachine(checkbox.machine({ id: createUniqueId() }));

	const api = createMemo(() => checkbox.connect(state, send, normalizeProps));

	return (
		<label {...api().rootProps}>
			<span {...api().labelProps}>
				Input is {api().isChecked ? "checked" : "unchecked"}
			</span>
			<input {...api().inputProps} />
			<div {...api().controlProps} />
		</label>
	);
}
