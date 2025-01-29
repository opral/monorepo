type QueryFunction<T> = () => Promise<T>
type Subscriber<T> = (value: T) => void

interface Subscription {
	unsubscribe: () => void
}

/**
 * Creates a polling mechanism that periodically executes a query function
 * and notifies subscribers of the results.
 *
 * @param queryFn - Function that returns a Promise with the query result
 * @param interval - Optional polling interval in milliseconds (default: 2000ms)
 * @returns An object with a subscribe method
 */
export function pollQuery<T>(queryFn: QueryFunction<T>, interval: number = 2000) {
	return {
		subscribe(subscriber: Subscriber<T>): Subscription {
			let isDestroyed = false

			const executeQuery = async () => {
				if (isDestroyed) return
				try {
					const result = await queryFn()
					if (!isDestroyed) {
						subscriber(result)
					}
				} catch (error) {
					console.error("Poll query error:", error)
				}
			}

			// Execute initial query
			executeQuery()

			// Set up polling interval
			const intervalId = setInterval(executeQuery, interval)

			// Return subscription object
			return {
				unsubscribe: () => {
					isDestroyed = true
					clearInterval(intervalId)
				},
			}
		},
	}
}
