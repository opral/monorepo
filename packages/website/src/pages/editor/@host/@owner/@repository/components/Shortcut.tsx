import { For } from "solid-js"

interface ShortcutProps {
	slot: string
	codes: Array<KeyboardEvent["code"]>
	color: "primary" | "default"
}

export const Shortcut = (props: ShortcutProps) => {
	return (
		<div
			slot={props.slot}
			class={
				"flex gap-1 border border-outline rounded-full px-2 h-5 items-center " +
				getShortcutStyling(props.color)
			}
		>
			<For each={formatCodes(props.codes)}>
				{(code) => <p class="tracking-tighter text-sm font-normal">{code}</p>}
			</For>
		</div>
	)
}

const getShortcutStyling = (color: "primary" | "default") => {
	switch (color) {
		case "primary":
			return "text-background bg-transparent border-background/20"
		default:
			return "text-on-surface-variant bg-background"
	}
}

const formatCodes = (codes: Array<KeyboardEvent["code"]>) => {
	// eslint-disable-next-line solid/reactivity
	return codes.map((code) => {
		switch (code) {
			case "ControlLeft" || "ControlRight":
				return isMac() ? <CommandIcon /> : "Ctrl"
			case "Enter":
				return <EnterIcon />
			default:
				return code.toUpperCase()
		}
	})
}

const isMac = () => {
	return navigator.platform.toLowerCase().includes("mac")
}

const CommandIcon = () => {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 10 10">
			<path
				fill="currentColor"
				d="M1.944 10C1.407 10 .95 9.81.57 9.43.19 9.05 0 8.594 0 8.057c0-.537.19-.996.57-1.375.38-.38.837-.57 1.374-.57h.834V3.89h-.834c-.537 0-.995-.19-1.375-.57C.19 2.94 0 2.481 0 1.944S.19.95.57.57C.95.19 1.406 0 1.943 0c.537 0 .996.19 1.375.57.38.38.57.837.57 1.374v.834H6.11v-.834c0-.537.19-.995.57-1.375C7.06.19 7.519 0 8.056 0S9.05.19 9.43.57c.38.38.569.837.569 1.374 0 .537-.19.996-.57 1.375-.38.38-.837.57-1.374.57h-.834V6.11h.834c.537 0 .995.19 1.375.57.38.38.569.838.569 1.375s-.19.995-.57 1.375c-.38.38-.837.569-1.374.569-.537 0-.996-.19-1.375-.57-.38-.38-.57-.837-.57-1.374v-.834H3.89v.834c0 .537-.19.995-.57 1.375-.38.38-.838.569-1.375.569zm0-1.111a.802.802 0 00.59-.243.802.802 0 00.244-.59v-.834h-.834a.802.802 0 00-.59.244.802.802 0 00-.243.59c0 .231.081.428.243.59a.802.802 0 00.59.243zm6.112 0a.802.802 0 00.59-.243.802.802 0 00.243-.59.802.802 0 00-.243-.59.802.802 0 00-.59-.244h-.834v.834c0 .231.081.428.244.59a.802.802 0 00.59.243zM3.889 6.11H6.11V3.89H3.89V6.11zM1.944 2.778h.834v-.834a.802.802 0 00-.244-.59.802.802 0 00-.59-.243.802.802 0 00-.59.243.802.802 0 00-.243.59c0 .232.081.429.243.59a.802.802 0 00.59.244zm5.278 0h.834a.802.802 0 00.59-.244.802.802 0 00.243-.59.802.802 0 00-.243-.59.802.802 0 00-.59-.243.802.802 0 00-.59.243.802.802 0 00-.244.59v.834z"
			/>
		</svg>
	)
}

const EnterIcon = () => {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 10 10">
			<path
				fill="currentColor"
				d="M7.63 0a.526.526 0 00-.527.526V6.84a.526.526 0 01-.526.526H3.636l.684-.679a.528.528 0 10-.747-.747L1.994 7.52a.526.526 0 00-.11.173.526.526 0 000 .4.526.526 0 00.11.174l1.579 1.578a.526.526 0 00.862-.17.526.526 0 00-.115-.577l-.684-.679h2.941A1.579 1.579 0 008.156 6.84V.526A.526.526 0 007.629 0z"
			/>
		</svg>
	)
}
