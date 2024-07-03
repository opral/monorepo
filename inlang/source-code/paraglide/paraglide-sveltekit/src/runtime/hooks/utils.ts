export type ALS<T> = import("node:async_hooks").AsyncLocalStorage<T>
export type ALSPrototype = typeof import("node:async_hooks").AsyncLocalStorage

export interface Context<T> {
	get(): T | undefined
	callAsync: <CB extends () => any>(val: T, cb: CB) => Promise<Awaited<ReturnType<CB>>>
}

export class ALSContext<T> implements Context<T> {
	ctx: ALS<T>
	constructor(ALS: ALSPrototype) {
		this.ctx = new ALS<T>()
	}

	get(): T | undefined {
		return this.ctx.getStore()
	}

	async callAsync(val: T, cb: () => any) {
		return await this.ctx.run(val, cb)
	}
}
export class GlobalContext<T> implements Context<T> {
	value: T | undefined = undefined

	get(): T | undefined {
		return this.value
	}

	async callAsync(val: T, cb: () => any) {
		this.value = val
		return await cb()
	}
}
