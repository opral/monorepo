import type { LixPlugin } from "../plugin/lix-plugin.js";

/**
 * Loads a Lix plugin from ESM source code provided as a string.
 *
 * Uses a Blob URL + dynamic import. Requires a browser/worker environment
 * with Blob and URL.createObjectURL support. In Node, falls back to data: URL
 * with base64 encoding via global Buffer.
 */
let __lixInlinePluginCounter = 0;

export async function loadPluginFromString(code: string): Promise<LixPlugin> {
	// Prefer Node-safe data: URL path when running under Node – Node cannot import blob: URLs.
	const isNode =
		typeof (globalThis as any).process !== "undefined" &&
		!!(globalThis as any).process?.versions?.node;

	if (isNode) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const BufferAny = (globalThis as any).Buffer;
		if (BufferAny && typeof BufferAny.from === "function") {
			const base64 = BufferAny.from(code, "utf-8").toString("base64");
			const dataUrl = `data:text/javascript;base64,${base64}`;
			try {
				const mod: any = await import(/* @vite-ignore */ dataUrl);
				return (mod.plugin ?? mod.default ?? mod) as LixPlugin;
			} catch (e: any) {
				const preview = code.slice(0, 200);
				const err = new Error(
					`loadPluginFromString(dataUrl) failed: ${e?.message ?? e}. Preview: ${preview}`
				);
				(err as any).cause = e;
				throw err;
			}
		}
	}

	// Browser/Worker path: Blob URL + import
	if (
		typeof Blob !== "undefined" &&
		typeof URL !== "undefined" &&
		"createObjectURL" in URL
	) {
		const blob = new Blob([code], { type: "application/javascript" });
		const url = URL.createObjectURL(blob);
		try {
			const mod: any = await import(/* @vite-ignore */ url);
			return (mod.plugin ?? mod.default ?? mod) as LixPlugin;
		} catch (e: any) {
			const preview = code.slice(0, 400);
			const err = new SyntaxError(
				`loadPluginFromString(blob) failed: ${e?.message ?? e}\npreview:\n${preview}`
			);
			(err as any).cause = e;
			// Preserve original stack if available
			if (e?.stack && typeof e.stack === "string") {
				try {
					(err as any).stack = e.stack;
				} catch {}
			}
			throw err;
		} finally {
			URL.revokeObjectURL(url);
		}
	}

	throw new Error(
		"loadPluginFromString requires Node Buffer or Blob URL support for dynamic import."
	);
}
