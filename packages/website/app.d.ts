import "solid-js";

// types for web components
// see https://github.com/solidjs/solid/issues/616#issuecomment-1144074821
declare module "solid-js" {
	namespace JSX {
		type ElementProps<T> = {
			// Add both the element's prefixed properties and the attributes
			[K in keyof T]: Props<T[K]> & HTMLAttributes<T[K]>;
		};
		// Prefixes all properties with `prop:` to match Solid's property setting syntax
		type Props<T> = {
			[K in keyof T as `prop:${string & K}`]?: T[K];
		};
		interface IntrinsicElements extends ElementProps<HTMLElementTagNameMap> {
			// TODO remove once https://github.com/shoelace-style/shoelace/pull/1007 is released
			"sl-dropdown": any;
			"sl-button": any;
			"sl-menu-item": any;
			"sl-menu": any;
		}
	}
}
