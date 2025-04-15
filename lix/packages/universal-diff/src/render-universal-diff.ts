// import { diffWords } from "diff";

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
 *     beforeHtml: `<p data-diff-id="abc">Test</p>`,
 *     afterHtml: `<p data-diff-id="abc">Test World</p>`,
 *   });
 *
 */
function renderUniversalDiffElement(args: {
  beforeHtml: string;
  afterHtml: string;
}): HTMLElement {
  const parser = new DOMParser();
  const beforeDoc = parser.parseFromString(args.beforeHtml, "text/html");
  const afterDoc = parser.parseFromString(args.afterHtml, "text/html");
  const doc = document; // Use the global document context for creating elements/fragments

  // Create a container element for the result
  // Clone the 'after' body content into it, as we'll modify this clone
  const resultContainer = document.createElement("div");
  resultContainer.innerHTML = afterDoc.body.innerHTML;

  // --- Step 1: Map elements and identify changes ---
  const beforeElementsMap = new Map<string, Element>();
  const beforeElementOrder: { id: string; element: Element }[] = [];
  beforeDoc.body.querySelectorAll("[data-diff-id]").forEach((el) => {
    const id = el.getAttribute("data-diff-id");
    if (id) {
      beforeElementsMap.set(id, el);
      beforeElementOrder.push({ id, element: el });
    }
  });

  const afterElementsInResultMap = new Map<string, Element>();
  // Query within the result container which holds the 'after' structure clone
  const afterElementsInResult =
    resultContainer.querySelectorAll("[data-diff-id]");
  afterElementsInResult.forEach((el) => {
    const id = el.getAttribute("data-diff-id");
    if (id) {
      afterElementsInResultMap.set(id, el);
    }
  });

  const addedIds = new Set<string>();
  const modifiedIds = new Set<string>(); // Potential modifications
  const removedIds = new Set<string>();

  afterElementsInResultMap.forEach((_, id) => {
    if (!beforeElementsMap.has(id)) {
      addedIds.add(id);
    } else {
      modifiedIds.add(id); // Initially assume all common elements might be modified
    }
  });

  beforeElementsMap.forEach((_, id) => {
    if (!afterElementsInResultMap.has(id)) {
      removedIds.add(id);
    }
  });

  // --- Step 2: Process elements in the result container (adds/modifications) ---
  afterElementsInResultMap.forEach((afterEl, id) => {
    if (addedIds.has(id)) {
      // Handle Added Element
      if (afterEl instanceof HTMLElement) {
        if (afterEl.hasAttribute("class")) {
          afterEl.className += " diff-after";
        } else {
          afterEl.className = "diff-after";
        }
      }
    } else if (modifiedIds.has(id)) {
      // Handle Potentially Modified Element
      const beforeEl = beforeElementsMap.get(id)!; // Should always exist

      // Check if direct child structure changed
      const beforeChildIds = new Set(
        Array.from(beforeEl.querySelectorAll(":scope > [data-diff-id]")).map(
          (el) => el.getAttribute("data-diff-id"),
        ),
      );
      const afterChildIds = new Set(
        Array.from(afterEl.querySelectorAll(":scope > [data-diff-id]")).map(
          (el) => el.getAttribute("data-diff-id"),
        ),
      );
      const areChildSetsEqual =
        beforeChildIds.size === afterChildIds.size &&
        [...beforeChildIds].every((id) => afterChildIds.has(id));

      if (!areChildSetsEqual) {
        // Child structure differs, parent modification is implied by children.
        // Do nothing to the parent element itself.
      } else if (beforeEl.textContent !== afterEl.textContent) {
        // Child structure is the same, but text content differs.
        // Treat as Delete Old + Insert New
        if (afterEl instanceof HTMLElement) {
          // 1. Style the 'after' element as inserted
          if (afterEl.hasAttribute("class")) {
            afterEl.className += " diff-after";
          } else {
            afterEl.className = "diff-after";
          }

          // 2. Clone the 'before' element
          const beforeClone = beforeEl.cloneNode(true) as HTMLElement;

          // 3. Style the clone as deleted
          if (beforeClone.hasAttribute("class")) {
            beforeClone.className += " diff-before";
          } else {
            beforeClone.className = "diff-before";
          }

          // 4. Disable interactions in the clone
          beforeClone
            .querySelectorAll("button, input, select, textarea, a[href]")
            .forEach((interactiveEl) => {
              if (interactiveEl instanceof HTMLElement) {
                interactiveEl.setAttribute("disabled", "true");
                interactiveEl.style.pointerEvents = "none";
              }
              if (interactiveEl instanceof HTMLAnchorElement) {
                interactiveEl.removeAttribute("href");
              }
            });

          // 5. Insert the styled 'before' clone right before the 'after' element
          afterEl.parentNode?.insertBefore(beforeClone, afterEl);
        }
      } else {
        // Child structure same, text content same. Check attributes? (TODO)
      }
    }
  });

  // --- Step 3: Insert markers for removed elements ---
  // Iterate in the original order to insert removed items correctly
  for (const { id, element: beforeEl } of beforeElementOrder) {
    if (removedIds.has(id)) {
      // Check if parent was also removed. If so, skip (it'll be handled with the parent)
      const parentId = beforeEl.parentElement?.getAttribute("data-diff-id");
      if (parentId && removedIds.has(parentId)) {
        continue;
      }

      // Find the parent in the *result* container
      let parentInResult: Element | null = null;
      if (parentId) {
        parentInResult = resultContainer.querySelector(
          `[data-diff-id="${parentId}"]`,
        );
      } else if (beforeEl.parentElement === beforeDoc.body) {
        parentInResult = resultContainer; // Element was direct child of body
      }

      if (parentInResult) {
        // Find the anchor node (the next sibling in the original order that still exists in the result)
        let insertBeforeNode: Node | null = null;
        let currentSibling = beforeEl.nextSibling;
        while (currentSibling) {
          if (currentSibling.nodeType === Node.ELEMENT_NODE) {
            const siblingId = (currentSibling as Element).getAttribute(
              "data-diff-id",
            );
            // Check if this sibling exists in the 'after' state (i.e., wasn't removed)
            if (siblingId && afterElementsInResultMap.has(siblingId)) {
              insertBeforeNode = afterElementsInResultMap.get(siblingId)!;
              break;
            }
          }
          currentSibling = currentSibling.nextSibling;
        }

        // Clone the removed element, style it, and insert
        const clone = beforeEl.cloneNode(true) as HTMLElement;
        // Style with class
        if (clone.hasAttribute("class")) {
          clone.className += " diff-before";
        } else {
          clone.className = "diff-before";
        }

        // Ensure contenteditable is false on the clone to prevent interaction
        clone.setAttribute("contenteditable", "false");
        // Optionally remove interactive elements or add disabled attributes within the clone
        clone
          .querySelectorAll("button, input, select, textarea, a[href]")
          .forEach((interactiveEl) => {
            if (interactiveEl instanceof HTMLElement) {
              interactiveEl.setAttribute("disabled", "true");
              interactiveEl.style.pointerEvents = "none";
            }
            if (interactiveEl instanceof HTMLAnchorElement) {
              interactiveEl.removeAttribute("href");
            }
          });

        parentInResult.insertBefore(clone, insertBeforeNode); // insertBefore(node, null) appends at the end
      }
    }
  }

  // --- Step 4: Return the result ---
  // If the result container itself has only one direct child element after modifications,
  // and the original HTML likely represented a single root, return that element.
  // Otherwise, return the container div which holds potentially multiple top-level elements.
  if (
    resultContainer.children.length === 1 &&
    resultContainer.firstElementChild?.nodeType === Node.ELEMENT_NODE
  ) {
    // Basic check: was the original 'after' also likely a single element?
    const originalAfterChildren = Array.from(afterDoc.body.childNodes).filter(
      (node) =>
        node.nodeType === Node.ELEMENT_NODE ||
        (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()),
    );
    if (originalAfterChildren.length === 1) {
      return resultContainer.firstElementChild as HTMLElement;
    }
  }

  return resultContainer;
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
 *     beforeHtml: `<p data-diff-id="abc">Test</p>`,
 *     afterHtml: `<p data-diff-id="abc">Test World</p>`,
 *   });
 *
 */
export function renderUniversalDiff(args: {
  beforeHtml: string;
  afterHtml: string;
}): string {
  return renderUniversalDiffElement(args).outerHTML;
}
