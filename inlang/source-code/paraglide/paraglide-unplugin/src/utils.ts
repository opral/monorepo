export function makeArray<T>(input: T | T[]): T[] {
	if (Array.isArray(input)) return input
	else return [input]
}
