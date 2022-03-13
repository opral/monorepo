/**
 * Determines the closest path from the `options` compared to the `to` path.
 *
 * The patch is only searched for "upwards".
 *
 * @argument args.relative relative path resolution function (node path.relative)
 *
 * @example
 *     const result = determineClosestPath({
            from: [
            'some/path/packages/module-a/config.json',
            'some/path/packages/module-a/src/utils/config.json',
            'some/path/packages/config.json',
            ],
            to: 'some/path/packages/index.js',
        });
        >> 'some/path/packages/config.json'
 */
export function determineClosestPath(args: {
    from: string[];
    to: string;
    relative: (from: string, to: string) => string;
}): string {
    const result = {
        path: args.from[0],
        distance: args.relative(args.from[0], args.to).length,
    };
    for (const path of args.from) {
        const distance = args.relative(path, args.to).length;
        if (distance < result.distance) {
            result.path = path;
            result.distance = distance;
        }
    }
    return result.path;
}
