import { LitElement } from "lit";

/**
 * Disables the shadow root of Lit elements and therefore
 * allows the embedding application to pass down global styles.
 *
 * In other words, the parent application can import the classes generated
 * by the element and pass it to its own tailwind config. No duplicate
 * classes will be send to the user e.g. the app uses the class `w-10` and so does a
 * component use the class `w-10`.
 */
export class LitElementWithTailwindCss extends LitElement {
	protected createRenderRoot() {
		return this;
	}
}
