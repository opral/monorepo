import { it } from "vitest";
import { importFromUrl } from "./importFromUrl.js";

it("should import a module from a url", async () => {
	const x = await importFromUrl("https://cdn.jsdelivr.net/npm/lodash-es@3.2");
	console.log(x);
});
