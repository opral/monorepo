// JSON Schemas for Markdown AST nodes (mdast-shaped), editor-agnostic.
// These schemas are editor-agnostic and can be fed to Ajv.

import type { FromSchema } from "json-schema-to-ts"
export type JsonSchema = Record<string, any>

// Base TS type applied to all node types to provide typed children/data/position
// while still deriving attributes from JSON Schemas.
export type BaseNode = {
	type: string
	children?: MarkdownNode[]
	position?: Record<string, any>
	data?: Record<string, any>
}
type WithBase<T> = Omit<T, "children" | "position" | "data"> & BaseNode

export const RootSchema = {
	"x-lix-key": "markdown_wc_ast_root",
	"x-lix-version": "1.0",
	description: "Markdown AST root node (mdast-shaped). Holds all top-level children.",
	type: "object",
	properties: {
		type: { const: "root" },
		children: { type: "array" },
		position: { type: "object" },
		data: { type: "object" },
	},
	required: ["type", "children"],
	additionalProperties: true,
} as const

// Root order document used for state snapshots in block-based persistence
export const RootOrderSchema = {
	"x-lix-key": "markdown_wc_ast_root_order",
	"x-lix-version": "1.0",
	description:
		"Top-level block order for a Markdown document. Stores an array of block ids (node.data.id) to reconstruct the document order without reparsing.",
	type: "object",
	properties: {
		order: { type: "array", items: { type: "string" } },
	},
	required: ["order"],
	additionalProperties: true,
} as const

export type ParagraphNode = WithBase<FromSchema<typeof ParagraphSchema>>
export const ParagraphSchema = {
	"x-lix-key": "markdown_wc_ast_paragraph",
	"x-lix-version": "1.0",
	description: "Markdown paragraph block.",
	type: "object",
	properties: {
		type: { const: "paragraph" },
		children: { type: "array" },
		position: { type: "object" },
	},
	required: ["type"],
	additionalProperties: true,
} as const

export type HeadingNode = WithBase<FromSchema<typeof HeadingSchema>>
export const HeadingSchema = {
	"x-lix-key": "markdown_wc_ast_heading",
	"x-lix-version": "1.0",
	description: "Markdown heading block (depth 1–6).",
	type: "object",
	properties: {
		type: { const: "heading" },
		children: { type: "array" },
		position: { type: "object" },
		depth: { type: "integer", minimum: 1, maximum: 6 },
	},
	required: ["type"],
	additionalProperties: true,
} as const

export type ListNode = WithBase<FromSchema<typeof ListSchema>>
export const ListSchema = {
	"x-lix-key": "markdown_wc_ast_list",
	"x-lix-version": "1.0",
	description: "Markdown list block (ordered or unordered).",
	type: "object",
	properties: {
		type: { const: "list" },
		children: { type: "array" },
		position: { type: "object" },
		ordered: { type: "boolean" },
		start: { type: ["integer", "null"] },
		spread: { type: ["boolean", "null"] },
	},
	required: ["type"],
	additionalProperties: true,
} as const

export type ListItemNode = WithBase<FromSchema<typeof ListItemSchema>>
export const ListItemSchema = {
	"x-lix-key": "markdown_wc_ast_list_item",
	"x-lix-version": "1.0",
	description: "Markdown list item.",
	type: "object",
	properties: {
		type: { const: "listItem" },
		children: { type: "array" },
		position: { type: "object" },
		checked: { type: ["boolean", "null"] },
		spread: { type: ["boolean", "null"] },
	},
	required: ["type"],
	additionalProperties: true,
} as const

export type BlockquoteNode = WithBase<FromSchema<typeof BlockquoteSchema>>
export const BlockquoteSchema = {
	"x-lix-key": "markdown_wc_ast_blockquote",
	"x-lix-version": "1.0",
	description: "Markdown blockquote block.",
	type: "object",
	properties: {
		type: { const: "blockquote" },
		children: { type: "array" },
		position: { type: "object" },
	},
	required: ["type"],
	additionalProperties: true,
} as const

export type CodeNode = WithBase<FromSchema<typeof CodeSchema>>
export const CodeSchema = {
	"x-lix-key": "markdown_wc_ast_code",
	"x-lix-version": "1.0",
	description: "Markdown fenced code block.",
	type: "object",
	properties: {
		type: { const: "code" },
		children: { type: "array" },
		position: { type: "object" },
		value: { type: "string" },
		lang: { type: ["string", "null"] },
		meta: { type: ["string", "null"] },
	},
	required: ["type"],
	additionalProperties: true,
} as const

