import { v4 as uuid } from "uuid"

/**
 * Generate a random ID string
 * unique across all messages across branches (expected limit 10^6 messages)
 * depends on uuid npm package in order to support environments without crypto (like Sherlock)
 */
export function randomId(): string {
	return uuid()
}
