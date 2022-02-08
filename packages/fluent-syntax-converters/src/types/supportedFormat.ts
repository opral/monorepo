import { converters } from '../converters';

/**
 * Supported formats.
 *
 * Uses the keys of the `converter` object.
 * A converter converts a format other than Fluent to Fluent.
 * Thus, all available converts are all formats this package supports.
 */
export type SupportedFormat = keyof typeof converters;
