import { showToast } from "@src/components/Toast.jsx"
import { Accessor, createSignal } from "solid-js"
import copy from "clipboard-copy"

export function BadgeGenerator() {
	const [textValue, setTextValue] = createSignal<string>("")

	const getBadge = (url: string) => {
		const repo = url.split("github.com/")[1]
		console.log(repo)
		if (repo) {
			return `[![translation badge](https://inlang.com/badge?url=github.com/${repo})](https://inlang.com/editor/github.com/${repo}?ref=badge)`
		} else {
			showToast({ variant: "danger", title: "The repository url was not correct", duration: 3000 })
			return url
		}
	}

	return (
		<div class="flex gap-2">
			<div class="grow">
				<Input
					placeholder="Enter Repository url..."
					textValue={textValue}
					setTextValue={setTextValue}
				/>
			</div>
			<button
				onClick={() => {
					copy(getBadge(textValue())),
						showToast({ variant: "success", title: "Copied badge to clipboard", duration: 3000 })
				}}
				class="flex items-center h-[38] px-4 bg-primary text-background rounded cursor-pointer hover:bg-hover-primary"
			>
				Generate Badge
			</button>
		</div>
	)
}

interface InputProps {
	placeholder: string
	textValue: Accessor<string>
	setTextValue: (value: string) => void
}

const Input = (props: InputProps) => {
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
				prop:size={"medium"}
				prop:value={props.textValue()}
				onInput={(e) => props.setTextValue(e.currentTarget.value)}
			/>
		</div>
	)
}
