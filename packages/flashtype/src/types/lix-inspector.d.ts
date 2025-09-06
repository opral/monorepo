declare module "@lix-js/inspector" {
	import type { Lix } from "@lix-js/sdk";
	export function initLixInspector(args: {
		lix: Lix;
		hideWelcomeMessage?: boolean;
		show?: boolean;
	}): Promise<void>;
	export function toggleLixInspector(show?: boolean): void;
}
