import { diffWords } from "diff";

export function renderUniversalDiff(args: {
  beforeHtml: string;
  afterHtml: string;
}): string {
  return renderUniversalDiffElement(args).outerHTML;
}

/**
 * Compares two HTML strings (`beforeHtml` and `afterHtml`) and generates an HTMLElement
 * that visually represents the differences.
 *
 * Use this if you want to bypass parsing and DOM creation by
 * directly working with the DOM elements instead of the HTML string
 * output of `renderUniversalDiff()`.
 *
 * @example
 *   renderUniversalDiffElement({
 *     beforeHtml: `<p data-lix-entity-id="abc">Test</p>`,
 *     afterHtml: `<p data-lix-entity-id="abc">Test World</p>`,
 *   });
 *
 */
export function renderUniversalDiffElement(args: {
  beforeHtml: string;
  afterHtml: string;
}): HTMLElement {
  const parser = new DOMParser();
  const beforeDoc = parser.parseFromString(args.beforeHtml, "text/html");
  const afterDoc = parser.parseFromString(args.afterHtml, "text/html");

  // Create a container element for the result
  // Clone the 'after' body content into it, as we'll modify this clone
  const resultContainer = document.createElement("div");
  resultContainer.innerHTML = afterDoc.body.innerHTML;

  const beforeElements = beforeDoc.querySelectorAll("[data-lix-entity-id]");
  // Query within the result container which holds the 'after' structure clone
  const afterElementsInResult = resultContainer.querySelectorAll(
    "[data-lix-entity-id]",
  );

  const afterElementsMap = new Map<string, Element>();
  afterElementsInResult.forEach((el) => {
    const id = el.getAttribute("data-lix-entity-id");
    if (id) {
      afterElementsMap.set(id, el);
    }
  });

  beforeElements.forEach((beforeEl: Element) => {
    const id = beforeEl.getAttribute("data-lix-entity-id");
    if (!id) return;

    const afterEl = afterElementsMap.get(id);
    if (!afterEl) {
      // Element removed in 'after'. Handled by only cloning 'after'.
      // We could potentially mark corresponding 'before' elements if needed,
      // but for now, we focus on visualizing the 'after' state with changes.
      return;
    }

    if (beforeEl.textContent !== afterEl.textContent) {
      const textDiff = diffWords(
        beforeEl.textContent || "",
        afterEl.textContent || "",
      );
      // Use the document context of the resultContainer for creating new nodes
      const doc = resultContainer.ownerDocument;
      const fragment = doc.createDocumentFragment();

      textDiff.forEach((part) => {
        const span = doc.createElement("span");
        if (part.added) {
          span.style.backgroundColor = "lightgreen";
          span.textContent = part.value;
          fragment.appendChild(span);
        } else if (part.removed) {
          // Represent removed text with strikethrough
          const delSpan = doc.createElement("span");
          delSpan.style.backgroundColor = "lightcoral";
          delSpan.style.textDecoration = "line-through";
          delSpan.textContent = part.value;
          fragment.appendChild(delSpan); // Ensure removed part is added
        } else {
          fragment.appendChild(doc.createTextNode(part.value));
        }
      });

      // Clear existing content of the 'after' element clone and append the diff
      while (afterEl.firstChild) {
        afterEl.removeChild(afterEl.firstChild);
      }
      afterEl.appendChild(fragment);
    }

    // Mark this element as processed
    afterElementsMap.delete(id);
  });

  // Elements remaining in afterElementsMap were added
  afterElementsMap.forEach((addedEl) => {
    if (addedEl instanceof HTMLElement) {
      // Mark the entire added element
      addedEl.style.outline = "2px solid lightblue"; // Example indication
    }
  });

  // Return the container with the modified 'after' structure
  // If the original 'afterHtml' contained a single root element,
  // return that element directly instead of the container div.
  if (resultContainer.children.length === 1) {
    return resultContainer.children[0] as HTMLElement;
  }

  return resultContainer;
}
