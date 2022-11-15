import "solid-js";
import type { SlButton } from "@shoelace-style/shoelace";

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
		interface IntrinsicElements extends ElementProps<HTMLElementTagNameMap> {}
	}
}
