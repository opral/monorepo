import { defineConfig } from "rolldown";
import { dts } from "rolldown-plugin-dts";

// Force Worker-safe decode of HTML entities by mapping the DOM variant
// 'decode-named-character-reference/index.dom.js' to its non-DOM entry.
// Virtual module to replace DOM-based decoder with pure JS version.
const nonDomAlias = {
	name: "non-dom-alias",
	resolveId(source: string) {
		if (source === "decode-named-character-reference") {
			return { id: "\0decode-named-character-reference" } as any;
		}
		return null;
	},
	load(id: string) {
		if (id === "\0decode-named-character-reference") {
			// Re-export a pure implementation backed by character-entities (Worker-safe).
			return `import {characterEntities} from 'character-entities';
const own = {}.hasOwnProperty;
export function decodeNamedCharacterReference(value){
  return own.call(characterEntities, value) ? characterEntities[value] : false;
}
export default { decodeNamedCharacterReference };`;
		}
		return null;
	},
};

export default defineConfig([
	// UI / App bundle (can include DOM/lit components)
	{
		input: "src/index.ts",
		treeshake: true,
		plugins: [nonDomAlias, dts()],
		output: {
			sourcemap: true,
			dir: "dist",
			format: "esm",
			inlineDynamicImports: true,
			minify: false,
		},
	},
]);
