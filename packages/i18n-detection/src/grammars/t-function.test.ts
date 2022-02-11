import fs from 'fs';
import dedent from 'dedent';
import peggy from 'peggy';
import { Match } from '../types/match';

const grammar = fs.readFileSync('src/grammars/t-function.pegjs', 'utf8');
const parser = peggy.generate(grammar);

it('should detect t("{id}")', () => {
    // double quotes
    const sourceCode = dedent`
      const x = t("some-id")
    `;
    const matches = parser.parse(sourceCode) as Match[];
    expect(matches[0].id === 'some-id');
});

it(`should detect t('{id}')`, () => {
    // single quotes
    const sourceCode = dedent`
      const x = t('some-id')
    `;
    const matches = parser.parse(sourceCode) as Match[];
    expect(matches[0].id === 'some-id');
});

it(`should detect {t('{id}')}`, () => {
    // using the t function in markup
    const sourceCode = dedent`
      <p>{t('some-id')}</p>
    `;
    const matches = parser.parse(sourceCode) as Match[];
    expect(matches[0].id === 'some-id');
});

it(`should detect $t('{id}')`, () => {
    // using a t function with a prefix such as $ in svelte
    const sourceCode = dedent`
      <p>{$t('some-id')}</p>
    `;
    const matches = parser.parse(sourceCode) as Match[];
    expect(matches[0].id === 'some-id');
});

it('should detect t({id}, ...args)', () => {
    // passing arguments to the t function should not prevent detection
    const sourceCode = dedent`
      <p>{$t('some-id', { name: "inlang" }, variable, arg3)}</p>
    `;
    const matches = parser.parse(sourceCode) as Match[];
    expect(matches[0].id === 'some-id');
});

it('should only return location of the id', () => {
    const sourceCode = `t('some-id', ...args)`;
    const matches = parser.parse(sourceCode) as Match[];
    expect(matches[0].id === 'some-id');
    expect(
        sourceCode.slice(matches[0].location.start.offset, matches[0].location.end.offset)
    ).toBe('some-id');
});
