/**
 * Generate a random ID string
 * unique across all messages across branches (expected limit 10^6 messages)
 * TODO: check behavior in non-secure browser context
 */
export function randomId(): string {
	return crypto.randomUUID()
}