export type InlineCodeNode = WithBase<FromSchema<typeof InlineCodeSchema>>
export const InlineCodeSchema = {
	"x-lix-key": "markdown_wc_ast_inline_code",
	"x-lix-version": "1.0",
	description: "Inline code span.",
	type: "object",
	properties: {
		type: { const: "inlineCode" },
		children: { type: "array" },
		position: { type: "object" },
		value: { type: "string" },
	},
	required: ["type"],
	additionalProperties: true,
} as const

export type ThematicBreakNode = WithBase<FromSchema<typeof ThematicBreakSchema>>
export const ThematicBreakSchema = {
	"x-lix-key": "markdown_wc_ast_thematic_break",
	"x-lix-version": "1.0",
	description: "Horizontal rule (thematic break).",
	type: "object",
	properties: {
		type: { const: "thematicBreak" },
		children: { type: "array" },
		position: { type: "object" },
	},
	required: ["type"],
	additionalProperties: true,
} as const

export type BreakNode = WithBase<FromSchema<typeof BreakSchema>>
export const BreakSchema = {
	"x-lix-key": "markdown_wc_ast_break",
	"x-lix-version": "1.0",
	description: "Hard line break.",
	type: "object",
	properties: {
		type: { const: "break" },
		children: { type: "array" },
		position: { type: "object" },
	},
	required: ["type"],
	additionalProperties: true,
} as const

export type HtmlNode = WithBase<FromSchema<typeof HtmlSchema>>
export const HtmlSchema = {
	"x-lix-key": "markdown_wc_ast_html",
	"x-lix-version": "1.0",
	description: "Raw HTML block.",
	type: "object",
	properties: {
		type: { const: "html" },
		children: { type: "array" },
		position: { type: "object" },
		value: { type: "string" },
	},
	required: ["type"],
	additionalProperties: true,
} as const

export type ImageNode = WithBase<FromSchema<typeof ImageSchema>>
export const ImageSchema = {
	"x-lix-key": "markdown_wc_ast_image",
	"x-lix-version": "1.0",
	description: "Image node.",
	type: "object",
	properties: {
		type: { const: "image" },
		children: { type: "array" },
		position: { type: "object" },
		url: { type: "string" },
		title: { type: ["string", "null"] },
		alt: { type: ["string", "null"] },
	},
	required: ["type"],
	additionalProperties: true,
} as const

export type LinkNode = WithBase<FromSchema<typeof LinkSchema>>
export const LinkSchema = {
	"x-lix-key": "markdown_wc_ast_link",
	"x-lix-version": "1.0",
	description: "Link node containing inline children.",
	type: "object",
	properties: {
		type: { const: "link" },
		children: { type: "array" },
		position: { type: "object" },
		url: { type: "string" },
		title: { type: ["string", "null"] },
	},
	required: ["type"],
	additionalProperties: true,
} as const

export type EmphasisNode = WithBase<FromSchema<typeof EmphasisSchema>>
export const EmphasisSchema = {
	"x-lix-key": "markdown_wc_ast_emphasis",
	"x-lix-version": "1.0",
	description: "Emphasis (italic) inline node.",
	type: "object",
	properties: {
		type: { const: "emphasis" },
		children: { type: "array" },
		position: { type: "object" },
	},
	required: ["type"],
	additionalProperties: true,
} as const
export type StrongNode = WithBase<FromSchema<typeof StrongSchema>>
export const StrongSchema = {
	"x-lix-key": "markdown_wc_ast_strong",
	"x-lix-version": "1.0",
	description: "Strong (bold) inline node.",
	type: "object",
	properties: {
		type: { const: "strong" },
		children: { type: "array" },
		position: { type: "object" },
	},
	required: ["type"],
	additionalProperties: true,
} as const
export type DeleteNode = WithBase<FromSchema<typeof DeleteSchema>>
export const DeleteSchema = {
	"x-lix-key": "markdown_wc_ast_delete",
	"x-lix-version": "1.0",
	description: "Delete/Strikethrough inline node.",
	type: "object",
	properties: {
		type: { const: "delete" },
		children: { type: "array" },
		position: { type: "object" },
	},
	required: ["type"],
	additionalProperties: true,
} as const

