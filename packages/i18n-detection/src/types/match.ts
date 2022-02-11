import { LocationRange } from 'peggy';

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
     *
     * `offset` is a 0-based character index within the source text.
     * `line` and `column` are 1-based indices.
     *
     * ```
     * {
     *  source: any;
     *  start: { offset: number; line: number; column: number };
     *  end: { offset: number; line: number; column: number };
     * }
     * ```
     */
    location: LocationRange;
};
