import { determineClosestPath } from "./determineClosestPath.js"
import { it, expect } from "vitest"

it("should find the closest path", () => {
	const result = determineClosestPath({
		options: [
			"some/path/packages/module-a/config.json",
			"some/path/packages/module-a/src/utils/config.json",
			"some/path/packages/config.json",
		],
		to: "some/path/packages/module-a/src/utils/foo/index.js",
	})
	expect(result).toBe("some/path/packages/module-a/src/utils/config.json")
})

it("should find the closest path", () => {
	const result = determineClosestPath({
		options: [
			"some/path/packages/module-a/config.json",
			"some/path/packages/module-a/src/utils/config.json",
			"some/path/packages/config.json",
		],
		to: "some/path/packages/index.js",
	})
	expect(result).toBe("some/path/packages/config.json")
})
