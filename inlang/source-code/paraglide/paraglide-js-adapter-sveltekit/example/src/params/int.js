/**
 * @returns {param is number}
 */
export function match(param) {
	try {
		const parsed = parseFloat(param)
		if (isNaN(parsed)) return false


		//if it's an integer
		return parsed === Math.round(parsed)
	} catch (e) {
		return false
	}
}
