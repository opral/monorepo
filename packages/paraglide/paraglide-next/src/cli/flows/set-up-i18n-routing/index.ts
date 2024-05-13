import { Repository } from "@lix-js/client"
import { CliStep } from "../../utils"
import { Logger } from "@inlang/paraglide-js/internal"
import { globIterate } from "glob"
import nodePath from "node:path"

export const SetUpI18nRoutingFlow: CliStep<
	{
		repo: Repository
		logger: Logger
		/**
		 * An absolute path to the src/ directory
		 */
		srcRoot: string
	},
	unknown
> = async (ctx) => {
	for await (const relativePath of globIterate("**/*.{ts,tsx,js,jsx,mjs}", {
		cwd: ctx.srcRoot,
		posix: true,
		ignore: [
			"**/node_modules/**",
			"**/.next/**",
			"**/dist/**",
			"**/build/**",
			"**/*.d.ts",
			"**/*.d.tsx",
			"**/next.config.*",
		],
	})) {
		const path = nodePath.join(ctx.srcRoot, relativePath)
		const content = await ctx.repo.nodeishFs.readFile(path, { encoding: "utf-8" })
		const newContent = replaceNextNavigationImports(replaceNextLinkImports(content))
		if (newContent === content) continue

		//replace the file content
		await ctx.repo.nodeishFs.writeFile(path, newContent)
	}

	return ctx
}

export function replaceNextLinkImports(content: string): string {
	const regex = /import\s+(?<identifier>\S+)\s+from\s*("|')next\/link("|')/g
	const match = regex.exec(content)
	if (!match) return content
	const { identifier } = match.groups as { identifier: string }

	const replacementImport =
		identifier === "Link"
			? `import { Link } from "@/lib/i18n"`
			: `import { Link as ${identifier} } from "@/lib/i18n"`

	return content.replace(match[0], replacementImport)
}

export function replaceNextNavigationImports(content: string) {
	//the next/navigation imports will be replaced with the ones from @/lib/i18n
	const IDENTIFIERS_TO_REPLACE = ["usePathname", "useRouter", "redirect", "permanentRedirect"]

	const regex = /import\s+{(?<identifiersString>[^}]*)}\s+from\s*("|')next\/navigation("|')/g

	const match = regex.exec(content)
	if (!match) return content
	const { identifiersString } = match.groups as { identifiersString: string }

	const identifiers: [string, string | undefined][] = identifiersString
		.split(",")
		.map((i) => i.trim())
		.filter(Boolean)
		.map((part) => {
			return part.split(" as ").map((i) => i.trim()) as [string, string | undefined]
		})

	const replacedIdentifiers = identifiers.filter((id) =>
		IDENTIFIERS_TO_REPLACE.includes(id[0] as string)
	)
	const notReplacedIdentifiers = identifiers.filter(
		(id) => !IDENTIFIERS_TO_REPLACE.includes(id[0] as string)
	)
	if (replacedIdentifiers.length === 0) return content

	let replacementImport = `import { ${replacedIdentifiers
		.map((part) => part.join(" as "))
		.join(", ")} } from "@/lib/i18n"`
	if (notReplacedIdentifiers.length > 0) {
		replacementImport +=
			"\n" +
			`import { ${notReplacedIdentifiers
				.map((part) => part.join(" as "))
				.join(", ")} } from "next/navigation"`
	}
	return content.replace(match[0], replacementImport)
}
