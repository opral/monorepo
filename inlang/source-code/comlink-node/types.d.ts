/**
 * Either a WebWorker constructor or Node's Worker, depending on the environment.
 */
export const WorkerPrototype: typeof Worker

/**
 * The adapter for comlink. If this is being used on the web this is an identity function.
 */
export const adapter: <T>(x: T) => T
