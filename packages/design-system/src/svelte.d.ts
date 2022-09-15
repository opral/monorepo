/**
 * Typesafety for Svelte's VSCode extension.
 *
 * Every web component is manually added to the namespace of Svelte as regular HTML
 * element.
 *
 * The Svelte VSCode extension needs to be up to date. See https://github.com/sveltejs/language-tools/issues/1352#issuecomment-1248415399.
 */
declare namespace svelteHTML {
	interface IntrinsicElements {
		"in-button": ParametersOf<import("./components/button.js").Button>;
	}
}

// duplicate of ./comonents/types/parameterOf.ts
// exists because imports of namespace declarations
// are tricky.
type ParametersOf<Component> = Omit<
	Component,
	// omit lit element properties and the render function
	keyof import("lit").LitElement | "render"
>;
