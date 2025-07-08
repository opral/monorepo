import type { Descendant, TElement, TText } from "@udecode/plate";
import { nanoid } from "@lix-js/sdk";
import type { MdAstEntity } from "@/queries";

// Define basic mdast types inline to avoid import issues
interface MdastNode {
	type: string;
	value?: string;
	children?: MdastNode[];
	position?: any;
	[key: string]: any;
}

interface MdastRoot extends MdastNode {
	type: "root";
	children: MdastNode[];
}

/**
 * Extended MdastNode with mdast_id property
 */
export interface MdastNodeWithId extends MdastNode {
	mdast_id?: string;
	children?: MdastNodeWithId[];
}

/**
 * Extended Plate element with mdast_id preservation
 */
export interface PlateElementWithId extends TElement {
	mdast_id?: string;
	type: string;
}

/**
 * Remark plugin to extract and inject mdast_id from HTML comments
 */
export function remarkMdastId() {
	return (tree: MdastRoot) => {
		const processedNodes: MdastNodeWithId[] = [];
		let previousNode: MdastNode | null = null;

		for (const node of tree.children) {
			// Check if this is an HTML comment with mdast_id
			if (node.type === "html" && node.value && isHtmlIdComment(node.value)) {
				previousNode = node;
				continue; // Skip adding HTML comments to the tree
			}

			// Assign ID to current node
			const nodeId =
				previousNode &&
				previousNode.value &&
				isHtmlIdComment(previousNode.value)
					? parseHtmlIdComment(previousNode.value!)
					: generateMdastId();

			const nodeWithId: MdastNodeWithId = {
				...node,
				mdast_id: nodeId,
			};

			// Recursively process children
			if ("children" in node && node.children) {
				nodeWithId.children = processChildrenForIds(
					node.children as MdastNode[]
				);
			}

			processedNodes.push(nodeWithId);
			previousNode = null;
		}

		tree.children = processedNodes as any;
		return tree;
	};
}

/**
 * Recursively process children nodes to preserve/generate IDs
 */
function processChildrenForIds(children: MdastNode[]): MdastNodeWithId[] {
	return children.map((child) => {
		const childWithId: MdastNodeWithId = {
			...child,
			mdast_id: generateMdastId(),
		};

		if ("children" in child && child.children) {
			childWithId.children = processChildrenForIds(
				child.children as MdastNode[]
			);
		}

		return childWithId;
	});
}

/**
 * Check if HTML value contains an mdast_id comment
 */
function isHtmlIdComment(value?: string): boolean {
	if (!value) return false;
	return /<!--\s*mdast_id\s*=\s*[^>]+\s*-->/.test(value);
}

/**
 * Parse mdast_id from HTML comment
 */
function parseHtmlIdComment(value: string): string {
	const match = value.match(/<!--\s*mdast_id\s*=\s*([^>]+)\s*-->/);
	return match?.[1]?.trim() || generateMdastId();
}

/**
 * Generate a new mdast_id (compatible with Plate's nanoid format)
 */
function generateMdastId(): string {
	return nanoid(10);
}

/**
 * Convert MD-AST entities to Plate value, preserving mdast_id as Plate node IDs
 */
