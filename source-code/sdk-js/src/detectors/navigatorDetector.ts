import type { Language } from "./sharedTypes.js"

type NavigatorDetector = ({ window }: { window: Window }) => Language[]

export const navigatorDetector = (({ window }) => [
	...window.navigator.languages,
]) satisfies NavigatorDetector
