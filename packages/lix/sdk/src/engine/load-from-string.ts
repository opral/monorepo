import type { LixPlugin } from "../plugin/lix-plugin.js";

/**
 * Loads a Lix plugin from ESM source code provided as a string.
 *
 * Uses a Blob URL + dynamic import. Requires a browser/worker environment
 * with Blob and URL.createObjectURL support. In Node, falls back to data: URL
 * with base64 encoding via global Buffer.
 */
export async function loadPluginFromString(code: string): Promise<LixPlugin> {
  // Prefer Node-safe data: URL path when running under Node – Node cannot import blob: URLs.
  // @ts-expect-error - process is not typed in browser builds
  const isNode =
    typeof (globalThis as any).process !== "undefined" &&
    !!(globalThis as any).process?.versions?.node;

  if (isNode) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // @ts-expect-error - Buffer is not typed in browser builds
    const BufferAny = (globalThis as any).Buffer;
    if (BufferAny && typeof BufferAny.from === "function") {
      const base64 = BufferAny.from(code, "utf-8").toString("base64");
      const dataUrl = `data:text/javascript;base64,${base64}`;
      // @ts-expect-error - dynamic import of a computed URL
      const mod: any = await import(/* @vite-ignore */ dataUrl);
      return (mod.plugin ?? mod.default ?? mod) as LixPlugin;
    }
  }

  // Browser/Worker path: Blob URL + import
  if (
    typeof Blob !== "undefined" &&
    typeof URL !== "undefined" &&
    "createObjectURL" in URL
  ) {
    const blob = new Blob([code], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    try {
      // @ts-expect-error - dynamic import of a computed URL
      const mod: any = await import(/* @vite-ignore */ url);
      return (mod.plugin ?? mod.default ?? mod) as LixPlugin;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  throw new Error(
    "loadPluginFromString requires Node Buffer or Blob URL support for dynamic import."
  );
}

