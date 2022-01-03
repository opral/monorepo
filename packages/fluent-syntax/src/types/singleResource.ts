import { Resource } from '@fluent/syntax';

/**
 * A single resource.
 *
 * A helper type to avoid ambiguity between fluents provided `Resource`
 * and the "extension" class `Resources`.
 */
export type SingleResource = Resource;
