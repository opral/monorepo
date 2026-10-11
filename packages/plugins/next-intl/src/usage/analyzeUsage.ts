import { parse } from "@babel/parser";
import type {
	AnalyzeUsage,
	UsageAnalysis,
	UsageIssue,
	UsageReference,
} from "@inlang/sdk";
import { PLUGIN_KEY } from "../pluginKey.js";
import { extractMdx, type Segment } from "./mdx.js";

/**
 * Which messages a next-intl (or use-intl) app uses.
 *
 * A message `Home.title` is used by `useTranslations("Home")` or
 * `getTranslations("Home")` followed by `t("title")`, `t.rich("title")` or
 * `t.markup("title")`, or by `t("Home.title")` on a translator without a
 * namespace. Bundle IDs are the nested JSON keys joined with dots, as the
 * plugin imports them, so usages match bundle IDs exactly.
 *
 * Anything that can't be resolved makes the analysis incomplete, with the
 * construct's location: then no message is reported unused, and none is
 * deleted. That is the case when a translator, a message catalog or a
 * next-intl function escapes analysis (passed to a function or component,
 * returned, exported, stored), when a key or namespace is dynamic, when code
 * reads the catalog (`useMessages()`, an imported message file), and for
 * `t.raw()` and `t.has()`, which can read a whole namespace.
 *
 * The analysis is per file and flow-insensitive: a variable that is a
 * translator anywhere is one everywhere, which can only count more usages.
 */
export const analyzeUsage: AnalyzeUsage = ({ files, settings }) => {
	if (
		files.length > 10_000 ||
		files.reduce((size, file) => size + file.content.length, 0) > 50_000_000
	)
		return {
			usedBundleIds: [],
			status: "incomplete",
			issues: [
				{
					reason:
						"Source snapshot exceeds the 10,000-file or 50-million-character analysis limit.",
				},
			],
		};
	const used = new Set<string>();
	const issues: UsageIssue[] = [];
	const references: UsageReference[] = [];
	// `t.raw(key)` and `t.has(key)` read a whole namespace if `key` is one. A key that is also
	// translated with `t(key)` is a message, so the issue is only kept for the others.
	const subtreeReads: { bundleId: string; issue: UsageIssue }[] = [];
	const leaves = new Set<string>();
	const catalog = catalogFiles(settings);
	for (const file of files) {
		if (!SUPPORTED.test(file.path)) {
			issues.push({
				path: file.path,
				reason:
					"Unsupported source format. Supply JavaScript, TypeScript or MDX files.",
			});
			continue;
		}
		if (file.content.length > 2_000_000) {
			issues.push({
				path: file.path,
				reason: "Source exceeds the 2-million-character analysis limit.",
			});
			continue;
		}
		let program: Node;
		let segments: Segment[] | undefined;
		try {
			if (/\.mdx$/i.test(file.path)) {
				const extracted = extractMdx(file.content);
				segments = extracted.segments;
				program = (
					parse(extracted.code, {
						sourceType: "module",
						plugins: ["jsx"],
					}) as unknown as { program: Node }
				).program;
			} else program = parseScript(file.path, file.content);
		} catch (error) {
			issues.push({
				path: file.path,
				reason: `Cannot parse source: ${error instanceof Error ? error.message : String(error)}`,
			});
			continue;
		}
		const result = analyzeFile({
			path: file.path,
			content: file.content,
			program,
			segments,
			catalog,
		});
		for (const id of result.used) used.add(id);
		for (const id of result.leaves) leaves.add(id);
		references.push(...result.references);
		subtreeReads.push(...result.subtreeReads);
		issues.push(...result.issues);
	}
	for (const read of subtreeReads)
		if (!leaves.has(read.bundleId)) issues.push(read.issue);
	return {
		usedBundleIds: [...used],
		status: issues.length ? "incomplete" : "complete",
		issues,
		references,
	} satisfies UsageAnalysis;
};

const SUPPORTED = /\.(?:[cm]?[jt]sx?|mdx)$/i;

type Node = {
	type: string;
	start?: number | null;
	end?: number | null;
	[key: string]: unknown;
};
const isNode = (value: unknown): value is Node =>
	value !== null &&
	typeof value === "object" &&
	typeof (value as { type?: unknown }).type === "string";
const identifierName = (value: unknown): string | undefined =>
	isNode(value) && value.type === "Identifier"
		? (value.name as string)
		: undefined;
const IGNORED_KEYS = new Set([
	"loc",
	"extra",
	"comments",
	"leadingComments",
	"trailingComments",
	"innerComments",
	"tokens",
]);
function children(node: Node): { child: Node; key: string }[] {
	const result: { child: Node; key: string }[] = [];
	for (const key in node) {
		if (IGNORED_KEYS.has(key)) continue;
		const value = node[key];
		if (Array.isArray(value)) {
			for (const child of value) if (isNode(child)) result.push({ child, key });
		} else if (isNode(value)) result.push({ child: value, key });
	}
	return result;
}

type ParserPlugins = NonNullable<
	NonNullable<Parameters<typeof parse>[1]>["plugins"]
>;
/** JS/TS like the m-function matcher: JSX only where it is valid (`<string>x` is a TS cast). */
function parseScript(path: string, content: string): Node {
	const typescript = /\.(?:tsx?|mts|cts)$/i.test(path);
	const jsx = !/\.(?:ts|mts|cts)$/i.test(path);
	const script = /\.c[jt]s$/i.test(path);
	const base: ParserPlugins = [
		...(typescript ? (["typescript"] as const) : []),
		...(jsx ? (["jsx"] as const) : []),
	];
	let failure: unknown;
	const variants: ParserPlugins[] = [
		[...base, "decorators-legacy"],
		[
			...base,
			["decorators", { decoratorsBeforeExport: true }],
			"decoratorAutoAccessors",
		],
	];
	for (const plugins of variants) {
		try {
			return (
				parse(content, {
					sourceType: script ? "script" : "module",
					allowReturnOutsideFunction: script,
					plugins,
				}) as unknown as { program: Node }
			).program;
		} catch (error) {
			failure ??= error;
		}
	}
	throw failure;
}

/**
 * The tails of the message file paths, per locale, e.g. `en.json` for
 * `./messages/{locale}.json` or `en/common.json` for
 * `./messages/{locale}/common.json`. An import whose path ends with one of
 * them reads a message catalog. Without settings, every JSON file might be one.
 */
function catalogFiles(settings: Record<string, unknown>): string[] | undefined {
	const plugin = settings[PLUGIN_KEY] as
		| { pathPattern?: unknown; sourceLanguageFilePath?: unknown }
		| undefined;
	const patterns: string[] = [];
	const pathPattern = plugin?.pathPattern;
	if (typeof pathPattern === "string") patterns.push(pathPattern);
	else if (pathPattern && typeof pathPattern === "object")
		for (const value of Object.values(pathPattern))
			if (typeof value === "string") patterns.push(value);
	if (patterns.length === 0) return undefined;
	const locales = [
		settings.baseLocale,
		...(Array.isArray(settings.locales) ? settings.locales : []),
	].filter((locale): locale is string => typeof locale === "string");
	const tails = new Set<string>();
	for (const pattern of patterns) {
		const segments = pattern
			.split("/")
			.filter((segment) => segment && segment !== "." && segment !== "..");
		const first = segments.findIndex((segment) =>
			/\{(?:locale|languageTag)\}/.test(segment)
		);
		if (first === -1) return undefined;
		for (const locale of locales)
			tails.add(
				segments
					.slice(first)
					.join("/")
					.replace(/\{(?:locale|languageTag)\}/g, locale)
					.toLowerCase()
			);
	}
	const source = plugin?.sourceLanguageFilePath;
	if (typeof source === "string") {
		const name = source.split("/").pop();
		if (name) tails.add(name.toLowerCase());
	}
	return [...tails];
}

/** next-intl and use-intl, whose functions access messages. */
const INTL_MODULE = /^(?:next-intl|use-intl)(?:\/|$)/;
/** Modules of next-intl without message access: their default export isn't the API. */
const INTL_TOOLING =
	/^next-intl\/(?:plugin|middleware|navigation|routing|extractor)(?:\/|$)/;
/** Functions that return a translator, synchronously or as a promise. */
const TRANSLATOR_FACTORIES: Record<
	string,
	{ async: boolean; namespace: "first" | "object" | "second" | "none" }
