import { exportI18nNext } from '../../src/adapters/reacti18n';

test('empty translations returns empty files array', () => {
	const result = exportI18nNext({ translations: [] });
	expect(result).toEqual({ files: [] });
});
