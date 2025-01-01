import { it, expect } from "vitest"
import packageJson from "../package.json"

it("should have matching engine and dependency versions", () => {
	expect(packageJson.engines.vscode).toBe(packageJson.devDependencies["@types/vscode"])
})
