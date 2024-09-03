import { describe, it, expect } from "vitest"
import { transpileToCjs } from "./transpileToCjs.js" // Adjust the path if necessary

describe("transpileToCjs", () => {
	it("should transpile ES module code to CommonJS", () => {
		const esModuleCode = `
            export const hello = () => {
                console.log("Hello, world!");
            };
        `

		const expectedCjsCode = `
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hello = void 0;
const hello = () => {
    console.log("Hello, world!");
};
exports.hello = hello;
`

		const result = transpileToCjs(esModuleCode)

		expect(result.trim()).toBe(expectedCjsCode.trim())
	})

	it("should transpile ES2020 code correctly", () => {
		const es2020Code = `
            const sum = (a: number, b: number): number => a + b;
            export { sum };
        `

		const expectedCjsCode = `
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sum = void 0;
const sum = (a, b) => a + b;
exports.sum = sum;
`

		const result = transpileToCjs(es2020Code)

		expect(result.trim()).toBe(expectedCjsCode.trim())
	})

	it("should handle code with import statements", () => {
		const esModuleWithImport = `
            import { readFileSync } from 'fs';
            export function readConfig() {
                return JSON.parse(readFileSync('config.json', 'utf8'));
            }
        `

		const expectedCjsCode = `
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readConfig = void 0;
const fs_1 = require("fs");
function readConfig() {
    return JSON.parse((0, fs_1.readFileSync)('config.json', 'utf8'));
}
exports.readConfig = readConfig;
`

		const result = transpileToCjs(esModuleWithImport)

		expect(result.trim()).toBe(expectedCjsCode.trim())
	})
})
