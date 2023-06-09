import { createEffect } from "solid-js"
import { createSignal } from "solid-js"

interface SearchInputProps {
	placeholder: string
	handleChange: (value: string) => void
}

export const SearchInput = (props: SearchInputProps) => {
	const [textValue, setTextValue] = createSignal<string>("")
	createEffect(() => props.handleChange(textValue()))

	return (
		<div>
			<sl-input
				style={{
					padding: "0px",
					border: "none",
					"--tw-ring-color": "#06B6D4",
					"border-radius": "4px",
				}}
				prop:placeholder={props.placeholder}
				prop:filled={true}
				prop:size={"small"}
				prop:value={textValue()}
				onInput={(e) => setTextValue(e.currentTarget.value)}
			>
				<div slot={"suffix"}>
					<SearchIcon />
				</div>
			</sl-input>
		</div>
	)
}

export const SearchIcon = () => {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
			<path
				fill="currentColor"
				fill-rule="evenodd"
				d="M9.244 5.123a4.12 4.12 0 100 8.24 4.12 4.12 0 000-8.24zM4 9.243a5.244 5.244 0 119.328 3.29l2.493 2.494a.56.56 0 01-.611.924.562.562 0 01-.183-.13l-2.494-2.493A5.243 5.243 0 014 9.244z"
				clip-rule="evenodd"
			/>
		</svg>
	)
}
