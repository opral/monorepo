import { Result } from '@inlang/result';
import { LintError } from '../errors/lintError';

/**
 * Utility type to strengthen consistency.
 */
export type LintResult = Result<'isOk', LintError>;
