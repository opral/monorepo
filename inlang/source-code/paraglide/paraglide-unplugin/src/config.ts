import { Logger } from "@inlang/paraglide-js/internal"
import path from "node:path"

export type UserConfig = {
	/**
	 * Path to the inlang project from which to take modules
	 * @example `./project.inlang`
	 */
	project: string

	/**
	 * Disable console messages
	 */
	silent?: boolean

	/**
	 * If the `$paraglide` virtual module should be used instead of writing the output to disk.
	 * This overrides the `outdir` property
	 */
	useVirtualModule?: boolean

	/**
	 * The output directory to place the compiled files in.
	 * @example `./src/paraglide`
	 */
	outdir?: string
}

export type PluginConfig = {
	logger: Logger
	/** Absolute path to the project.inlang folder */
	projectPath: string
	/** Absolute path to the directory in which to write the paraglide files*/
	outdir: string | undefined
	/** Absolute path to write .d.ts files to if virtual modules are enabled */
	dtsPath: string
	/** Name of the virtual module to use */
	virtualModuleName: string
}

/**
 * Normalizes the input from the user & logs warnings if needed
 */
export function resolveConfig(options: UserConfig): PluginConfig {
	const logger = new Logger({ silent: options.silent ?? false, prefix: true })

	const outputDirectory =
		"outdir" in options && options.outdir ? path.resolve(process.cwd(), options.outdir) : undefined

	let normalizedOutdir = outputDirectory ? outputDirectory.replaceAll("\\", "/") : outputDirectory
	if (normalizedOutdir && !normalizedOutdir.endsWith("/")) normalizedOutdir = normalizedOutdir + "/"

	const normalizedPorjectPath = path.resolve(process.cwd(), options.project)

	if (options.outdir && options.useVirtualModule) {
		logger.warn("`outdir` option is specified alongside `useVirtualModules`. It won't do anything")
	}

	if (!options.outdir && !options.useVirtualModule) {
		throw new Error("[unplugin-paraglide] You must specify either `outdir` or `useVirtualModule`")
	}

	return {
		logger,
		projectPath: normalizedPorjectPath,
		outdir: options.useVirtualModule ? undefined : normalizedOutdir,
		dtsPath: path.resolve(process.cwd(), "paraglide.d.ts"),
		virtualModuleName: "$paraglide",
	}
}
