/**
 * Observable types
 * https://github.com/ReactiveX/rxjs/blob/master/packages/observable/src/types.ts
 * https://github.com/WICG/observable
 * https://github.com/tc39/proposal-observable
 *
 * This api was chosen because:
 * - it matches (with some differences) RxJS and the WICG and tc39 Observable proposals
 * - it feels easier to work with than async iterators (which are pull based)
 * - operators should help to compose event streams for UI components
 */

export interface Observable<T> {
	["@@observable"](): Observable<T>
	subscribe(observer: Observer<T>): Subscription
}

export interface Observer<T> {
	next(value: T): void
	error(err: any): void
	complete(): void
}

export interface Subscription {
	unsubscribe(): void
}
