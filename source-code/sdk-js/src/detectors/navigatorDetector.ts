import type { Language } from "./sharedTypes.js"

type ObjectWithNavigatorLanguages = {
	navigator: { languages: readonly Language[] }
}

type NavigatorDetector = ({ window }: { window: ObjectWithNavigatorLanguages }) => Language[]

export const navigatorDetector = (({ window }) => [
	...window.navigator.languages,
]) satisfies NavigatorDetector
