import type { Lix } from "@lix-js/sdk";
import { tool } from "ai";
import { z } from "zod";
import dedent from "dedent";

export const ExecuteJavascriptInputSchema = z.object({
	code: z.string().min(1),
});

export type ExecuteJavascriptInput = z.infer<
	typeof ExecuteJavascriptInputSchema
>;

export const ExecuteJavascriptOutputSchema = z.any();

export type ExecuteJavascriptOutput = any;

/**
 * Executes arbitrary JavaScript code with support for ESM imports.
 *
 * The code is executed using dynamic imports via data URLs, which allows
 * importing packages from CDNs like esm.run.
 *
 * @example
 * ```javascript
 * import * as d3 from 'https://esm.run/d3';
 * export default { version: d3.version };
 * ```
 */
export async function executeJavascript(
	args: ExecuteJavascriptInput & { lix: Lix }
): Promise<ExecuteJavascriptOutput> {
	const { code } = args;

	// Create a data URL from the JavaScript code
	const dataUrl = `data:text/javascript,${encodeURIComponent(code)}`;

	// Dynamically import the module
	const module = await import(dataUrl);

	// Return the default export
	return module.default;
}

export function createExecuteJavascriptTool(args: { lix: Lix }) {
	const description = dedent`
		Execute arbitrary JavaScript code with ESM import support.
		
		This tool allows you to run JavaScript code with full access to ESM imports
		from CDNs like esm.run, unpkg, skypack, etc.
		
		IMPORTANT: Your code MUST have a default export that will be returned as the result.
		
		How to use:
		1. Write JavaScript code with any ESM imports you need
		2. Process/transform data as needed
		3. Export the final result as the default export
		
		Examples:
		
		1. Import and use d3:
		import * as d3 from 'https://esm.run/d3';
		const data = d3.range(10).map(i => ({ x: i, y: i * 2 }));
		export default data;
		
		2. Use multiple imports:
		import * as d3 from 'https://esm.run/d3';
		import * as _ from 'https://esm.run/lodash-es';
		const numbers = _.range(1, 100);
		const mean = d3.mean(numbers);
		export default { mean, count: numbers.length };
		
		3. Complex data transformation:
		import Papa from 'https://esm.run/papaparse';
		const csvData = "name,age\\nAlice,30\\nBob,25";
		const parsed = Papa.parse(csvData, { header: true });
		export default parsed.data;
		
		4. Date manipulation:
		import dayjs from 'https://esm.run/dayjs';
		const now = dayjs();
		const formatted = now.format('YYYY-MM-DD HH:mm:ss');
		export default { timestamp: formatted, unix: now.unix() };
		
		Supported CDNs:
		- esm.run (recommended): https://esm.run/package-name
		- unpkg: https://unpkg.com/package-name
		- skypack: https://cdn.skypack.dev/package-name
		- jsDelivr: https://cdn.jsdelivr.net/npm/package-name
		
		Guidelines:
		- ALWAYS include "export default <value>" at the end
		- Use ESM syntax (import/export), not CommonJS (require)
		- You can use top-level await
		- The returned value will be serialized, so it must be JSON-serializable
		- For complex objects, export only the data you need
		
		Error handling:
		- Import errors will be thrown if packages don't exist
		- Runtime errors will be thrown with stack traces
		- Make sure to handle potential errors in your code if needed
		
		Use cases:
		- Data transformation and analysis
		- Date/time calculations
		- String manipulation with libraries
		- Generating data structures
		- Statistical calculations
		- Any computation that benefits from npm packages
	`;

	return tool({
		description,
		inputSchema: ExecuteJavascriptInputSchema,
		execute: async (input) =>
			executeJavascript({
				lix: args.lix,
				...(input as ExecuteJavascriptInput),
			}),
	});
}
