// @ts-check

/** @type { Record<string, string[]> } */
const config = {
	"*.{json,md,dockerfile,yml,yaml}": ["npm run format:fix:base"],
	"*.{js,cjs,mjs,ts,mts,d.ts}": ["npm run format:fix:base", "npm run lint:fix:base"],
}

module.exports = config
