/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { describe, it, expect } from "vitest";
import { pluralBundle } from "./bundle.js";
// import { MessageBundle } from "../../types/index.js"
// import { Value } from "@sinclair/typebox/value"

describe("mock plural messageBundle", () => {
	it("is valid", () => {
		// const messageBundle: unknown = pluralBundle
		// TODO SDK-v2 check if we want to typecheck message bundle? - we currently don't have a type box support
		// expect(Value.Check(MessageBundle, messageBundle)).toBe(true)

		expect(pluralBundle.messages.length).toBe(2);
		expect(pluralBundle.declarations.length).toBe(3);

		expect(pluralBundle.messages[0]!.selectors.length).toBe(1);
		expect(pluralBundle.messages[0]!.variants.length).toBe(3);
	});
});
