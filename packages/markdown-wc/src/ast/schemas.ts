// JSON Schemas for Markdown AST nodes (mdast-shaped), with vendor x-lix metadata.
// These schemas are editor-agnostic and can be fed to Ajv.

export type JsonSchema = Record<string, any>

const makeBase = (nodeType: string, extra: Record<string, any> = {}): JsonSchema => ({
  "x-lix-key": `markdown_wc_ast_${nodeType}`,
  "x-lix-version": "1.0",
  type: "object",
  properties: {
    type: { const: nodeType },
    children: { type: "array" },
    position: { type: "object" },
    ...extra,
  },
  required: ["type"],
  additionalProperties: true,
})

export const RootSchema: JsonSchema = {
  "x-lix-key": "markdown_wc_ast_root",
  "x-lix-version": "1.0",
  type: "object",
  properties: {
    type: { const: "root" },
    children: { type: "array" },
    position: { type: "object" },
    data: { type: "object" },
  },
  required: ["type", "children"],
  additionalProperties: true,
}

export const ParagraphSchema = makeBase("paragraph")

export const HeadingSchema = makeBase("heading", {
  depth: { type: "integer", minimum: 1, maximum: 6 },
})

export const ListSchema = makeBase("list", {
  ordered: { type: "boolean" },
  start: { type: ["integer", "null"] },
  spread: { type: ["boolean", "null"] },
})

export const ListItemSchema = makeBase("listItem", {
  checked: { type: ["boolean", "null"] },
  spread: { type: ["boolean", "null"] },
})

export const BlockquoteSchema = makeBase("blockquote")

export const CodeSchema = makeBase("code", {
  value: { type: "string" },
  lang: { type: ["string", "null"] },
  meta: { type: ["string", "null"] },
})

export const InlineCodeSchema = makeBase("inlineCode", {
  value: { type: "string" },
})

export const ThematicBreakSchema = makeBase("thematicBreak")

export const BreakSchema = makeBase("break")

export const HtmlSchema = makeBase("html", {
  value: { type: "string" },
})

export const ImageSchema = makeBase("image", {
  url: { type: "string" },
  title: { type: ["string", "null"] },
  alt: { type: ["string", "null"] },
})

export const LinkSchema = makeBase("link", {
  url: { type: "string" },
  title: { type: ["string", "null"] },
})

export const EmphasisSchema = makeBase("emphasis")
export const StrongSchema = makeBase("strong")
export const DeleteSchema = makeBase("delete")

export const TableSchema = makeBase("table", {
  align: {
    type: "array",
    items: { type: ["string", "null"], enum: ["left", "right", "center", null] },
  },
})
export const TableRowSchema = makeBase("tableRow")
export const TableCellSchema = makeBase("tableCell")

export const TextSchema = makeBase("text", {
  value: { type: "string" },
})

export const YamlSchema = makeBase("yaml", { value: { type: "string" } })

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