export type TableNode = WithBase<FromSchema<typeof TableSchema>>
export const TableSchema = {
	"x-lix-key": "markdown_wc_ast_table",
	"x-lix-version": "1.0",
	description: "Markdown table block (GFM).",
	type: "object",
	properties: {
		type: { const: "table" },
		children: { type: "array" },
		position: { type: "object" },
		align: {
			type: "array",
			items: { type: ["string", "null"], enum: ["left", "right", "center", null] },
		},
	},
	required: ["type"],
	additionalProperties: true,
} as const
export type TableRowNode = WithBase<FromSchema<typeof TableRowSchema>>
export const TableRowSchema = {
	"x-lix-key": "markdown_wc_ast_table_row",
	"x-lix-version": "1.0",
	description: "Table row (GFM).",
	type: "object",
	properties: {
		type: { const: "tableRow" },
		children: { type: "array" },
		position: { type: "object" },
	},
	required: ["type"],
	additionalProperties: true,
} as const
export type TableCellNode = WithBase<FromSchema<typeof TableCellSchema>>
export const TableCellSchema = {
	"x-lix-key": "markdown_wc_ast_table_cell",
	"x-lix-version": "1.0",
	description: "Table cell (GFM).",
	type: "object",
	properties: {
		type: { const: "tableCell" },
		children: { type: "array" },
		position: { type: "object" },
	},
	required: ["type"],
	additionalProperties: true,
} as const

export type TextNode = WithBase<FromSchema<typeof TextSchema>>
export const TextSchema = {
	"x-lix-key": "markdown_wc_ast_text",
	"x-lix-version": "1.0",
	description: "Plain text leaf node.",
	type: "object",
	properties: {
		type: { const: "text" },
		children: { type: "array" },
		position: { type: "object" },
		value: { type: "string" },
	},
	required: ["type"],
	additionalProperties: true,
} as const

export type YamlNode = WithBase<FromSchema<typeof YamlSchema>>
export const YamlSchema = {
	"x-lix-key": "markdown_wc_ast_yaml",
	"x-lix-version": "1.0",
	description: "YAML frontmatter block.",
	type: "object",
	properties: {
		type: { const: "yaml" },
		children: { type: "array" },
		position: { type: "object" },
		value: { type: "string" },
	},
	required: ["type"],
	additionalProperties: true,
} as const

/**
 * Runtime map from mdast `node.type` → JSON schema.
 *
 * Why this exists:
 *
 * - Generic code only knows `node.type` at runtime (e.g., during AST walks, diffing, persistence).
 *   A data-driven map avoids hardcoding switch/case over every node type or importing each schema by name.
 * - Stable lookup by type string keeps callsites decoupled from export names and enables easy extension.
 *
 * @example
 * // Generic validation/dispatch by node.type
 * import { schemasByType } from "@opral/markdown-wc";
 *
 * function schemaFor(node: { type: string }) {
 *   return schemasByType[node.type];
 * }
 *
 * @example
 * // Persisting changes with per-type schemas
 * import { schemasByType } from "@opral/markdown-wc";
 *
 * function toDetectedChange(node: any, id: string) {
 *   const schema = schemasByType[node.type];
 *   return { entity_id: id, schema, snapshot_content: node };
 * }
 *
 * @example
 * // Querying by schema key (known type)
 * import * as AstSchemas from "@opral/markdown-wc";
 *
 * db.select("changes")
 *   .where("schema_key", "=", AstSchemas.schemasByType.paragraph["x-lix-key"]);
 */
export const schemasByType: Record<string, JsonSchema> = {
	root: RootSchema,
	paragraph: ParagraphSchema,
	heading: HeadingSchema,
	list: ListSchema,
	listItem: ListItemSchema,
	blockquote: BlockquoteSchema,
	code: CodeSchema,
	inlineCode: InlineCodeSchema,
	thematicBreak: ThematicBreakSchema,
	break: BreakSchema,
	html: HtmlSchema,
	image: ImageSchema,
	link: LinkSchema,
	emphasis: EmphasisSchema,
	strong: StrongSchema,
	delete: DeleteSchema,
	table: TableSchema,
	tableRow: TableRowSchema,
	tableCell: TableCellSchema,
	text: TextSchema,
	yaml: YamlSchema,
}

export const allSchemas: JsonSchema[] = Object.values(schemasByType)

// Type exports derived from JSON Schemas (no mdast import)
export type AstRoot = FromSchema<typeof RootSchema>
export type MarkdownNode =
	| ParagraphNode
	| HeadingNode
	| ListNode
	| ListItemNode
	| BlockquoteNode
	| CodeNode
	| InlineCodeNode
	| ThematicBreakNode
	| BreakNode
	| HtmlNode
	| ImageNode
	| LinkNode
	| EmphasisNode
	| StrongNode
	| DeleteNode
	| TableNode
	| TableRowNode
	| TableCellNode
	| TextNode
	| YamlNode

// Root AST type with typed children
export type Ast = Omit<AstRoot, "children"> & { children: MarkdownNode[] }
