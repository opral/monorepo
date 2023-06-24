import nodePath from "node:path"

/**
 * Determines the closest path from the `options` compared to the `to` path.
 *
 * The patch is only searched for "upwards".
 *
 * @example
 *     const result = determineClosestPath({
            options: [
            'some/path/packages/module-a/config.json',
            'some/path/packages/module-a/src/utils/config.json',
            'some/path/packages/config.json',
            ],
            to: 'some/path/packages/index.js',
        });
        >> 'some/path/packages/config.json'
 */
export function determineClosestPath(args: { options: string[]; to: string }): string {
	const result = {
		path: args.options[0],
		distance: nodePath.relative(args.options[0] as string, args.to).length,
	}
	for (const path of args.options) {
		const distance = nodePath.relative(path, args.to).length
		if (distance < result.distance) {
			result.path = path
			result.distance = distance
		}
	}
	return result.path as string
}