export function mdastEntitiesToPlateValue(
	entities: MdAstEntity[],
	order: string[]
): Descendant[] {
	// Create entity lookup map
	const entityMap = new Map(
		entities.map((entity) => [entity.mdast_id, entity])
	);

	// Build ordered root-level entities
	const rootEntities = order
		.map((id) => entityMap.get(id))
		.filter(Boolean) as MdAstEntity[];

	// Convert entities to Plate nodes
	function entityToPlateNode(entity: MdAstEntity): PlateElementWithId | TText {
		// Handle text nodes
		if (entity.type === "text") {
			return {
				text: entity.value || "",
			};
		}

		// Handle element nodes
		const plateType = mapMdastTypeToPlate(entity.type, entity);

		const plateNode: PlateElementWithId = {
			id: entity.mdast_id, // Use mdast_id as Plate node ID
			type: plateType,
			children: [],
			mdast_id: entity.mdast_id, // Preserve mdast_id property
		};

		// Apply type-specific attributes
		applyMdastAttributesToPlate(plateNode, entity);

		// Process children
		if (entity.children) {
			// For children stored as entity references, look them up
			if (Array.isArray(entity.children) && entity.children.length > 0) {
				if (typeof entity.children[0] === "string") {
					// Children are references to other entities
					const childEntities = (entity.children as string[])
						.map((childId) => entityMap.get(childId))
						.filter(Boolean) as MdAstEntity[];

					plateNode.children = childEntities.map((childEntity) =>
						entityToPlateNode(childEntity)
					);
				} else {
					// Children are inline entities
					plateNode.children = (entity.children as MdAstEntity[]).map(
						(childEntity) => entityToPlateNode(childEntity)
					);
				}
			}
		}

		// Add text content if node has value but no children
		if (entity.value && plateNode.children.length === 0) {
			plateNode.children.push({ text: entity.value });
		}

		// Ensure all elements have at least one child (Plate requirement)
		if (plateNode.children.length === 0) {
			plateNode.children.push({ text: "" });
		}

		return plateNode;
	}

	return rootEntities.map((entity) =>
		entityToPlateNode(entity)
	) as Descendant[];
}

/**
 * Convert Plate value to MD-AST entities, preserving IDs
 */
export function plateValueToMdastEntities(plateValue: Descendant[]): {
	entities: MdAstEntity[];
	order: string[];
} {
	const entities: MdAstEntity[] = [];
	const order: string[] = [];

	function processPlateNode(node: Descendant, parentId?: string): string {
		// Handle text nodes - they don't become separate entities
		if ("text" in node) {
			return ""; // Text content will be captured in parent's value
		}

		const plateElement = node as PlateElementWithId;

		// Filter out Plate-specific UI elements that shouldn't be stored in MD-AST
		if (plateElement.type === "empty-document-prompt") {
			return ""; // Skip this node entirely
		}

		// Use existing mdast_id or Plate ID, or generate new one
		const mdast_id: string =
			(plateElement.id as string) ||
			(plateElement.mdast_id as string) ||
			generateMdastId();

		// Extract text content from immediate text children
		const textContent =
			plateElement.children
				?.filter((child) => "text" in child)
				?.map((child) => (child as TText).text)
				?.join("") || "";

		// Get child element nodes (non-text)
		const childElements =
			(plateElement.children?.filter(
				(child) => !("text" in child)
			) as PlateElementWithId[]) || [];

		// Process child elements and collect their IDs
		const childIds: string[] = childElements
			.map((childElement) => processPlateNode(childElement, mdast_id))
			.filter((id): id is string => id !== "");

		// Create MD-AST entity
		const entity: MdAstEntity = {
			entity_id: mdast_id as string,
			mdast_id: mdast_id as string,
			type: mapPlateTypeToMdast(plateElement.type),
		};

		if (textContent) {
			entity.value = textContent;
		}

		if (childIds.length > 0) {
			entity.children = childIds;
		}

		// Apply Plate-specific attributes to mdast
		applyPlateAttributesToMdast(entity, plateElement);

		entities.push(entity);

		// Add to order if this is a root-level node
		if (!parentId) {
			order.push(mdast_id as string);
		}

		return mdast_id as string;
	}

	plateValue.forEach((node) => processPlateNode(node));

	return { entities, order };
}

/**
 * Map MDast node types to Plate element types
 */
function mapMdastTypeToPlate(mdastType: string, entity?: MdAstEntity): string {
	const typeMap: Record<string, string> = {
		paragraph: "p",
		heading: `h${entity?.depth || 1}`,
		list: entity?.ordered ? "ol" : "ul",
		listItem: "li",
		link: "a",
		strong: "strong",
		emphasis: "em",
		inlineCode: "code",
		blockquote: "blockquote",
		code: "code_block",
		thematicBreak: "hr",
		image: "img",
		table: "table",
		tableRow: "tr",
		tableCell: "td",
		break: "br",
	};

	return typeMap[mdastType] || mdastType;
}

