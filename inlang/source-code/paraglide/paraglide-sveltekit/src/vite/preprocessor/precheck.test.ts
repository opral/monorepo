import { it, expect } from "vitest"
import { shouldApply } from "./precheck"
import ParaglideJSComponentCode from "../../runtime/ParaglideJS.svelte?raw"

it("should fail on the ParaglideJS component", () => {
	expect(shouldApply(ParaglideJSComponentCode, {})).toBe(false)
})
