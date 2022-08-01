import { determineClosestPath } from './determineClosestPath';
import path from 'path';

it('should find the closest path', () => {
    const result = determineClosestPath({
        from: [
            'some/path/packages/module-a/config.json',
            'some/path/packages/module-a/src/utils/config.json',
            'some/path/packages/config.json',
        ],
        to: 'some/path/packages/module-a/src/utils/foo/index.js',
        relative: path.relative,
    });
    expect(result).toBe('some/path/packages/module-a/src/utils/config.json');
});

it('should find the closest path', () => {
    const result = determineClosestPath({
        from: [
            'some/path/packages/module-a/config.json',
            'some/path/packages/module-a/src/utils/config.json',
            'some/path/packages/config.json',
        ],
        to: 'some/path/packages/index.js',
        relative: path.relative,
    });
    expect(result).toBe('some/path/packages/config.json');
});
