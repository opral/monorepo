import { v4 as uuid_v4 } from "uuid";

let sessionId: string | undefined;
let time: number = 0;

export function lixSession(): string {
	if (sessionId === undefined) {
		time = 0;
		sessionId = uuid_v4(); // we use v4 here since the order of session should explicetly not matter!
	}
	return sessionId;
}

export function sessionClockTick(): number {
	time += 1;
	return time;
}
