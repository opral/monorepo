/**
 * Utility to fix aria-hidden issues with inputs by temporarily removing aria-hidden from ancestors
 * of focused elements. This addresses accessibility warnings when using Radix UI components.
 */

// Store original aria-hidden values to restore them later
const originalAriaHiddenValues = new Map<Element, string | null>();

/**
 * Finds all aria-hidden ancestors of the given element and temporarily removes 
 * the aria-hidden attribute to prevent accessibility issues
 */
export function fixAriaHiddenForElement(element: Element | null): void {
  if (!element) return;

  // Clear any previous fixing in case elements were not properly restored
  restoreAriaHidden();

  // Find all aria-hidden ancestors
  let currentElement = element.parentElement;
  while (currentElement) {
    if (currentElement.hasAttribute('aria-hidden')) {
      // Store original value
      originalAriaHiddenValues.set(
        currentElement, 
        currentElement.getAttribute('aria-hidden')
      );
      
      // Remove aria-hidden
      currentElement.removeAttribute('aria-hidden');
    }
    currentElement = currentElement.parentElement;
  }
}

/**
 * Restores all previously removed aria-hidden attributes
 */
export function restoreAriaHidden(): void {
  originalAriaHiddenValues.forEach((value, element) => {
    if (value !== null) {
      element.setAttribute('aria-hidden', value);
    }
  });
  
  // Clear the map
  originalAriaHiddenValues.clear();
}

/**
 * Sets up mutation observers to fix aria-hidden issues when elements get focused
 */
export function setupAriaHiddenFixes(): () => void {
  // Function to handle focus events
  const handleFocus = (event: FocusEvent) => {
    const target = event.target as Element;
    
    // Only fix aria-hidden for inputs, textareas, selects
    if (target && (
      target.tagName === 'INPUT' || 
      target.tagName === 'TEXTAREA' || 
      target.tagName === 'SELECT'
    )) {
      fixAriaHiddenForElement(target);
    }
  };

  // Function to handle blur events
  const handleBlur = () => {
    // Delay restoration to handle focus moving to another element
    setTimeout(() => {
      // Only restore if no focused elements still need fixing
      if (!document.activeElement || (
        document.activeElement.tagName !== 'INPUT' &&
        document.activeElement.tagName !== 'TEXTAREA' &&
        document.activeElement.tagName !== 'SELECT'
      )) {
        restoreAriaHidden();
      }
    }, 0);
  };

  // Add event listeners
  document.addEventListener('focus', handleFocus, true);
  document.addEventListener('blur', handleBlur, true);

  // Return cleanup function
  return () => {
    document.removeEventListener('focus', handleFocus, true);
    document.removeEventListener('blur', handleBlur, true);
    restoreAriaHidden();
  };
}