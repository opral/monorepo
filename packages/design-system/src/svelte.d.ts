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
		"in-button": PropertiesOf<import("./components/button/index.js").Button>;
	}
}

// utility to get rid of ugly double import
type PropertiesOf = import("./components/types/propertiesOf.js").PropertiesOf;
