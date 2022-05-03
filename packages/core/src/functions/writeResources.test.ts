import { fs } from 'memfs';
import type { InlangConfig } from '@inlang/config';
import { writeResources } from './writeResources';
import { Resource, Message, Identifier, Pattern, TextElement } from '@inlang/fluent-ast';

it('should write resources', async () => {
    const config: InlangConfig['any'] = {
        $schema: 'https://raw.githubusercontent.com/inlang/inlang/main/packages/config/src/schemas/v0.1.json',
        fileFormat: 'fluent',
        baseLanguageCode: 'en',
        pathPattern: './{languageCode}.ftl',
        languageCodes: ['en', 'de'],
    };
    const resources = {
        en: new Resource([
            new Message(new Identifier('test'), new Pattern([new TextElement('this is my test')])),
            new Message(new Identifier('hello'), new Pattern([new TextElement('hello there')])),
        ]),
        de: new Resource([
            new Message(new Identifier('test'), new Pattern([new TextElement('dis ist ein test')])),
            new Message(new Identifier('hello'), new Pattern([new TextElement('hallo mit dich')])),
        ]),
    };

    const result = await writeResources({ fs: fs.promises as any, directory: '/', resources, ...config });
    expect(result.isOk).toBeTruthy();
    expect(await fs.promises.readFile('/en.ftl')).toBeTruthy();
    expect(await fs.promises.readFile('/de.ftl')).toBeTruthy();
});

it('should fail if a path does not exist', async () => {
    const config: InlangConfig['any'] = {
        $schema: 'https://raw.githubusercontent.com/inlang/inlang/main/packages/config/src/schemas/v0.1.json',
        fileFormat: 'fluent',
        baseLanguageCode: 'en',
        pathPattern: './none-existent/{languageCode}.ftl',
        languageCodes: ['en', 'de'],
    };
    const resources = {
        en: new Resource([
            new Message(new Identifier('test'), new Pattern([new TextElement('this is my test')])),
            new Message(new Identifier('hello'), new Pattern([new TextElement('hello there')])),
        ]),
        de: new Resource([
            new Message(new Identifier('test'), new Pattern([new TextElement('dis ist ein test')])),
            new Message(new Identifier('hello'), new Pattern([new TextElement('hallo mit dich')])),
        ]),
    };

    const result = await writeResources({ fs: fs.promises as any, directory: '/', resources, ...config });
    expect(result.isOk).toBeFalsy();
});
