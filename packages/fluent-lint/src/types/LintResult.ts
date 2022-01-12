import { Result } from '@inlang/common';
import { LintError } from '../errors/LintError';

/**
 * Utility type to strengthen consistency.
 */
export type LintResult = Result<'isOk', LintError>;