/**
 * Map Plate element types to MDast node types
 */
function mapPlateTypeToMdast(plateType: string): string {
	const typeMap: Record<string, string> = {
		p: "paragraph",
		h1: "heading",
		h2: "heading",
		h3: "heading",
		h4: "heading",
		h5: "heading",
		h6: "heading",
		ul: "list",
		ol: "list",
		li: "listItem",
		a: "link",
		strong: "strong",
		em: "emphasis",
		code: "inlineCode",
		blockquote: "blockquote",
		code_block: "code",
		hr: "thematicBreak",
		img: "image",
		table: "table",
		tr: "tableRow",
		td: "tableCell",
		br: "break",
	};

	return typeMap[plateType] || plateType;
}

/**
 * Apply MDast entity attributes to Plate node
 */
function applyMdastAttributesToPlate(
	plateNode: PlateElementWithId,
	entity: MdAstEntity
): void {
	// Heading depth
	if (entity.type === "heading" && entity.depth) {
		plateNode.type = `h${entity.depth}`;
	}

	// List ordered
	if (entity.type === "list" && entity.ordered !== undefined) {
		plateNode.type = entity.ordered ? "ol" : "ul";
	}

	// Link attributes
	if (entity.type === "link") {
		if (entity.url) (plateNode as any).url = entity.url;
		if (entity.title) (plateNode as any).title = entity.title;
	}

	// Image attributes
	if (entity.type === "image") {
		if (entity.url) (plateNode as any).url = entity.url;
		if (entity.alt) (plateNode as any).alt = entity.alt;
		if (entity.title) (plateNode as any).title = entity.title;
	}

	// Code language
	if (entity.type === "code") {
		if (entity.lang) (plateNode as any).lang = entity.lang;
		if (entity.meta) (plateNode as any).meta = entity.meta;
	}

	// Table alignment
	if (entity.type === "table" && entity.align) {
		(plateNode as any).align = entity.align;
	}
}

/**
 * Apply Plate node attributes to MDast entity
 */
function applyPlateAttributesToMdast(
	entity: MdAstEntity,
	plateNode: PlateElementWithId
): void {
	// Extract heading depth
	if (plateNode.type.startsWith("h") && plateNode.type.length === 2) {
		entity.depth = parseInt(plateNode.type.charAt(1));
	}

	// List ordered
	if (plateNode.type === "ol") {
		entity.ordered = true;
	} else if (plateNode.type === "ul") {
		entity.ordered = false;
	}

	// Link attributes
	if (plateNode.type === "a") {
		const linkNode = plateNode as any;
		if (linkNode.url) entity.url = linkNode.url;
		if (linkNode.title) entity.title = linkNode.title;
	}

	// Image attributes
	if (plateNode.type === "img") {
		const imgNode = plateNode as any;
		if (imgNode.url) entity.url = imgNode.url;
		if (imgNode.alt) entity.alt = imgNode.alt;
		if (imgNode.title) entity.title = imgNode.title;
	}

	// Code language
	if (plateNode.type === "code_block") {
		const codeNode = plateNode as any;
		if (codeNode.lang) entity.lang = codeNode.lang;
		if (codeNode.meta) entity.meta = codeNode.meta;
	}

	// Table alignment
	if (plateNode.type === "table") {
		const tableNode = plateNode as any;
		if (tableNode.align) entity.align = tableNode.align;
	}
}

/**
 * Serialize MDast entities to markdown with ID comments
 */
