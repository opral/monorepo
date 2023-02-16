import type { LintReport } from './context.js';

// TODO: print also the trace to that report
// e.g. Resource['de']->Message['first-message']

export const printReport = (report: LintReport): void => {
	if (!report) return

	const { id, level, message, metadata } = report
	const method = level === 'error' ? 'error' : 'warn'
	console[method](`[${level}] (${id}) ${message}`, metadata ?? '');
}
