import { describe, expect, test } from 'vitest';
import { transformPageSvelte } from './+page.svelte.js';
import { transformSvelte } from './_.svelte.js';
import { initTransformConfig } from './test.utils.js';

describe('transformPageSvelte', () => {
	test('should call transformSvelte', async () => {
		const code = "<script>console.log('hello world')</script>"
		const config = initTransformConfig()
		const transformed = transformPageSvelte("", config, code, true)
		expect(transformed).toBe(transformSvelte("", config, code))
		// expect(transformed).toBe(code)
		// expect(transformSvelte).toBeCalled()
	})
})