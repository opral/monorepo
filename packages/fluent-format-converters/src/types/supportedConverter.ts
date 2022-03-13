import { converters } from '../converters';

/**
 * Supported converters (formats).
 *
 * Uses the keys of the `converter` object.
 */
export type SupportedConverter = keyof typeof converters;
