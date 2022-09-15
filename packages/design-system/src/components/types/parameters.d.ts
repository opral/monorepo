/**
 * Parameters and functions of a web-component.
 *
 * The type omits generic LitElement functions like `renderOption` and 300
 * others.
 */
export type ParametersOf<WebComponent> = Omit<
	WebComponent,
	keyof import("lit").LitElement | "render"
>;
