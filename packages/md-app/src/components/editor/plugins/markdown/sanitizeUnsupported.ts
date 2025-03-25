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
	strong: { allowedChildren: ["text"], exactChildren: 1 },
	inlineCode: { allowedChildren: ["text"], exactChildren: 1 },
	emphasis: { allowedChildren: ["text"], exactChildren: 1 },

	link: {
		// nested formatting not supported also for links atm
		// TODO check if whitelist works with changes comming from plate
		allowedChildren: ["text"],
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
		// to detect code blocks and remove them from the whitelist - check the original markdown
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
	paragraph: {
		allowedChildren: [
			"text",
			"strong",
			"inlineCode",
			"emphasis",
			"delete",
			"link",
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
}

export function sanatizeUnknownNodeStructuresInTree() {
	return (rootNode: any, file: any) => {
		for (const node of rootNode.children) {
			sanatizeUnknownNodeStructures(node, file);
		}

		console.log("sanatizeUnknownNodeStructuresInTree result:");
		console.log(JSON.parse(JSON.stringify(rootNode)));
	};
}

export function sanatizeUnknownNodeStructures(node: TreeNode, file: any) {
	// @ts-expect-error -- TODO check custom type
	const rule = rules[node.type];

	if (!rule) {
		toSanitizedNode(
			node,
			file,
			"node type not supported: " + node.type + " in " + node.type
		);
		return; // we don't have to visit the children if the parent is sanitized
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
				return;
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

		for (const child of node.children) {
			if (!rule.allowedChildren.includes(child.type)) {
				toSanitizedNode(
					node,
					file,
					"child type not supported: " + child.type + " in " + node.type
				);
				return;
			}

			sanatizeUnknownNodeStructures(child, file);
		}
	}

	if (rule.validateFn) {
		const reason = rule.validateFn(node, file);
		if (reason !== undefined) {
			toSanitizedNode(node, file, reason);
			return;
		}
	}

	return;
}