> = {
	useTranslations: { async: false, namespace: "first" },
	getTranslations: { async: true, namespace: "first" },
	// next-intl 2: getTranslator(locale, namespace)
	getTranslator: { async: true, namespace: "second" },
	createTranslator: { async: false, namespace: "object" },
};
/** Functions that return every message. */
const CATALOG_FACTORIES: Record<string, { async: boolean }> = {
	useMessages: { async: false },
	getMessages: { async: true },
};
/** Translators whose keys are hashes of the source text: can't be mapped to bundle IDs. */
const EXTRACTED = new Set(["useExtracted", "getExtracted", "_useExtracted"]);
/** Types whose values are message keys. */
const KEY_TYPES = new Set(["MessageKeys", "NamespaceKeys", "NestedKeyOf"]);
const PROVIDERS = new Set(["NextIntlClientProvider", "IntlProvider"]);
const API = new Set([
	...Object.keys(TRANSLATOR_FACTORIES),
	...Object.keys(CATALOG_FACTORIES),
	...EXTRACTED,
	...KEY_TYPES,
	...PROVIDERS,
	"getRequestConfig",
]);
/** Translator methods that take a message key. */
const METHODS = new Set(["rich", "markup", "raw", "has"]);
/** Array methods that pass each element to the callback and can't add elements. */
const ITERATING = new Set([
	"map",
	"forEach",
	"flatMap",
	"filter",
	"some",
	"every",
	"find",
	"findIndex",
	"findLast",
	"findLastIndex",
]);
const READING = new Set([
	...ITERATING,
	"length",
	"includes",
	"indexOf",
	"lastIndexOf",
	"at",
	"join",
	"slice",
	"toSorted",
	"toReversed",
]);
/** React hooks whose dependency array only compares the translator. */
const DEPENDENCY_HOOKS: Record<string, number> = {
	useMemo: 1,
	useCallback: 1,
	useEffect: 1,
	useLayoutEffect: 1,
	useInsertionEffect: 1,
	useImperativeHandle: 2,
};
/** `import.meta` properties that can't load modules (like the m-function matcher). */
const IMPORT_META = new Set([
	"env",
	"url",
	"dirname",
	"filename",
	"hot",
	"resolve",
]);
/** TypeScript nodes that are (or contain) runtime code. Other `TS*` nodes are types. */
const RUNTIME_TS = new Set([
	"TSAsExpression",
	"TSSatisfiesExpression",
	"TSNonNullExpression",
	"TSTypeAssertion",
	"TSInstantiationExpression",
	"TSExportAssignment",
	"TSModuleDeclaration",
	"TSModuleBlock",
	"TSEnumDeclaration",
	"TSEnumBody",
	"TSEnumMember",
	"TSParameterProperty",
	"TSImportEqualsDeclaration",
	"TSExternalModuleReference",
]);
const WRAPPERS = new Set([
	"ParenthesizedExpression",
	"TSAsExpression",
	"TSSatisfiesExpression",
	"TSNonNullExpression",
	"TSTypeAssertion",
	"TSInstantiationExpression",
]);
const FUNCTIONS = new Set([
	"FunctionDeclaration",
	"FunctionExpression",
	"ArrowFunctionExpression",
	"ObjectMethod",
	"ClassMethod",
	"ClassPrivateMethod",
	"TSDeclareFunction",
	"TSDeclareMethod",
]);
const isMember = (node: Node | undefined): node is Node =>
	!!node &&
	(node.type === "MemberExpression" ||
		node.type === "OptionalMemberExpression");
const isCall = (node: Node | undefined): node is Node =>
	!!node &&
	(node.type === "CallExpression" || node.type === "OptionalCallExpression");
/** The name of `a.b`, `a["b"]` and ``a[`b`]``, else undefined. */
function propertyName(node: Node): string | undefined {
	const property = node.property ?? node.key;
	if (!node.computed) {
		if (isNode(property) && property.type === "Identifier")
			return property.name as string;
		if (isNode(property) && property.type === "StringLiteral")
			return property.value as string;
		if (isNode(property) && property.type === "NumericLiteral")
			return String(property.value);
		return undefined;
	}
	if (!isNode(property)) return undefined;
	if (property.type === "StringLiteral") return property.value as string;
	if (property.type === "NumericLiteral") return String(property.value);
	if (
		property.type === "TemplateLiteral" &&
		(property.expressions as unknown[]).length === 0
	)
		return (
			(property.quasis as Node[])[0]?.value as { cooked?: string } | undefined
		)?.cooked;
	return undefined;
}
const unwrap = (node: Node): Node =>
	WRAPPERS.has(node.type) && isNode(node.expression)
		? unwrap(node.expression)
		: node;

/*
 * Abstract values, as strings so that sets compare them:
 * - `t:<namespace>` a translator (`t:` without a namespace), `t?` one with an unknown namespace
 * - `m:<method>:<translator>` a translator method such as `t.rich`
 * - `p:<value>` a promise of a value
 * - `api:<name>` a next-intl function, component or type
 * - `mod` the next-intl module object, `cat` a message catalog, `catmod` a message file module
 * - `merge` a deep merge function: merging catalogs gives a catalog
 */
type Values = Set<string>;
const EMPTY: Values = new Set();
const translator = (namespace: string | null) =>
	namespace === null ? "t:" : `t:${namespace}`;
const namespaceOf = (value: string): string | undefined =>
	value.startsWith("t:") ? value.slice(2) : undefined;

type Binding = {
	name: string;
	kind: string;
	/** Expressions assigned to it, destructured along `path` (`undefined`: a computed key). */
	writes: { value?: Node; path: (string | undefined)[]; forOf?: Node }[];
	/** Assigned after its declaration. */
	reassigned: boolean;
	preset: Values;
	references: { node: Node; parent: Node; key: string }[];
	/** The function whose parameter it is, and the position. */
	parameterOf?: { fn: Node; index: number };
	/** Where it is exported. */
	exported?: Node;
};
type Scope = {
	parent?: Scope;
	isFunction: boolean;
	bindings: Map<string, Binding>;
};

