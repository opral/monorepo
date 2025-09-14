import { test, expect } from "vitest";
import { loadPluginFromString } from "./load-from-string.js";

test("loads plugin from code with named export", async () => {
	const code = `export const plugin = { key: 'test-named', detectChanges() { return [] } }`;
	const plugin = await loadPluginFromString(code);
	expect(plugin).toBeDefined();
	expect(plugin.key).toBe("test-named");
	expect(typeof plugin.detectChanges).toBe("function");
});

test("loads plugin from code with default export", async () => {
	const code = `export default { key: 'test-default', detectChanges() { return [] } }`;
	const plugin = await loadPluginFromString(code);
	expect(plugin).toBeDefined();
	expect(plugin.key).toBe("test-default");
});
