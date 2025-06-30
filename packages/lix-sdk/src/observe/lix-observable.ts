/**
 * Micro-observable implementation following TC-39 Observable protocol.
 * ~25 lines of code for minimal footprint while maintaining spec compliance.
 */

// Polyfill Symbol.observable if not present
declare global {
	interface SymbolConstructor {
		readonly observable: symbol;
	}
}

if (typeof Symbol.observable === "undefined") {
	(Symbol as any).observable = Symbol("observable");
}

export interface Observer<T> {
	next?: (value: T) => void;
	error?: (error: any) => void;
	complete?: () => void;
}

export interface Subscription {
	unsubscribe(): void;
}

export interface Observable<T> {
	subscribe(observer: Partial<Observer<T>>): Subscription;
	[Symbol.observable](): Observable<T>;
}

export class LixObservable<T> implements Observable<T[]> {
	constructor(private subscriber: (observer: Observer<T[]>) => (() => void) | void) {}

	subscribe(observer: Partial<Observer<T[]>>): Subscription {
		let closed = false;
		const safeObserver: Observer<T[]> = {
			next: (value) => !closed && observer.next?.(value),
			error: (err) => {
				if (!closed) {
					closed = true;
					observer.error?.(err);
				}
			},
			complete: () => {
				if (!closed) {
					closed = true;
					observer.complete?.();
				}
			},
		};

		const cleanup = this.subscriber(safeObserver);
		
		return {
			unsubscribe() {
				if (!closed) {
					closed = true;
					cleanup?.();
				}
			},
		};
	}

	[Symbol.observable](): LixObservable<T> {
		return this;
	}

	subscribeTakeFirst(observer: Partial<Observer<T | undefined>>): Subscription {
		return this.subscribe({
			next: (rows) => observer.next?.(rows[0]),
			error: observer.error,
			complete: observer.complete,
		});
	}

	subscribeTakeFirstOrThrow(observer: Partial<Observer<T>>): Subscription {
		return this.subscribe({
			next: (rows) => {
				if (rows.length === 0) {
					observer.error?.(new Error("Query returned no rows"));
				} else {
					observer.next?.(rows[0]!);
				}
			},
			error: observer.error,
			complete: observer.complete,
		});
	}
}