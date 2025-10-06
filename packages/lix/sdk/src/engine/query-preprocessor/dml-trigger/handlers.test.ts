import { describe, expect, test } from "vitest";
import { getTriggerHandler, registerTriggerHandler } from "./handlers.js";

const handlerA = () => ({ sql: "SELECT 1", parameters: [] });
const handlerB = () => ({ sql: "SELECT 2", parameters: [] });

describe("trigger handler registry", () => {
	test("registers and retrieves handlers case-insensitively", () => {
		registerTriggerHandler("Example_View", "insert", handlerA);
		registerTriggerHandler("example_view", "update", handlerB);

		expect(getTriggerHandler("example_view", "insert")).toBe(handlerA);
		expect(getTriggerHandler("EXAMPLE_VIEW", "update")).toBe(handlerB);
		expect(getTriggerHandler("example_view", "delete")).toBeNull();
	});
});
