import { NodeishFilesystem } from "@lix-js/fs"
import consola from "consola"
import path from "node:path"

/**
 * One step in a CLI chain.
 * Defines which types the context needs to extend and how it extends the context
 *
 * Cli Steps can be chained to slowly build up the context over time
 *
 * @example
 * ```ts
 * const step1:  CliStep<unknown, { foo: string }> = async (ctx) => {
 *    return {...ctx, foo: "hello" }
 * }
 *
 * const step2: CliStep<{ foo: string }, { bar: number }> = async (ctx) => {
 *   return { ...ctx, bar: 42 }
 * }
 *
 * const initial = { baz: "baz" } as const;
 * const ctx1 = await step1(initial);
 * const ctx2 = await step2(ctx1);
 *
 * ctx2 // Has type { foo: string, bar: number, baz: "baz" }
 * ```
 */
export type CliStep<In extends object, Out> = <Ctx extends In>(ctx: Ctx) => Promise<Ctx & Out>

// get the "In" property of a CLiStep
type CliStepIn<Step extends CliStep<any, any>> = Step extends CliStep<infer In, any> ? In : never
type CliStepOut<Step extends CliStep<any, any>> = Step extends CliStep<any, infer Out> ? Out : never

type Pair<Step1 extends CliStep<any, any>, Step2 extends CliStep<CliStepIn<Step1>, any>> = CliStep<
	CliStepIn<Step1>,
	CliStepOut<Step1> & CliStepOut<Step2>
>

export function pair<Step1 extends CliStep<any, any>, Step2 extends CliStep<CliStepIn<Step1>, any>>(
	step1: Step1,
	step2: Step2
): Pair<Step1, Step2> {
	return async (ctx) => await step2(await step1(ctx))
}

export async function succeedOrElse<T extends Promise<unknown>, U>(
	promise: T,
	orElse: U
): Promise<T | U> {
	try {
		return await promise
	} catch (err) {
		return orElse
	}
}

const WINDOWS_SLASH_REGEX = /\\/g
function slash(p: string): string {
	return p.replace(WINDOWS_SLASH_REGEX, "/")
}

const isWindows = typeof process !== "undefined" && process.platform === "win32"

export function normalizePath(id: string) {
	return path.posix.normalize(isWindows ? slash(id) : id)
}

export async function folderExists(fs: NodeishFilesystem, path: string): Promise<boolean> {
	try {
		const stat = await fs.stat(path)
		return stat.isDirectory()
	} catch {
		return false
	}
}

export async function fileExists(fs: NodeishFilesystem, path: string): Promise<boolean> {
	try {
		const stat = await fs.stat(path)
		return stat.isFile()
	} catch {
		return false
	}
}

export const promptSelection = async <T extends string>(
	message: string,
	options: { initial?: T; options: { label: string; value: T }[] } = { options: [] }
): Promise<T> => {
	return prompt(message, { type: "select", ...options }) as unknown as Promise<T>
}

/**
 * Wrapper to exit the process if the user presses CTRL+C.
 */
export const prompt: typeof consola.prompt = async (message, options) => {
	const response = await consola.prompt(message, options)
	if (response?.toString() === "Symbol(clack:cancel)") {
		process.exit(0)
	}
	return response
}
