import { onCleanup } from "solid-js";

/**
 * A directive that calls the given function when the element is clicked outside of.
 *
 * @example
 * 	<div ref={(element) => handleClickOutside(element, () => // do something)}>
 */
export function clickOutside(element: HTMLElement, callback: () => void) {
  const onClick = (event: MouseEvent) => {
    if (element.contains(event.target as Node) === false) {
      callback();
    }
  };
  document.body.addEventListener("click", onClick);
  onCleanup(() => document.body.removeEventListener("click", onClick));
}
