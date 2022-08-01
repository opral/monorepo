import ftl from '@fluent/dedent';
import { parseResource } from './parseResource';

it('should parse a resource', () => {
    const resource = ftl`
    welcome = "Welcome to the world of Python"
        .button = "Click me"

    wordle = "Play a game of wordle!"
    `;
    const result = parseResource(resource);
    expect(result.isOk).toEqual(true);
});

it('should parse an empty resource body as Resource', () => {
    const resource = ftl`
    `;
    const result = parseResource(resource).unwrap();
    const junk = result.body.filter((entry) => entry.type === 'Junk');
    expect(junk.length).toEqual(0);
});
