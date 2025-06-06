/**
 * @typedef {"cookie" | "baseLocale" | "globalVariable" | "url" | "preferredLanguage" | "localStorage"} BuiltInStrategy
 */

/**
 * @typedef {`custom_${string}`} CustomStrategy
 */

/**
 * @typedef {BuiltInStrategy | CustomStrategy} Strategy
 */

/**
 * @typedef {Array<Strategy>} Strategies
 */

/**
 * @typedef {{ getLocale: (request?: Request) => string | undefined }} CustomServerStrategyHandler
 */

/**
 * @typedef {{ getLocale: () => string | undefined, setLocale: (locale: string) => void }} CustomClientStrategyHandler
 */

export const customServerStrategies = new Map();
export const customClientStrategies = new Map();

/**
 * Checks if the given strategy is a custom strategy.
 *
 * @param {any} strategy The name of the custom strategy to validate.
 * Must be a string that starts with "custom-" followed by alphanumeric characters.
 * @returns {boolean} Returns true if it is a custom strategy, false otherwise.
 */
export function isCustomStrategy(strategy) {
	return typeof strategy === "string" && /^custom-[A-Za-z0-9]+$/.test(strategy);
}

/**
 * Defines a custom strategy that is executed on the server.
 *
 * @param {any} strategy The name of the custom strategy to define. Must follow the pattern `custom-<name>` where
 * `<name>` contains only alphanumeric characters.
 * @param {CustomServerStrategyHandler} handler The handler for the custom strategy, which should implement
 * the method `getLocale`.
 * @returns {void}
 */
export function defineCustomServerStrategy(strategy, handler) {
	if (!isCustomStrategy(strategy)) {
		throw new Error(
			`Invalid custom strategy: "${strategy}". Must be a custom strategy following the pattern custom-<name>` +
				" where <name> contains only alphanumeric characters."
		);
	}

	customServerStrategies.set(strategy, handler);
}

/**
 * Defines a custom strategy that is executed on the client.
 *
 * @param {any} strategy The name of the custom strategy to define. Must follow the pattern `custom-<name>` where
 * `<name>` contains only alphanumeric characters.
 * @param {CustomClientStrategyHandler} handler The handler for the custom strategy, which should implement the
 * methods `getLocale` and `setLocale`.
 * @returns {void}
 */
export function defineCustomClientStrategy(strategy, handler) {
	if (!isCustomStrategy(strategy)) {
		throw new Error(
			`Invalid custom strategy: "${strategy}". Must be a custom strategy following the pattern custom-<name>` +
				" where <name> contains only alphanumeric characters."
		);
	}

	customClientStrategies.set(strategy, handler);
}
