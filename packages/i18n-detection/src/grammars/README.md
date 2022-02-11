# Grammars

## Using grammars

Simply fetch the grammar and parse it with [PEG(GY).js](https://github.com/peggyjs/peggy). 


## Writing grammars

All grammars must use [PEG(GY).js](https://github.com/peggyjs/peggy) and must return the following object after parsing:

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
