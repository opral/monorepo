// import { image } from "html2canvas/dist/types/css/types/image";

type TreeNode = {
	type: string;
	children?: TreeNode[];
} & Record<string, any>;

const rules = {
	text: {
		// no children allowed
		allowedChildren: [],
		exactChildren: 0,
		// only value attribute is valid
		allowedAttributes: { value: null },
	},
	// nested formatting not supported yet
	// TODO check if whitelist works with changes comming from plate
	strong: {
		allowedChildren: [
			"break",
			"text",
			"inlineCode",
			"emphasis",
			"delete",
			"link",
		],
	},
	inlineCode: {
		allowedChildren: ["break", "text", "strong", "emphasis", "delete", "link"],
	},
	emphasis: {
		allowedChildren: [
			"break",
			"text",
			"strong",
			"inlineCode",
			"delete",
			"link",
		],
	},
	delete: {
		allowedChildren: [
			"break",
			"text",
			"strong",
			"inlineCode",
			"emphasis",
			"link",
		],
	},
	break: { allowedChildren: [], exactChildren: 0 },
	thematicBreak: { allowedChildren: [], exactChildren: 0 },
	link: {
		// nested formatting not supported also for links atm
		// TODO check if whitelist works with changes comming from plate
		allowedChildren: [
			"text",
			"strong",
			"inlineCode",
			"emphasis",
			"delete",
			"link",
		],
		exactChildren: 1,
		// TODO whitelist all urls, but only title attribute set to null for now (plate does not support tiltle for links)
		allowedAttributes: { title: [null], url: null },
	},
	code: {
		exactChildren: 0,
		allowedAttributes: {
			value: null,
			lang: null,
			// only allow meta to be defined as null
			meta: [null],
		},
		// to detect code blocks and remove them from the allowlist - check the original markdown
		validateFn: (node: any, file: any) => {
			const first4Characters = file.value.substring(
				node.position.start.offset,
				node.position.start.offset + 4
			);

			if (first4Characters === "````") {
				return "code block with ```` is not supported";
			}
			return;
		},
	},
	list: {
		allowedChildren: [
			// TODO add html break
			"listItem",
		],
		exactChildren: null,
		allowedAttributes: {
			spread: null,
			ordered: [true, false],
			start: null,
		},
	},
	listItem: {
		allowedChildren: [
			// TODO add html break
			"paragraph",
			"list",
		],

		allowedAttributes: {
			checked: null,
			spread: null,
		},
	},
	image: {},
	paragraph: {
		allowedChildren: [
			// TODO add html break
			"break",
			"text",
			"strong",
			"inlineCode",
			"emphasis",
			"delete",
			"link",
			"html",
			"image",
		],
		exactChildren: null,
		allowedAttributes: [],
	},
	heading: {
		allowedChildren: [
			"text",
			"strong",
			"inlineCode",
			"emphasis",
			"delete",
			"link",
		],
		exactChildren: null,
	},
	html: {
		validateFn: (node: any) => {
			if (node.value === "<p><br /></p>") {
				return;
			}
			if (node.value === "<br />") {
				return;
			}

			return "html is not supported";
		},
	},
	blockquote: {
		// only allow paragraphs in blockquotes - nesting is also not supported in plate atm
		allowedChildren: ["paragraph"],
		exactChildren: null,
	},
};

function toSanitizedNode(node: TreeNode, file: any, reason: string) {
	const rawValue = file.value.substring(
		node.position.start.offset,
		node.position.end.offset
	);

	node.type = "sanitized_block";
	node.value = rawValue;
	node.reason = reason;
	node._children = node.children;
	node.children = [];

	console.warn("Node sanitized", node);
}

function sanatizeUnknownNodeStructures(node: TreeNode, file: any): boolean {
	// @ts-expect-error -- TODO check custom type
	const rule = rules[node.type];

	if (!rule) {
		toSanitizedNode(node, file, "node type not supported: " + node.type);
		return true; // we don't have to visit the children if the parent is sanitized
	}

	// Validate attributes
	if (rule.allowedAttributes) {
		for (const attr in node) {
			if (
				attr === "children" ||
				attr === "type" ||
				attr === "position" ||
				rule.allowedAttributes[attr] === null
			) {
				continue;
			}

			if (
				!(rule.allowedAttributes[attr] === null) &&
				!rule.allowedAttributes[attr].includes(node[attr])
			) {
				toSanitizedNode(
					node,
					file,
					"attribute not supported: " + attr + " in " + node.type
				);
				return true;
			}
		}
	}

	// Validate children
	if (node.children) {
		const childTypes = node.children.map((child) => child.type);

		if (
			rule.exactChildren !== null &&
			childTypes.length !== rule.exactChildren
		) {
			node.invalid = true;
		}

		let oneChildInvalid = false;

		for (const child of node.children) {
			if (!rule.allowedChildren.includes(child.type)) {
				toSanitizedNode(
					node,
					file,
					"child type not supported: " + child.type + " in " + node.type
				);
				return true;
			}

			oneChildInvalid =
				sanatizeUnknownNodeStructures(child, file) || oneChildInvalid;
		}

		if (oneChildInvalid) {
			toSanitizedNode(node, file, "child type not supported in " + node.type);
			return true;
		}
	}

	if (rule.validateFn) {
		const reason = rule.validateFn(node, file);
		if (reason !== undefined) {
			toSanitizedNode(node, file, reason);
			return false;
		}
	}

	return false;
}

export function sanatizeUnknownNodeStructuresInTree() {
	return (rootNode: any, file: any) => {
		// debugger;
		for (const node of rootNode.children) {
			sanatizeUnknownNodeStructures(node, file);
		}
	};
}
