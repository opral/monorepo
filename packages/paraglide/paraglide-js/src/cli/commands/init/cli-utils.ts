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