function analyzeFile(args: {
	path: string;
	content: string;
	program: Node;
	segments: Segment[] | undefined;
	catalog: string[] | undefined;
}) {
	const { path, content, program, segments, catalog } = args;
	const used = new Set<string>();
	const leaves = new Set<string>();
	const references: UsageReference[] = [];
	const subtreeReads: { bundleId: string; issue: UsageIssue }[] = [];
	const unresolved = new Map<string, UsageIssue>();

	let lineStarts: number[] | undefined;
	const position = (offset: number) => {
		lineStarts ??= [
			0,
			...[...content.matchAll(/\n/g)].map((match) => match.index! + 1),
		];
		let low = 0,
			high = lineStarts.length - 1;
		while (low < high) {
			const middle = (low + high + 1) >> 1;
			if (lineStarts[middle]! <= offset) low = middle;
			else high = middle - 1;
		}
		return { line: low + 1, column: offset - lineStarts[low]! };
	};
	/** The source offset of a generated offset: MDX code maps back through its segments. */
	const original = (offset: number, end: boolean): number => {
		if (!segments) return offset;
		let result: number | undefined;
		for (const segment of segments) {
			const from = segment.generated;
			const to = segment.generated + segment.length;
			if (offset >= from && offset <= to)
				return segment.original + (offset - from);
			if (!end && offset < from) return segment.original;
			if (end && offset > to) result = segment.original + segment.length;
		}
		return result ?? segments[0]?.original ?? 0;
	};
	const located = (node: Node) =>
		typeof node.start === "number" && typeof node.end === "number"
			? {
					start: position(original(node.start, false)),
					end: position(original(node.end, true)),
				}
			: undefined;
	const unresolve = (reason: string, at: Node) => {
		const location = located(at);
		const id = `${at.start}:${at.end}:${reason}`;
		if (!unresolved.has(id))
			unresolved.set(id, { path, reason, ...(location ?? {}) });
	};
	const refer = (bundleId: string, at: Node) => {
		const location = located(at);
		if (location) references.push({ bundleId, path, ...location });
	};
	const isCatalogPath = (specifier: string): boolean => {
		const file = specifier.replace(/[?#].*$/, "").toLowerCase();
		if (!file.endsWith(".json")) return false;
		return (
			catalog === undefined ||
			catalog.some((tail) => file === tail || file.endsWith(`/${tail}`))
		);
	};

	// ---- 1. Scopes, bindings and references ----
	const parents = new Map<Node, { parent: Node; key: string }>();
	const scopeOf = new Map<Node, Scope>();
	const valueNodes: Node[] = [];
	const pendingReferences: {
		node: Node;
		scope: Scope;
		parent: Node;
		key: string;
	}[] = [];
	const pendingWrites: {
		node: Node;
		scope: Scope;
		write: Binding["writes"][number] | undefined;
	}[] = [];
	const typeNodes: { node: Node; scope: Scope }[] = [];
	const jsxNames: { node: Node; scope: Scope }[] = [];
	const exportedDeclarations: Node[] = [];
	const bindingOf = new Map<Node, Binding>();

	const newScope = (parent: Scope | undefined, isFunction: boolean): Scope => ({
		parent,
		isFunction,
		bindings: new Map(),
	});
	const functionScope = (scope: Scope): Scope => {
		let current = scope;
		while (!current.isFunction && current.parent) current = current.parent;
		return current;
	};
	const declare = (
		identifier: Node,
		scope: Scope,
		kind: string,
		write?: Binding["writes"][number],
		parameterOf?: Binding["parameterOf"]
	): Binding => {
		const name = identifier.name as string;
		const target = kind === "var" ? functionScope(scope) : scope;
		let binding = target.bindings.get(name);
		if (!binding) {
			binding = {
				name,
				kind,
				writes: [],
				reassigned: false,
				preset: new Set(),
				references: [],
				...(parameterOf ? { parameterOf } : {}),
			};
			target.bindings.set(name, binding);
		} else {
			// a redeclaration (`var`, function overloads): any of them can hold the value
			binding.reassigned = true;
		}
		if (write) binding.writes.push(write);
		bindingOf.set(identifier, binding);
		return binding;
	};
	const lookup = (scope: Scope, name: string): Binding | undefined => {
		for (
			let current: Scope | undefined = scope;
			current;
			current = current.parent
		) {
			const binding = current.bindings.get(name);
			if (binding) return binding;
		}
		return undefined;
	};

	/** Declares the identifiers of a binding pattern; walks its defaults and computed keys. */
	const declarePattern = (
		pattern: Node,
		parent: Node,
		key: string,
		scope: Scope,
		kind: string,
		write: Binding["writes"][number] | undefined,
		parameterOf?: Binding["parameterOf"]
	) => {
		parents.set(pattern, { parent, key });
		scopeOf.set(pattern, scope);
		const path = write?.path ?? [];
		const nested = (part: string | undefined) =>
			write ? { ...write, path: [...path, part] } : undefined;
		switch (pattern.type) {
			case "Identifier":
				declare(pattern, scope, kind, write, parameterOf);
				if (isNode(pattern.typeAnnotation))
					walk(pattern.typeAnnotation, pattern, "typeAnnotation", scope, true);
				return;
			case "ObjectPattern":
				for (const property of pattern.properties as Node[]) {
					parents.set(property, { parent: pattern, key: "properties" });
					scopeOf.set(property, scope);
					if (property.type === "RestElement")
						declarePattern(
							property.argument as Node,
							property,
							"argument",
							scope,
							kind,
							nested(undefined)
						);
					else {
						if (property.computed)
							walk(property.key as Node, property, "key", scope, false);
						declarePattern(
							property.value as Node,
							property,
							"value",
							scope,
							kind,
							nested(propertyName(property))
						);
					}
				}
				break;
			case "ArrayPattern":
				for (const element of pattern.elements as (Node | null)[])
					if (element)
						declarePattern(
							element.type === "RestElement"
								? (element.argument as Node)
								: element,
							pattern,
							"elements",
							scope,
							kind,
							nested(undefined)
						);
				break;
			case "RestElement":
				declarePattern(
					pattern.argument as Node,
					pattern,
					"argument",
					scope,
					kind,
					nested(undefined)
				);
				break;
			case "AssignmentPattern":
				declarePattern(
					pattern.left as Node,
					pattern,
					"left",
					scope,
					kind,
					write,
					parameterOf
				);
				// the default flows into the binding too
				declarePattern(pattern.left as Node, pattern, "left", scope, kind, {
					value: pattern.right as Node,
					path: [],
				});
				walk(pattern.right as Node, pattern, "right", scope, false);
				break;
			case "TSParameterProperty":
				declarePattern(
					pattern.parameter as Node,
					pattern,
					"parameter",
					scope,
					kind,
					write,
					parameterOf
				);
				break;
			default:
				// e.g. a member expression in a for-of head of an assignment
				walk(pattern, parent, key, scope, false);
		}
		if (isNode(pattern.typeAnnotation))
			walk(pattern.typeAnnotation, pattern, "typeAnnotation", scope, true);
	};

	/** Records the identifiers an assignment pattern writes; walks the rest as expressions. */
	const assignPattern = (
		pattern: Node,
		parent: Node,
		key: string,
		scope: Scope,
		write: Binding["writes"][number] | undefined
	) => {
		parents.set(pattern, { parent, key });
		scopeOf.set(pattern, scope);
		const path = write?.path ?? [];
		const nested = (part: string | undefined) =>
			write ? { ...write, path: [...path, part] } : undefined;
		switch (pattern.type) {
			case "Identifier":
				pendingWrites.push({ node: pattern, scope, write });
				return;
			case "ObjectPattern":
				for (const property of pattern.properties as Node[]) {
					parents.set(property, { parent: pattern, key: "properties" });
					scopeOf.set(property, scope);
					if (property.type === "RestElement")
						assignPattern(
							property.argument as Node,
							property,
							"argument",
							scope,
							nested(undefined)
						);
					else {
						if (property.computed)
							walk(property.key as Node, property, "key", scope, false);
						assignPattern(
							property.value as Node,
							property,
							"value",
							scope,
							nested(propertyName(property))
						);
					}
				}
				return;
			case "ArrayPattern":
				for (const element of pattern.elements as (Node | null)[])
					if (element)
						assignPattern(
							element.type === "RestElement"
								? (element.argument as Node)
								: element,
							pattern,
							"elements",
							scope,
							nested(undefined)
						);
				return;
			case "RestElement":
				assignPattern(
					pattern.argument as Node,
					pattern,
					"argument",
					scope,
					nested(undefined)
				);
				return;
			case "AssignmentPattern":
				assignPattern(pattern.left as Node, pattern, "left", scope, write);
				assignPattern(pattern.left as Node, pattern, "left", scope, {
					value: pattern.right as Node,
					path: [],
				});
				walk(pattern.right as Node, pattern, "right", scope, false);
				return;
			default:
				// `obj.prop = value`, `(t as any) = value`
				walk(pattern, parent, key, scope, false);
		}
	};

	const declareFunction = (fn: Node, scope: Scope) => {
		const inner = newScope(scope, true);
		scopeOf.set(fn, inner);
		if (fn.type === "FunctionExpression" && isNode(fn.id))
			declare(fn.id, inner, "function");
		(fn.params as Node[]).forEach((parameter, index) =>
			declarePattern(parameter, fn, "params", inner, "param", undefined, {
				fn,
				index,
			})
		);
		for (const key of ["typeParameters", "returnType", "predicate"])
			if (isNode(fn[key])) walk(fn[key] as Node, fn, key, inner, true);
		for (const decorator of (fn.decorators as Node[] | undefined) ?? [])
			walk(decorator, fn, "decorators", scope, false);
		if (fn.computed && isNode(fn.key)) walk(fn.key, fn, "key", scope, false);
		const body = fn.body;
		if (!isNode(body)) return;
		parents.set(body, { parent: fn, key: "body" });
		scopeOf.set(body, inner);
		if (body.type === "BlockStatement") {
			valueNodes.push(body);
			for (const statement of body.body as Node[])
				walk(statement, body, "body", inner, false);
		} else walk(body, fn, "body", inner, false);
	};

	const walk = (
		node: Node,
		parent: Node | undefined,
		key: string | undefined,
		scope: Scope,
		typeMode: boolean
	): void => {
		if (parent && key) parents.set(node, { parent, key });
		scopeOf.set(node, scope);
		if (
			!typeMode &&
			(FUNCTIONS.has(node.type)
				? node.type === "TSDeclareFunction" ||
					node.type === "TSDeclareMethod" ||
					node.declare === true
				: (node.type.startsWith("TS") && !RUNTIME_TS.has(node.type)) ||
					(node.type === "VariableDeclaration" && node.declare === true) ||
					(node.type === "ClassDeclaration" && node.declare === true) ||
					node.type === "InterfaceDeclaration")
		)
			typeMode = true;
		if (typeMode) {
			if (
				node.type === "TSTypeQuery" ||
				node.type === "TSTypeReference" ||
				node.type === "TSImportType"
			)
				typeNodes.push({ node, scope });
			// identifiers of `typeof a.b` and type names are resolved by the type checks
			for (const { child, key: childKey } of children(node))
				walk(child, node, childKey, scope, true);
			return;
		}
		valueNodes.push(node);
		switch (node.type) {
			case "Program": {
				for (const statement of node.body as Node[])
					walk(statement, node, "body", scope, false);
				return;
			}
			case "ImportDeclaration": {
				const source = (node.source as Node).value as string;
				parents.set(node.source as Node, { parent: node, key: "source" });
				for (const specifier of node.specifiers as Node[]) {
					parents.set(specifier, { parent: node, key: "specifiers" });
					const local = specifier.local as Node;
					parents.set(local, { parent: specifier, key: "local" });
					const binding = declare(local, scope, "import");
					const imported =
						specifier.type === "ImportSpecifier"
							? (identifierName(specifier.imported) ??
								((specifier.imported as Node).value as string))
							: undefined;
					for (const value of importValues(
						source,
						specifier.type,
						imported,
						specifier
					))
						binding.preset.add(value);
				}
				return;
			}
			case "ExportNamedDeclaration":
			case "ExportAllDeclaration": {
				const source = isNode(node.source)
					? (node.source.value as string)
					: undefined;
				if (source !== undefined) {
					if (node.type === "ExportAllDeclaration")
						checkReexport(source, undefined, node);
					else
						for (const specifier of node.specifiers as Node[])
							checkReexport(
								source,
								specifier.type === "ExportSpecifier"
									? (identifierName(specifier.local) ??
											((specifier.local as Node).value as string))
									: undefined,
								specifier
							);
					return;
				}
				if (isNode(node.declaration)) {
					exportedDeclarations.push(node.declaration);
					walk(node.declaration, node, "declaration", scope, false);
				}
				for (const specifier of (node.specifiers as Node[]) ?? []) {
					parents.set(specifier, { parent: node, key: "specifiers" });
					scopeOf.set(specifier, scope);
					const local = specifier.local;
					if (isNode(local) && local.type === "Identifier")
						walk(local, specifier, "local", scope, false);
				}
				return;
			}
			case "VariableDeclaration": {
				const kind = node.kind as string;
				for (const declarator of node.declarations as Node[]) {
					parents.set(declarator, { parent: node, key: "declarations" });
					scopeOf.set(declarator, scope);
					valueNodes.push(declarator);
					const forOf = forOfHead(node);
					declarePattern(
						declarator.id as Node,
						declarator,
						"id",
						scope,
						kind === "var" ? "var" : kind,
						forOf
							? { forOf, path: [] }
							: isNode(declarator.init)
								? { value: declarator.init, path: [] }
								: undefined
					);
					if (isNode(declarator.init))
						walk(declarator.init, declarator, "init", scope, false);
				}
				return;
			}
			case "FunctionDeclaration": {
				if (isNode(node.id)) declare(node.id, scope, "function");
				declareFunction(node, scope);
				return;
			}
			case "FunctionExpression":
			case "ArrowFunctionExpression":
			case "ObjectMethod":
			case "ClassMethod":
			case "ClassPrivateMethod": {
				declareFunction(node, scope);
				return;
			}
			case "ClassDeclaration":
			case "ClassExpression": {
				let inner = scope;
				if (isNode(node.id)) {
					if (node.type === "ClassDeclaration")
						declare(node.id, scope, "class");
					else {
						inner = newScope(scope, false);
						declare(node.id, inner, "class");
					}
				}
				for (const { child, key: childKey } of children(node)) {
					if (childKey === "id") continue;
					if (childKey === "body") {
						parents.set(child, { parent: node, key: childKey });
						scopeOf.set(child, inner);
						for (const member of child.body as Node[]) {
							if (
								member.type === "ClassProperty" ||
								member.type === "ClassPrivateProperty" ||
								member.type === "ClassAccessorProperty"
							) {
								parents.set(member, { parent: child, key: "body" });
								scopeOf.set(member, inner);
								valueNodes.push(member);
								if (member.computed && isNode(member.key))
									walk(member.key, member, "key", inner, false);
								for (const decorator of (member.decorators as
									| Node[]
									| undefined) ?? [])
									walk(decorator, member, "decorators", inner, false);
								if (isNode(member.typeAnnotation))
									walk(
										member.typeAnnotation,
										member,
										"typeAnnotation",
										inner,
										true
									);
								if (isNode(member.value))
									walk(
										member.value,
										member,
										"value",
										newScope(inner, true),
										false
									);
							} else if (member.type === "StaticBlock") {
								parents.set(member, { parent: child, key: "body" });
								const block = newScope(inner, true);
								scopeOf.set(member, block);
								for (const statement of member.body as Node[])
									walk(statement, member, "body", block, false);
							} else walk(member, child, "body", inner, false);
						}
						continue;
					}
					walk(child, node, childKey, inner, false);
				}
				return;
			}
			case "BlockStatement":
			case "StaticBlock":
			case "TSModuleBlock": {
				const inner = newScope(scope, node.type !== "BlockStatement");
				scopeOf.set(node, inner);
				for (const statement of node.body as Node[])
					walk(statement, node, "body", inner, false);
				return;
			}
			case "TSModuleDeclaration": {
				if (isNode(node.body)) walk(node.body, node, "body", scope, false);
				return;
			}
			case "TSEnumDeclaration": {
				if (isNode(node.id)) declare(node.id, scope, "const");
				const inner = newScope(scope, false);
				for (const { child, key: childKey } of children(node))
					if (childKey !== "id") walk(child, node, childKey, inner, false);
				return;
			}
			case "TSEnumMember": {
				if (isNode(node.initializer))
					walk(node.initializer, node, "initializer", scope, false);
				return;
			}
			case "TSImportEqualsDeclaration": {
				if (isNode(node.id)) declare(node.id, scope, "import");
				const reference = node.moduleReference;
				if (
					isNode(reference) &&
					reference.type === "TSExternalModuleReference"
				) {
					const source = (reference.expression as Node).value as string;
					if (INTL_MODULE.test(source) || isCatalogPath(source))
						unresolve(
							"CommonJS TypeScript imports of next-intl or message files are unsupported.",
							node
						);
				}
				return;
			}
			case "ForStatement":
			case "ForInStatement":
			case "ForOfStatement": {
				const inner = newScope(scope, false);
				scopeOf.set(node, inner);
				for (const { child, key: childKey } of children(node)) {
					if (
						(childKey === "left" || childKey === "init") &&
						child.type !== "VariableDeclaration" &&
						node.type !== "ForStatement"
					) {
						assignPattern(
							child,
							node,
							childKey,
							inner,
							node.type === "ForOfStatement"
								? { forOf: node.right as Node, path: [] }
								: undefined
						);
						continue;
					}
					walk(child, node, childKey, inner, false);
				}
				return;
			}
			case "CatchClause": {
				const inner = newScope(scope, false);
				scopeOf.set(node, inner);
				if (isNode(node.param))
					declarePattern(node.param, node, "param", inner, "catch", undefined);
				walk(node.body as Node, node, "body", inner, false);
				return;
			}
			case "SwitchStatement": {
				walk(node.discriminant as Node, node, "discriminant", scope, false);
				const inner = newScope(scope, false);
				for (const switchCase of node.cases as Node[])
					walk(switchCase, node, "cases", inner, false);
				return;
			}
			case "AssignmentExpression": {
				const left = node.left as Node;
				walk(node.right as Node, node, "right", scope, false);
				if (
					left.type === "Identifier" ||
					left.type === "ObjectPattern" ||
					left.type === "ArrayPattern"
				)
					assignPattern(
						left,
						node,
						"left",
						scope,
						node.operator === "=" ||
							node.operator === "||=" ||
							node.operator === "&&=" ||
							node.operator === "??="
							? { value: node.right as Node, path: [] }
							: undefined
					);
				else walk(left, node, "left", scope, false);
				return;
			}
			case "UpdateExpression": {
				const argument = node.argument as Node;
				if (argument.type === "Identifier")
					pendingWrites.push({ node: argument, scope, write: undefined });
				walk(argument, node, "argument", scope, false);
				return;
			}
			case "Identifier": {
				pendingReferences.push({ node, scope, parent: parent!, key: key! });
				if (isNode(node.typeAnnotation))
					walk(node.typeAnnotation, node, "typeAnnotation", scope, true);
				return;
			}
			case "MemberExpression":
			case "OptionalMemberExpression": {
				walk(node.object as Node, node, "object", scope, false);
				if (node.computed)
					walk(node.property as Node, node, "property", scope, false);
				return;
			}
			case "ObjectProperty": {
				if (node.computed) walk(node.key as Node, node, "key", scope, false);
				walk(node.value as Node, node, "value", scope, false);
				return;
			}
			case "ClassProperty":
			case "ClassPrivateProperty":
			case "ClassAccessorProperty": {
				// outside a class body (not expected); treat like the class body does
				if (node.computed && isNode(node.key))
					walk(node.key, node, "key", scope, false);
				if (isNode(node.value))
					walk(node.value, node, "value", newScope(scope, true), false);
				return;
			}
			case "LabeledStatement": {
				walk(node.body as Node, node, "body", scope, false);
				return;
			}
			case "BreakStatement":
			case "ContinueStatement":
			case "MetaProperty":
			case "PrivateName":
			case "JSXClosingElement":
				return;
			case "JSXOpeningElement": {
				jsxNames.push({ node, scope });
				for (const attribute of node.attributes as Node[])
					walk(attribute, node, "attributes", scope, false);
				if (isNode(node.typeArguments ?? node.typeParameters))
					walk(
						(node.typeArguments ?? node.typeParameters) as Node,
						node,
						"typeArguments",
						scope,
						true
					);
				return;
			}
			case "JSXAttribute": {
				if (isNode(node.value)) walk(node.value, node, "value", scope, false);
				return;
			}
			case "WithStatement": {
				unresolve("A with statement makes names unresolvable.", node);
				break;
			}
		}
		for (const { child, key: childKey } of children(node))
			walk(child, node, childKey, scope, false);
	};

	const forOfHead = (declaration: Node): Node | undefined => {
		const parent = parents.get(declaration);
		return parent?.parent.type === "ForOfStatement" && parent.key === "left"
			? (parent.parent.right as Node)
			: undefined;
	};

	/** The values an import binding has. */
	function importValues(
		source: string,
		type: string,
		imported: string | undefined,
		at: Node
	): string[] {
		if (INTL_MODULE.test(source)) {
			if (/^next-intl\/config(?:\/|$)/.test(source)) {
				unresolve(
					"next-intl/config is the request configuration, which can read every message.",
					at
				);
				return [];
			}
			if (type === "ImportSpecifier")
				return imported !== undefined && API.has(imported)
					? [`api:${imported}`]
					: [];
			return INTL_TOOLING.test(source) ? [] : ["mod"];
		}
		if (source === "deepmerge" && type === "ImportDefaultSpecifier")
			return ["merge"];
		if (
			/^(?:lodash|lodash-es)$/.test(source) &&
			type === "ImportSpecifier" &&
			imported === "merge"
		)
			return ["merge"];
		if (
			/^(?:lodash[./]merge|lodash-es\/merge)$/.test(source) &&
			type === "ImportDefaultSpecifier"
		)
			return ["merge"];
		if (isCatalogPath(source))
			return [type === "ImportNamespaceSpecifier" ? "catmod" : "cat"];
		return [];
	}
	function checkReexport(source: string, name: string | undefined, at: Node) {
		if (
			(INTL_MODULE.test(source) &&
				!INTL_TOOLING.test(source) &&
				(name === undefined || name === "default" || API.has(name))) ||
			isCatalogPath(source)
		)
			unresolve(
				"next-intl functions or messages are re-exported; their usage elsewhere can't be resolved.",
				at
			);
	}

	const rootScope = newScope(undefined, true);
	walk(program, undefined, undefined, rootScope, false);

	const resolved = new Map<Node, Binding>();
	for (const { node, scope, parent, key } of pendingReferences) {
		const binding = lookup(scope, node.name as string);
		if (!binding) continue;
		resolved.set(node, binding);
		binding.references.push({ node, parent, key });
	}
	for (const { node, scope, write } of pendingWrites) {
		const binding = lookup(scope, node.name as string);
		if (!binding) continue;
		binding.reassigned = true;
		binding.writes.push(write ?? { path: [] });
	}
	for (const [node, binding] of bindingOf) resolved.set(node, binding);
	for (const declaration of exportedDeclarations) {
		const mark = (pattern: unknown) => {
			if (!isNode(pattern)) return;
			if (pattern.type === "Identifier") {
				const binding = bindingOf.get(pattern);
				if (binding) binding.exported = pattern;
			} else if (pattern.type === "ObjectPattern")
				for (const property of pattern.properties as Node[])
					mark(
						property.type === "RestElement" ? property.argument : property.value
					);
			else if (pattern.type === "ArrayPattern")
				for (const element of pattern.elements as Node[]) mark(element);
			else if (pattern.type === "RestElement") mark(pattern.argument);
			else if (pattern.type === "AssignmentPattern") mark(pattern.left);
		};
		if (declaration.type === "VariableDeclaration")
			for (const declarator of declaration.declarations as Node[])
				mark(declarator.id);
		else mark(declaration.id);
	}

	// ---- 2. Values of bindings (flow-insensitive fixpoint) ----
	const bindingValues = new Map<Binding, Values>();
	let memo = new Map<Node, Values>();
	const valuesOf = (binding: Binding): Values =>
		bindingValues.get(binding) ?? binding.preset;
	const member = (values: Values, name: string | undefined): Values => {
		const result: Values = new Set();
		for (const value of values) {
			if (value === "mod" && name !== undefined) {
				if (name === "default") result.add("mod");
				else if (API.has(name)) result.add(`api:${name}`);
			} else if (value === "catmod") result.add("cat");
			else if (value.startsWith("t") && name !== undefined && METHODS.has(name))
				result.add(`m:${name}:${value}`);
		}
		return result;
	};
	const evaluate = (node: Node): Values => {
		let result = memo.get(node);
		if (result) return result;
		memo.set(node, EMPTY); // cycles (a = b = a) settle in the fixpoint
		result = compute(node);
		memo.set(node, result);
		return result;
	};
	const compute = (node: Node): Values => {
		switch (node.type) {
			case "Identifier": {
				const binding = resolved.get(node);
				if (binding) return valuesOf(binding);
				return EMPTY;
			}
			case "ParenthesizedExpression":
			case "TSAsExpression":
			case "TSSatisfiesExpression":
			case "TSNonNullExpression":
			case "TSTypeAssertion":
			case "TSInstantiationExpression":
				return evaluate(node.expression as Node);
			case "SequenceExpression": {
				const expressions = node.expressions as Node[];
				return evaluate(expressions[expressions.length - 1]!);
			}
			case "ConditionalExpression":
				return union(
					evaluate(node.consequent as Node),
					evaluate(node.alternate as Node)
				);
			case "LogicalExpression":
				return union(evaluate(node.left as Node), evaluate(node.right as Node));
			case "AssignmentExpression":
				return node.operator === "="
					? evaluate(node.right as Node)
					: union(evaluate(node.left as Node), evaluate(node.right as Node));
			case "AwaitExpression": {
				const result: Values = new Set();
				for (const value of evaluate(node.argument as Node))
					result.add(value.startsWith("p:") ? value.slice(2) : value);
				return result;
			}
			case "MemberExpression":
			case "OptionalMemberExpression":
				return member(evaluate(node.object as Node), propertyName(node));
			case "ObjectProperty":
				return propertyName(node) === "messages"
					? EMPTY
					: onlyCatalog(evaluate(node.value as Node));
			case "SpreadElement":
				return onlyCatalog(evaluate(node.argument as Node));
			case "ObjectExpression": {
				for (const property of node.properties as Node[])
					if (property.type !== "ObjectMethod" && evaluate(property).has("cat"))
						return new Set(["cat"]);
				return EMPTY;
			}
			case "CallExpression":
			case "OptionalCallExpression":
			case "NewExpression": {
				const callee = node.callee as Node;
				const callArguments = node.arguments as Node[];
				if (callee.type === "Import") return importValuesOf(callArguments[0]);
				if (
					callee.type === "Identifier" &&
					callee.name === "require" &&
					!resolved.has(callee)
				)
					return requireValues(callArguments[0]);
				const result: Values = new Set();
				for (const value of evaluate(callee)) {
					const name = value.startsWith("api:") ? value.slice(4) : undefined;
					if (name && TRANSLATOR_FACTORIES[name]) {
						const factory = TRANSLATOR_FACTORIES[name]!;
						for (const namespace of namespaces(
							factory.namespace,
							callArguments
						))
							result.add(
								(factory.async ? "p:" : "") +
									(namespace === undefined ? "t?" : translator(namespace))
							);
					} else if (name && CATALOG_FACTORIES[name])
						result.add(CATALOG_FACTORIES[name]!.async ? "p:cat" : "cat");
					else if (
						value === "merge" &&
						callArguments.some((argument) => evaluate(argument).has("cat"))
					)
						result.add("cat");
				}
				return result;
			}
			case "ImportExpression":
				return importValuesOf(node.source as Node);
			default:
				return EMPTY;
		}
	};
	const onlyCatalog = (values: Values): Values =>
		values.has("cat") ? new Set(["cat"]) : EMPTY;
	const importValuesOf = (specifier: Node | undefined): Values => {
		const strings = specifier ? staticStrings(specifier) : undefined;
		if (strings)
			return new Set(
				strings.flatMap((source) =>
					INTL_MODULE.test(source)
						? INTL_TOOLING.test(source)
							? []
							: ["p:mod"]
						: isCatalogPath(source)
							? ["p:catmod"]
							: []
				)
			);
		return dynamicJson(specifier) ? new Set(["p:catmod"]) : EMPTY;
	};
	const requireValues = (specifier: Node | undefined): Values => {
		const strings = specifier ? staticStrings(specifier) : undefined;
		if (strings)
			return new Set(
				strings.flatMap((source) =>
					INTL_MODULE.test(source)
						? INTL_TOOLING.test(source)
							? []
							: ["mod"]
						: isCatalogPath(source)
							? ["cat"]
							: []
				)
			);
		return EMPTY;
	};
	/** A template like `../messages/${locale}.json`. */
	const dynamicJson = (specifier: Node | undefined): boolean => {
		if (!specifier) return false;
		const node = unwrap(specifier);
		if (node.type === "TemplateLiteral") {
			const quasis = node.quasis as Node[];
			const last = (quasis[quasis.length - 1]?.value as { cooked?: string })
				?.cooked;
			return typeof last === "string" && /\.json(?:[?#].*)?$/i.test(last);
		}
		if (node.type === "BinaryExpression" && node.operator === "+")
			return dynamicJson(node.right as Node);
		return false;
	};
	/** A dynamic module specifier whose module can't be next-intl or a message file. */
	const harmlessSpecifier = (specifier: Node | undefined): boolean => {
		if (!specifier) return false;
		const node = unwrap(specifier);
		let last: string | undefined;
		if (node.type === "TemplateLiteral") {
			const quasis = node.quasis as Node[];
			last = (quasis[quasis.length - 1]?.value as { cooked?: string })?.cooked;
		} else if (node.type === "BinaryExpression" && node.operator === "+") {
			const right = staticStrings(node.right as Node);
			last = right?.length === 1 ? right[0] : undefined;
		}
		// `./content/${slug}.mdx`: a source file, analyzed on its own
		return typeof last === "string" && /\.(?!json\b)[a-z]+$/i.test(last);
	};

	/** Namespaces of a translator factory call: `null` for none, `undefined` for unknown. */
	const namespaces = (
		kind: "first" | "object" | "second" | "none",
		callArguments: Node[]
	): (string | null | undefined)[] => {
		if (kind === "none") return [null];
		const argument = callArguments[kind === "second" ? 1 : 0];
		if (callArguments.some((node) => node.type === "SpreadElement"))
			return [undefined];
		if (!argument) return [null];
		const node = unwrap(argument);
		if (
			node.type === "Identifier" &&
			node.name === "undefined" &&
			!resolved.has(node)
		)
			return [null];
		if (
			node.type === "ObjectExpression" &&
			(kind === "object" || kind === "first")
		) {
			let namespace: (string | null | undefined)[] = [null];
			for (const property of node.properties as Node[]) {
				if (property.type !== "ObjectProperty") return [undefined];
				const name = propertyName(property);
				if (name === undefined) return [undefined];
				if (name === "namespace") {
					const value = unwrap(property.value as Node);
					namespace =
						value.type === "Identifier" &&
						value.name === "undefined" &&
						!resolved.has(value)
							? [null]
							: (staticStrings(value) ?? [undefined]);
				}
			}
			return namespace;
		}
		if (kind === "object") return [undefined];
		return staticStrings(node) ?? [undefined];
	};

	/** The strings an expression can be, if they are known. */
	const staticStrings = (
		node: Node,
		seen = new Set<Binding>()
	): string[] | undefined => {
		const limit = (values: string[] | undefined) =>
			values && values.length <= 256 ? [...new Set(values)] : undefined;
		switch (node.type) {
			case "StringLiteral":
				return [node.value as string];
			case "NumericLiteral":
				return [String(node.value)];
			case "TemplateLiteral": {
				const quasis = node.quasis as Node[];
				const expressions = node.expressions as Node[];
				let result: string[] = [""];
				for (let index = 0; index < quasis.length; index++) {
					const cooked = (quasis[index]!.value as { cooked?: string | null })
						.cooked;
					if (typeof cooked !== "string") return undefined;
					result = result.map((prefix) => prefix + cooked);
					const expression = expressions[index];
					if (expression) {
						const values = staticStrings(expression, seen);
						if (!values) return undefined;
						result = limit(
							result.flatMap((prefix) => values.map((value) => prefix + value))
						)!;
						if (!result) return undefined;
					}
				}
				return result;
			}
			case "BinaryExpression": {
				if (node.operator !== "+") return undefined;
				const left = staticStrings(node.left as Node, seen);
				const right = left && staticStrings(node.right as Node, seen);
				if (!left || !right) return undefined;
				return limit(left.flatMap((a) => right.map((b) => a + b)));
			}
			case "ConditionalExpression": {
				const consequent = staticStrings(node.consequent as Node, seen);
				const alternate =
					consequent && staticStrings(node.alternate as Node, seen);
				return consequent && alternate
					? limit([...consequent, ...alternate])
					: undefined;
			}
			case "LogicalExpression": {
				// `a ?? "b"` is one of them when both are known
				const left = staticStrings(node.left as Node, seen);
				const right = left && staticStrings(node.right as Node, seen);
				return left && right ? limit([...left, ...right]) : undefined;
			}
			case "SequenceExpression": {
				const expressions = node.expressions as Node[];
				return staticStrings(expressions[expressions.length - 1]!, seen);
			}
			case "ParenthesizedExpression":
			case "TSAsExpression":
			case "TSSatisfiesExpression":
			case "TSNonNullExpression":
			case "TSTypeAssertion":
				return staticStrings(node.expression as Node, seen);
			case "Identifier": {
				const binding = resolved.get(node);
				if (!binding || seen.has(binding) || binding.writes.length !== 1)
					return undefined;
				if (binding.reassigned) return undefined;
				const next = new Set(seen).add(binding);
				const write = binding.writes[0]!;
				if (write.path.length) return undefined;
				if (write.forOf) return staticArray(write.forOf, next);
				if (write.value) return staticStrings(write.value, next);
				return undefined;
			}
			default:
				return undefined;
		}
	};
	/** The strings of an array that is never changed, e.g. `const keys = ["a", "b"] as const`. */
	const staticArray = (
		node: Node,
		seen: Set<Binding>
	): string[] | undefined => {
		const target = unwrap(node);
		if (target.type === "ArrayExpression") {
			const result: string[] = [];
			for (const element of target.elements as (Node | null)[]) {
				if (!element || element.type === "SpreadElement") return undefined;
				const values = staticStrings(element, seen);
				if (!values) return undefined;
				result.push(...values);
			}
			return result;
		}
		if (target.type !== "Identifier") return undefined;
		const binding = resolved.get(target);
		if (
			!binding ||
			seen.has(binding) ||
			binding.reassigned ||
			binding.exported ||
			binding.writes.length !== 1 ||
			!binding.writes[0]!.value ||
			binding.writes[0]!.path.length
		)
			return undefined;
		// only read: never passed on, where it could be changed
		for (const reference of binding.references) {
			const context = climbWrappers(reference.node);
			if (
				!(
					(isMember(context.parent) &&
						context.key === "object" &&
						READING.has(propertyName(context.parent) ?? "")) ||
					(context.parent?.type === "ForOfStatement" && context.key === "right")
				)
			)
				return undefined;
		}
		return staticArray(binding.writes[0]!.value!, new Set(seen).add(binding));
	};
	/** The innermost non-arrow function around a node, whose `arguments` it is. */
	const enclosingNonArrow = (node: Node): Node | undefined => {
		for (
			let current = parents.get(node);
			current;
			current = parents.get(current.parent)
		)
			if (
				FUNCTIONS.has(current.parent.type) &&
				current.parent.type !== "ArrowFunctionExpression"
			)
				return current.parent;
		return undefined;
	};
	const climbWrappers = (
		node: Node
	): { node: Node; parent?: Node; key?: string } => {
		let current = node;
		for (;;) {
			const parent = parents.get(current);
			if (!parent || !WRAPPERS.has(parent.parent.type))
				return { node: current, ...parent };
			current = parent.parent;
		}
	};

	// Callback parameters of `keys.map((key) => …)` over a static array. Only when nothing else
	// can call the callback with other values or change the array while it is iterated.
	const argumentsUsers = new Set<Node>();
	for (const { node } of pendingReferences)
		if (node.name === "arguments" && !resolved.has(node)) {
			const fn = enclosingNonArrow(node);
			if (fn) argumentsUsers.add(fn);
		}
	for (const binding of new Set(bindingOf.values())) {
		const owner = binding.parameterOf;
		if (!owner || owner.index !== 0 || binding.writes.length) continue;
		const fn = owner.fn;
		const params = fn.params as Node[];
		const arrayParameter = params[2] && bindingOf.get(params[2]);
		if (
			argumentsUsers.has(fn) ||
			(isNode(fn.id) && (bindingOf.get(fn.id)?.references.length ?? 0) > 0) ||
			(params[2] &&
				(!arrayParameter || arrayParameter.references.length > 0)) ||
			params.length > 3 ||
			params[0]!.type !== "Identifier"
		)
			continue;
		const context = climbWrappers(fn);
		if (
			isCall(context.parent) &&
			context.key === "arguments" &&
			(context.parent.arguments as Node[])[0] === context.node &&
			isMember(context.parent.callee as Node) &&
			ITERATING.has(propertyName(context.parent.callee as Node) ?? "")
		)
			binding.writes.push({
				forOf: (context.parent.callee as Node).object as Node,
				path: [],
			});
	}

	const allBindings = new Set(bindingOf.values());
	for (let iteration = 0; ; iteration++) {
		memo = new Map();
		let changed = false;
		for (const binding of allBindings) {
			const current = valuesOf(binding);
			const next = new Set(current);
			for (const write of binding.writes) {
				if (!write.value) continue;
				let values = evaluate(write.value);
				for (const part of write.path) values = member(values, part);
				for (const value of values) next.add(value);
			}
			if (next.size !== current.size) {
				bindingValues.set(binding, next);
				changed = true;
			}
		}
		if (!changed) break;
		if (iteration > 100) {
			unresolve("Usage analysis did not converge.", program);
			break;
		}
	}
	memo = new Map();

	// ---- 3. Usages and escapes ----
	const interesting = (value: string) =>
		value.startsWith("t") ||
		value.startsWith("m:") ||
		value.startsWith("p:") ||
		value === "mod" ||
		value === "cat" ||
		value === "catmod" ||
		(value.startsWith("api:") &&
			!PROVIDERS.has(value.slice(4)) &&
			value !== "api:getRequestConfig");
	const kindOf = (value: string) =>
		value.startsWith("p:")
			? "promise"
			: value.startsWith("m:")
				? "method"
				: value.startsWith("t")
					? "translator"
					: value.startsWith("api:")
						? "api"
						: value;

	/** Whether `parent` passes the value of its child `key` on as its own value. */
	const transparent = (
		child: Node,
		parent: Node,
		key: string,
		kind: string
	): boolean => {
		if (WRAPPERS.has(parent.type)) return true;
		switch (parent.type) {
			case "SequenceExpression": {
				const expressions = parent.expressions as Node[];
				return expressions[expressions.length - 1] === child;
			}
			case "ConditionalExpression":
				return key !== "test";
			case "LogicalExpression":
			case "AwaitExpression":
				return true;
			case "AssignmentExpression":
				// `a = t` names it; `obj.t = t` and `({ x } = t)` are checked as assignments
				return key === "right" && (parent.left as Node).type === "Identifier";
			case "ObjectProperty":
				return (
					kind === "cat" &&
					key === "value" &&
					propertyName(parent) !== "messages"
				);
			case "SpreadElement":
				return (
					kind === "cat" &&
					parents.get(parent)?.parent.type === "ObjectExpression"
				);
			case "ObjectExpression":
				return kind === "cat";
			case "MemberExpression":
			case "OptionalMemberExpression":
				return (
					kind === "catmod" &&
					key === "object" &&
					propertyName(parent) !== undefined
				);
			case "CallExpression":
			case "OptionalCallExpression":
				return (
					kind === "cat" &&
					key === "arguments" &&
					evaluate(parent.callee as Node).has("merge")
				);
			default:
				return false;
		}
	};

	const isProvider = (element: Node): boolean => {
		const name = element.name as Node;
		const scope = scopeOf.get(element)!;
		if (name.type === "JSXIdentifier") {
			const binding = lookup(scope, name.name as string);
			return (
				!!binding &&
				[...valuesOf(binding)].some((value) => PROVIDERS.has(value.slice(4)))
			);
		}
		if (
			name.type === "JSXMemberExpression" &&
			isNode(name.object) &&
			name.object.type === "JSXIdentifier"
		) {
			const binding = lookup(scope, name.object.name as string);
			return (
				!!binding &&
				valuesOf(binding).has("mod") &&
				PROVIDERS.has((name.property as Node).name as string)
			);
		}
		return false;
	};
	/** The function a node is directly in. */
	const enclosingFunction = (node: Node): Node | undefined => {
		for (
			let current = parents.get(node);
			current;
			current = parents.get(current.parent)
		)
			if (FUNCTIONS.has(current.parent.type)) return current.parent;
		return undefined;
	};
	const callsApi = (call: Node | undefined, name: string) =>
		isCall(call) && evaluate(call.callee as Node).has(`api:${name}`);
	/** `createTranslator({ messages })` or the object a `getRequestConfig` callback returns. */
	const isConfigObject = (object: Node): boolean => {
		const context = climbWrappers(object);
		if (
			context.key === "arguments" &&
			(context.parent?.arguments as Node[] | undefined)?.[0] === context.node &&
			callsApi(context.parent, "createTranslator")
		)
			return true;
		let fn: Node | undefined;
		if (context.parent?.type === "ReturnStatement")
			fn = enclosingFunction(context.parent);
		else if (
			context.parent?.type === "ArrowFunctionExpression" &&
			context.key === "body"
		)
			fn = context.parent;
		if (!fn) return false;
		const call = climbWrappers(fn);
		return (
			call.key === "arguments" &&
			(call.parent?.arguments as Node[] | undefined)?.[0] === call.node &&
			callsApi(call.parent, "getRequestConfig")
		);
	};
	const hookDependencies = (array: Node): boolean => {
		const context = climbWrappers(array);
		if (!isCall(context.parent) || context.key !== "arguments") return false;
		const callee = context.parent.callee as Node;
		const name =
			callee.type === "Identifier"
				? (callee.name as string)
				: isMember(callee)
					? propertyName(callee)
					: undefined;
		const index = name === undefined ? undefined : DEPENDENCY_HOOKS[name];
		return (
			index !== undefined &&
			(context.parent.arguments as Node[])[index] === context.node
		);
	};

	/** Whether a value of `kind` may be at `node` without escaping. */
	const allowed = (
		node: Node,
		parent: Node | undefined,
		key: string | undefined,
		kind: string
	): boolean => {
		if (!parent || !key) return false;
		// a named binding or a discarded value: the binding's uses are checked
		if (parent.type === "VariableDeclarator" && key === "init")
			return (
				(parent.id as Node).type === "Identifier" ||
				(kind === "mod" && staticPattern(parent.id as Node))
			);
		if (parent.type === "AssignmentExpression" && key === "right") {
			const left = parent.left as Node;
			return (
				left.type === "Identifier" || (kind === "mod" && staticPattern(left))
			);
		}
		if (parent.type === "ExpressionStatement") return true;
		if (
			parent.type === "UnaryExpression" &&
			(parent.operator === "typeof" || parent.operator === "void")
		)
			return true;
		if (
			(parent.type === "IfStatement" ||
				parent.type === "ConditionalExpression") &&
			key === "test"
		)
			return true;
		if (parent.type === "ArrayExpression" && hookDependencies(parent))
			return true;
		switch (kind) {
			case "translator":
				return (
					(isCall(parent) && key === "callee") ||
					(isMember(parent) &&
						key === "object" &&
						METHODS.has(propertyName(parent) ?? ""))
				);
			case "method":
			case "api":
				return isCall(parent) && key === "callee";
			case "promise":
				return parent.type === "AwaitExpression";
			case "mod":
				return (
					isMember(parent) &&
					key === "object" &&
					propertyName(parent) !== undefined
				);
			case "cat": {
				if (parent.type === "JSXExpressionContainer") {
					const attribute = parents.get(parent)?.parent;
					const element = attribute && parents.get(attribute)?.parent;
					return (
						attribute?.type === "JSXAttribute" &&
						(attribute.name as Node).name === "messages" &&
						element?.type === "JSXOpeningElement" &&
						isProvider(element)
					);
				}
				if (
					parent.type === "ObjectProperty" &&
					key === "value" &&
					propertyName(parent) === "messages"
				) {
					const object = parents.get(parent)?.parent;
					return (
						!!object &&
						object.type === "ObjectExpression" &&
						isConfigObject(object)
					);
				}
				return false;
			}
			default:
				return false;
		}
	};
	const staticPattern = (pattern: Node): boolean =>
		pattern.type === "ObjectPattern" &&
		(pattern.properties as Node[]).every(
			(property) =>
				property.type === "ObjectProperty" &&
				propertyName(property) !== undefined
		);

	const escapeReason: Record<string, string> = {
		translator:
			"A translator is passed on, returned or stored; the messages it reads can't be resolved.",
		method:
			"A translator method is passed on or stored; the messages it reads can't be resolved.",
		api: "A next-intl function is passed on, re-exported or stored; its usages can't be resolved.",
		promise:
			"A promised translator or message catalog is used without await; its usages can't be resolved.",
		mod: "The next-intl module is used dynamically; its usages can't be resolved.",
		cat: "Messages are read directly from the catalog (useMessages, getMessages or a message file); which ones can't be resolved.",
		catmod:
			"A message file is used dynamically; which messages are read can't be resolved.",
	};

	const use = (bundleId: string, at: Node) => {
		used.add(bundleId);
		refer(bundleId, at);
	};
	const bundleId = (namespace: string, key: string) =>
		namespace === "" ? key : `${namespace}.${key}`;

	for (const node of valueNodes) {
		// a next-intl call: record the messages it uses
		if (isCall(node)) {
			const callArguments = node.arguments as Node[];
			const keyArgument = callArguments[0];
			for (const value of evaluate(node.callee as Node)) {
				let method: string | undefined;
				let target = value;
				if (value.startsWith("m:")) {
					method = value.slice(2, value.indexOf(":", 2));
					target = value.slice(value.indexOf(":", 2) + 1);
				}
				if (target === "t?") continue; // reported where the translator is created
				const namespace = namespaceOf(target);
				if (namespace === undefined) {
					const name = value.startsWith("api:") ? value.slice(4) : undefined;
					if (name && EXTRACTED.has(name))
						unresolve(
							"Extracted messages (useExtracted, getExtracted) are keyed by their text; their bundles can't be resolved.",
							node
						);
					if (name && TRANSLATOR_FACTORIES[name])
						for (const namespace of namespaces(
							TRANSLATOR_FACTORIES[name]!.namespace,
							callArguments
						))
							if (namespace === undefined)
								unresolve(
									"The namespace of a translator can't be resolved statically.",
									node
								);
					continue;
				}
				if (!keyArgument) continue;
				const keys =
					keyArgument.type === "SpreadElement"
						? undefined
						: staticStrings(keyArgument);
				if (!keys) {
					unresolve(
						"A dynamic message key can't be resolved statically.",
						keyArgument
					);
					continue;
				}
				for (const key of keys) {
					const id = bundleId(namespace, key);
					use(id, node);
					if (method === "raw" || method === "has") {
						const location = located(node);
						subtreeReads.push({
							bundleId: id,
							issue: {
								path,
								reason: `t.${method}() can read a whole namespace; the messages under "${id}" can't be resolved.`,
								...(location ?? {}),
							},
						});
					} else leaves.add(id);
				}
			}
		}
		// `require(x)` and `import(x)` of something that can be next-intl or a message file
		if (
			(isCall(node) && (node.callee as Node).type === "Import") ||
			node.type === "ImportExpression" ||
			(isCall(node) &&
				(node.callee as Node).type === "Identifier" &&
				(node.callee as Node).name === "require" &&
				!resolved.has(node.callee as Node))
		) {
			const specifier =
				node.type === "ImportExpression"
					? (node.source as Node)
					: (node.arguments as Node[])[0];
			if (
				!(specifier && staticStrings(specifier)) &&
				!dynamicJson(specifier) &&
				!harmlessSpecifier(specifier)
			)
				unresolve(
					"A module loaded by a computed path could be next-intl or a message file.",
					node
				);
		}
		if (node.type === "Identifier" && !resolved.has(node)) {
			const name = node.name as string;
			const parent = parents.get(node);
			if (name === "eval" || name === "Function")
				unresolve("Dynamically evaluated code can't be analyzed.", node);
			if (
				(name === "require" &&
					!(isCall(parent?.parent) && parent!.key === "callee") &&
					!(
						isMember(parent?.parent) &&
						parent!.key === "object" &&
						propertyName(parent!.parent) === "resolve"
					)) ||
				name === "__webpack_require__" ||
				name === "__non_webpack_require__" ||
				name === "__webpack_modules__"
			)
				unresolve(
					"Module loaders can load next-intl or message files by computed names.",
					node
				);
		}
		if (
			node.type === "MetaProperty" &&
			identifierName(node.meta) === "import" &&
			identifierName(node.property) === "meta"
		) {
			const parent = parents.get(node);
			const property =
				parent && isMember(parent.parent) && parent.key === "object"
					? propertyName(parent.parent)
					: undefined;
			if (!property || !IMPORT_META.has(property))
				unresolve(
					"import.meta.glob and other import.meta loaders can load message files by computed names.",
					node
				);
		}
		// a message file read by path, e.g. fetch("/messages/en.json") or readFile(`${locale}.json`)
		if (node.type === "StringLiteral" || node.type === "TemplateLiteral") {
			const parent = parents.get(node);
			const specifier =
				parent &&
				((parent.key === "source" &&
					/^(?:Import|Export\w+)Declaration$|^ImportExpression$/.test(
						parent.parent.type
					)) ||
					(isCall(parent.parent) &&
						parent.key === "arguments" &&
						((parent.parent.callee as Node).type === "Import" ||
							((parent.parent.callee as Node).type === "Identifier" &&
								(parent.parent.callee as Node).name === "require"))) ||
					parent.parent.type === "TSExternalModuleReference" ||
					parent.parent.type === "TemplateLiteral" ||
					(parent.parent.type === "ObjectProperty" && parent.key === "key") ||
					parent.parent.type === "ImportAttribute");
			if (!specifier) {
				const strings = staticStrings(node);
				if (
					strings
						? strings.some(
								(text) =>
									text.trim().toLowerCase() === ".json" ||
									isCatalogPath(text.trim())
							)
						: dynamicJson(node)
				)
					unresolve(
						"A message file is referenced by path; messages may be read from it directly.",
						node
					);
			}
		}
		// escapes
		const values = evaluate(node);
		if (values.size === 0) continue;
		const parent = parents.get(node);
		for (const value of values) {
			if (!interesting(value)) continue;
			const kind = kindOf(value);
			if (parent && transparent(node, parent.parent, parent.key, kind))
				continue;
			if (!allowed(node, parent?.parent, parent?.key, kind))
				unresolve(escapeReason[kind]!, node);
		}
	}

	// Exported bindings: other modules can use them.
	for (const binding of allBindings)
		if (binding.exported && [...valuesOf(binding)].some(interesting))
			unresolve(
				escapeReason[kindOf([...valuesOf(binding)].find(interesting)!)]!,
				binding.exported
			);

	// JSX elements named by a translator or a next-intl function, e.g. `<T />`.
	for (const { node, scope } of jsxNames) {
		const name = node.name as Node;
		const root =
			name.type === "JSXIdentifier"
				? name
				: name.type === "JSXMemberExpression"
					? (() => {
							let object = name.object as Node;
							while (object.type === "JSXMemberExpression")
								object = object.object as Node;
							return object;
						})()
					: undefined;
		if (!root || root.type !== "JSXIdentifier") continue;
		const binding = lookup(scope, root.name as string);
		if (!binding) continue;
		const values = [...valuesOf(binding)].filter(
			(value) =>
				interesting(value) &&
				!(value === "mod" && name.type === "JSXMemberExpression")
		);
		if (values.length) unresolve(escapeReason[kindOf(values[0]!)]!, name);
	}

	// Types: `typeof messages` types next-intl; key types and indexed catalogs are like keyof.
	for (const { node, scope } of typeNodes) {
		// the type around `typeof x`, through parentheses
		let { parent, key } = parents.get(node) ?? {};
		while (parent?.type === "TSParenthesizedType")
			({ parent, key } = parents.get(parent) ?? {});
		if (node.type === "TSTypeQuery") {
			let name = node.exprName as Node;
			let qualified = false;
			if (name.type === "TSImportType") {
				const source =
					((name.argument as Node).literal as Node | undefined)?.value ??
					(name.argument as Node).value;
				if (
					typeof source === "string" &&
					isCatalogPath(source) &&
					(name.qualifier || !bareTypeQuery(parent, key))
				)
					unresolve(
						"A type depends on message keys (keyof or an indexed message catalog).",
						node
					);
				continue;
			}
			while (name.type === "TSQualifiedName") {
				qualified = true;
				name = name.left as Node;
			}
			if (name.type !== "Identifier") continue;
			const binding = lookup(scope, name.name as string);
			if (!binding) continue;
			const values = valuesOf(binding);
			if (
				(values.has("cat") || values.has("catmod")) &&
				(qualified || !bareTypeQuery(parent, key))
			)
				unresolve(
					"A type depends on message keys (keyof or an indexed message catalog).",
					node
				);
		} else if (node.type === "TSTypeReference") {
			let name = node.typeName as Node;
			const path: string[] = [];
			while (name.type === "TSQualifiedName") {
				path.unshift(identifierName(name.right) ?? "");
				name = name.left as Node;
			}
			if (name.type !== "Identifier") continue;
			const binding = lookup(scope, name.name as string);
			if (!binding) continue;
			const values = valuesOf(binding);
			const keyType =
				path.length === 0
					? [...KEY_TYPES].some((type) => values.has(`api:${type}`))
					: path.length === 1 && values.has("mod") && KEY_TYPES.has(path[0]!);
			if (keyType)
				unresolve(
					"A type of message keys (MessageKeys, NamespaceKeys) can hold any key.",
					node
				);
		} else if (node.type === "TSImportType") {
			const argument = node.argument as Node;
			const source =
				(argument.literal as Node | undefined)?.value ?? argument.value;
			const qualifier = node.qualifier as Node | undefined;
			if (
				typeof source === "string" &&
				INTL_MODULE.test(source) &&
				qualifier &&
				KEY_TYPES.has(identifierName(qualifier) ?? "")
			)
				unresolve(
					"A type of message keys (MessageKeys, NamespaceKeys) can hold any key.",
					node
				);
		}
	}

	return {
		used,
		leaves,
		references,
		subtreeReads,
		issues: [...unresolved.values()].sort(
			(a, b) =>
				(a.start?.line ?? 0) - (b.start?.line ?? 0) ||
				(a.start?.column ?? 0) - (b.start?.column ?? 0)
		),
	};
}

/** `typeof messages` on its own, not `keyof typeof messages` or `(typeof messages)["Home"]`. */
function bareTypeQuery(
	parent: Node | undefined,
	key: string | undefined
): boolean {
	if (!parent) return true;
	if (parent.type === "TSTypeOperator") return false;
	if (parent.type === "TSIndexedAccessType" && key === "objectType")
		return false;
	return true;
}

function union(a: Values, b: Values): Values {
	if (a.size === 0) return b;
	if (b.size === 0) return a;
	return new Set([...a, ...b]);
}
