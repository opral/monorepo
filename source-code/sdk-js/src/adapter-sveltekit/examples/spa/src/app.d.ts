// See https://kit.svelte.dev/docs/types#app

// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			i18n: {
				language: string
				i: import("@inlang/sdk-js/runtime").InlangFunction
			}
		}
		// interface PageData {}
		// interface Platform {}
	}
}

export {}
