/* eslint-disable no-undef */
/**
 * This script writes public environment variables
 * to an importable env file.
 *
 * - The SDK must bundle this file with the rest of the SDK
 * - This scripts avoids the need for a bundler
 * - Must be ran before building the SDK
 */

import fs from "node:fs/promises";
import url from "node:url";
import path from "node:path";

const dirname = path.dirname(url.fileURLToPath(import.meta.url));

const packageJson = JSON.parse(
	await fs.readFile(path.resolve(dirname, "../../../package.json"), "utf-8")
);

await fs.writeFile(
	dirname + "/index.ts",
	`
export const ENV_VARIABLES = {
  PUBLIC_POSTHOG_TOKEN: ${ifDefined(process.env.PUBLIC_POSTHOG_TOKEN)},
	PUBLIC_INLANG_SDK_SENTRY_DSN: ${ifDefined(
		process.env.PUBLIC_INLANG_SDK_SENTRY_DSN
	)},
	SDK_VERSION: ${ifDefined(packageJson.version)},
}
`
);

console.log("✅ Created env variable index file.");

function ifDefined(value) {
	return value ? `"${value}"` : undefined;
}
