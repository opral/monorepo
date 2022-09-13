/**
 * Typesafety for Svelte's VSCode extension.
 *
 * Every web component is manually added to the namespace of Svelte as regular HTML
 * element.
 */
declare namespace svelte.JSX {
	interface IntrinsicElements {
		"simple-greeting": Parameter<import("../src/index.js").SimpleGreeting>;
	}
}

/**
 * Parameters and functions of a web-component.
 *
 * The type omits generic LitElement functions like `renderOption` and 300
 * others.
 */
type Parameter<T> = Omit<T, keyof import("lit").LitElement | "render">;
