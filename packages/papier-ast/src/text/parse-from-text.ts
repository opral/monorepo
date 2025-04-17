import type { PapierAst } from "../schema.js";

export function parseFromText(text: string): PapierAst {
	if (!text) {
		return [];
	}
	return [
		{
			_type: "block",
			_key: "0",
			style: "normal",
			markDefs: [],
			children: [{ _type: "span", _key: "0", marks: [], text: text }],
		},
	];
}
