import { translationFilesGlobPattern } from '../../src/utils/translationFilesGlobPattern';

it('should return the correct glob pattern', () => {
  const cwd = '/User/code';
  const pathPattern = './translations/{languageCode}.ftl';
  const result = translationFilesGlobPattern({ cwd, pathPattern });
  expect(result).toBe('/User/code/translations/**');
});
