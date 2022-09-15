/**
 * Typesafety for Svelte's VSCode extension.
 *
 * Every web component is manually added to the namespace of Svelte as regular HTML
 * element.
 */
declare namespace svelte.JSX {
	interface IntrinsicElements {
		"simple-greeting": {
			name: number;
		};
	}
}

type ParametersOf<T> = Omit<T, keyof import("lit").LitElement | "render">;