export function serializeMdastEntities(
	entities: MdAstEntity[],
	order: string[],
	options?: { skipIdComments?: boolean }
): string {
	// Build entity lookup
	const entityMap = new Map(
		entities.map((entity) => [entity.mdast_id, entity])
	);

	// Reconstruct MDast tree
	const mdastRoot: MdastRoot = {
		type: "root",
		children: [],
	};

	// Process ordered root entities
	for (const entityId of order) {
		const entity = entityMap.get(entityId);
		if (!entity) continue;

		// Add ID comment unless skipped
		if (!options?.skipIdComments) {
			mdastRoot.children.push({
				type: "html",
				value: `<!-- mdast_id = ${entity.mdast_id} -->`,
			} as any);
		}

		// Convert entity to MDast node
		const mdastNode = convertEntityToMdastNode(entity, entityMap);
		mdastRoot.children.push(mdastNode as any);
	}

	// Serialize to markdown using a simplified approach
	try {
		// For now, use a simple serialization to avoid version compatibility issues
		return serializeSimpleMarkdown(mdastRoot);
	} catch (error) {
		console.error("Failed to serialize markdown:", error);
		return "";
	}
}

/**
 * Convert entity to MDast node for serialization
 */
function convertEntityToMdastNode(
	entity: MdAstEntity,
	entityMap: Map<string, MdAstEntity>
): MdastNode {
	const mdastNode: any = {
		type: entity.type,
		...(entity.value && { value: entity.value }),
		...(entity.depth && { depth: entity.depth }),
		...(entity.ordered !== undefined && { ordered: entity.ordered }),
		...(entity.url && { url: entity.url }),
		...(entity.alt && { alt: entity.alt }),
		...(entity.title && { title: entity.title }),
		...(entity.lang && { lang: entity.lang }),
		...(entity.meta && { meta: entity.meta }),
		...(entity.align && { align: entity.align }),
		...(entity.position && { position: entity.position }),
	};

	// Process children
	if (entity.children) {
		if (Array.isArray(entity.children) && entity.children.length > 0) {
			if (typeof entity.children[0] === "string") {
				// Children are entity references
				mdastNode.children = (entity.children as string[])
					.map((childId) => entityMap.get(childId))
					.filter(Boolean)
					.map((childEntity) =>
						convertEntityToMdastNode(childEntity!, entityMap)
					);
			} else {
				// Children are inline entities
				mdastNode.children = (entity.children as any[]).map((childEntity) =>
					convertEntityToMdastNode(childEntity, entityMap)
				);
			}
		}
	}

	return mdastNode;
}

/**
 * Simple markdown serializer to avoid unified plugin version conflicts
 */
function serializeSimpleMarkdown(root: MdastRoot): string {
	const lines: string[] = [];

	for (const child of root.children) {
		const serialized = serializeNode(child as any);
		if (serialized) {
			lines.push(serialized);
		}
	}

	return lines.join("\n\n");
}

function serializeNode(node: any): string {
	switch (node.type) {
		case "paragraph":
			return serializeChildren(node);
		case "heading": {
			const level = "#".repeat(node.depth || 1);
			return `${level} ${serializeChildren(node)}`;
		}
		case "text":
			return node.value || "";
		case "strong":
			return `**${serializeChildren(node)}**`;
		case "emphasis":
			return `_${serializeChildren(node)}_`;
		case "link":
			return `[${serializeChildren(node)}](${node.url || ""})`;
		case "list":
			return serializeList(node);
		case "listItem":
			return serializeChildren(node);
		case "code": {
			const lang = node.lang ? node.lang : "";
			return `\`\`\`${lang}\n${node.value || ""}\n\`\`\``;
		}
		case "inlineCode":
			return `\`${node.value || ""}\``;
		default:
			return serializeChildren(node) || node.value || "";
	}
}

function serializeChildren(node: any): string {
	if (!node.children) return "";
	return node.children.map((child: any) => serializeNode(child)).join("");
}

function serializeList(node: any): string {
	if (!node.children) return "";
	const marker = node.ordered ? "1. " : "- ";
	return node.children
		.map((item: any) => `${marker}${serializeNode(item)}`)
		.join("\n");
}
