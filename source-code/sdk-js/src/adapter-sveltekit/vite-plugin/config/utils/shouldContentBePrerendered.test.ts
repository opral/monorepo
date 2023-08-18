import { describe, it } from 'vitest'

describe('should return `false`', () => {
	it.todo('if no file exists')
	it.todo('if file does not have a `prerender` export')
	it.todo('if file has a `prerender` export set to `false`')
})

describe('should return `true`', () => {
	it.todo('if a file has a `prerender` export set to `true`')
	it.todo('if a file has a `prerender` export set to `auto`')
	it.todo('should work in `.js` files')
	it.todo('should work in `.ts` files')
	it.todo('should work with import statements')
})