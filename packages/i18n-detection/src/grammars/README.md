# Grammars

## Using grammars

Simply fetch the grammar and parse it with [PEG(GY).js](https://github.com/peggyjs/peggy).

## Writing grammars

1. Go to https://peggyjs.org/online.html.
2. Enter the code (pattern) that should be matched on the right.
3. Take inspiration from existing grammars.
4. Write your grammer on the left and iterate till it works.
5. Create a grammar file in this directory.
6. Create a test file for the grammar in this directory.
7. Done :)

### Requirements

All grammars must use [PEG(GY).js](https://github.com/peggyjs/peggy) and return the following object after parsing:

`../types/match.ts`:

```ts
/**
 * A match -> detected the usage of i18n in the provided file.
 *
 * `id` = the message/attribute id (`some-id`, `some-id.attribute`)
 * `location` =
 */
export type Match = {
  /**
   * The message/attribute id (`some-id`, `some-id.attribute`).
   */
  id: string;
  /**
   * The location of the match.
   */
  location: {
    source: any;
    start: { offset: number; line: number; column: number };
    end: { offset: number; line: number; column: number };
  };
};
```

`location` can be obtained by using peggys build in `location()` method.
