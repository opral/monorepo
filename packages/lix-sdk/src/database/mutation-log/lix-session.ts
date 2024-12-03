import { v4 as uuid_v4 } from "uuid";

export function createSession() {
	const sessionId = uuid_v4(); // we use v4 here since the order of session should explicetly not matter!
	let time: number = 0;

	return {
		/**
		 * Returns the current lix session id.
		 */
		id: (): string => {
			return sessionId;
		},
		sessionClockTick: (): number => {
			time += 1;
			return time;
		},
	};
}
