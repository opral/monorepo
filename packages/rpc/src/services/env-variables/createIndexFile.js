/* eslint-disable no-restricted-imports */
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

//! only write public api keys into the file
await fs.writeFile(
	dirname + "/index.js",
	`
export const PUBLIC_ENV_VARIABLES = {
	PUBLIC_SERVER_BASE_URL: ${ifDefined(process.env.PUBLIC_SERVER_BASE_URL)},
	PUBLIC_ALLOWED_AUTH_URLS: ${ifDefined(process.env.PUBLIC_ALLOWED_AUTH_URLS)},
}
`
);

// eslint-disable-next-line no-console
// console.log("✅ Created env variable index file.");

function ifDefined(value) {
	return value ? `"${value}"` : undefined;
}
