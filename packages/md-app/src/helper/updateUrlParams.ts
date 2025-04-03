/**
 * Updates URL search parameters without causing a full page reload
 * 
 * @param params Object containing the parameters to update
 * @returns True if update was successful, false if fallback to page reload was needed
 */
export function updateUrlParams(params: Record<string, string>): boolean {
  try {
    const url = new URL(window.location.href);
    
    // Update all provided parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        url.searchParams.set(key, value);
      } else {
        url.searchParams.delete(key);
      }
    });
    
    // Update URL without navigation
    window.history.replaceState({}, '', url.toString());
    return true;
  } catch (error) {
    console.error('Error updating URL parameters:', error);
    return false;
  }
}