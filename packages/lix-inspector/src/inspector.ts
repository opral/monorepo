import type { Lix } from "@lix-js/sdk";
import { LixInspectorImpl } from "./inspector-impl.js";

export interface LixInspectorOptions {
  // Configuration options
  autoRefreshInterval?: number; // ms
  maxHistorySize?: number;
  theme?: "light" | "dark" | "auto";
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  autoAttach?: boolean; // When true, auto-attaches to document.body
}

export interface LixInspector {
  // Core methods
  mount(container: HTMLElement): void;
  unmount(): void;
  refresh(): void;
  
  // State control
  startTracking(): void;
  stopTracking(): void;
  
  // Event subscription
  on(event: InspectorEvent, callback: (data: any) => void): void;
  off(event: InspectorEvent, callback: (data: any) => void): void;
}

export type InspectorEvent = 
  | "change" 
  | "conflict" 
  | "version" 
  | "snapshot" 
  | "table-update";

/**
 * Creates a new Lix Inspector instance that can be attached to a DOM element
 * to visualize and debug Lix files.
 * 
 * @param lix The Lix instance to inspect
 * @param options Configuration options for the inspector
 * @returns A LixInspector instance
 * 
 * @example
 * ```ts
 * const lix = await openLix({ database });
 * const inspector = createLixInspector(lix);
 * inspector.mount(document.getElementById('inspector-container'));
 * ```
 */
export function createLixInspector(lix: Lix, options?: LixInspectorOptions): LixInspector {
  return new LixInspectorImpl(lix, options);
}