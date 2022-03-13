import { parseResources } from './parseResources';
import { serializeResources } from './serializeResources';
import { converters } from '../converters/index';

it('should serialize a file correctly', () => {
    const parsed = parseResources({
        converter: converters.fluent,
        files: [
            {
                languageCode: 'en',
                data: 'test = this is my test\nhello = hello there\ncomplex = Hello {$name}\nextra = a key without translations',
            },
            {
                languageCode: 'da',
                data: 'test = dette er min test\nhello = hej med dig\ncomplex = Hej {$name}',
            },
            {
                languageCode: 'de',
                data: 'test = dis ist ein test\nhello = hallo mit dich\ncomplex = Hallo {$name}',
            },
        ],
    });
    if (parsed.isErr) {
        fail();
    }
    const result = serializeResources({ converter: converters.fluent, resources: parsed.value });
    if (result.isErr) fail();
    expect(result.value).toEqual([
        {
            data: 'test = this is my test\nhello = hello there\ncomplex = Hello { $name }\nextra = a key without translations\n',
            languageCode: 'en',
        },
        {
            data: 'test = dette er min test\nhello = hej med dig\ncomplex = Hej { $name }\n',
            languageCode: 'da',
        },
        {
            data: 'test = dis ist ein test\nhello = hallo mit dich\ncomplex = Hallo { $name }\n',
            languageCode: 'de',
        },
    ]);
});
