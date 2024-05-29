import { describe, it } from "vitest"
import { render as ssr } from "svelte/server"
import { CompileOptions, preprocess } from "svelte/compiler"
import { preprocessor as createPreprocessor } from "./index"
import { compile } from "svelte/compiler"
import { rollup } from "rollup"
import virtual from "@rollup/plugin-virtual"
import alias from "@rollup/plugin-alias"
import { nodeResolve } from "@rollup/plugin-node-resolve"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const preprocessor = createPreprocessor({})

//Make sure these tests are run concurrently - Otherwise they will take forever
describe.concurrent(
	"preprocessor",
	() => {
		it("leaves non-translatable attributes alone", async ({ expect }) => {
			const hardcodedElementCode = `<a href="/test" data-no-translate>Test</a>`
			const dynamicElementCode = `<svelte:element this={"a"} href="/test" data-no-translate>Test</svelte:element>`

			const hardcodedElementHtml = await renderComponent(hardcodedElementCode)
			const dynamicElementHtml = await renderComponent(dynamicElementCode)

			expect(hardcodedElementHtml).toMatchInlineSnapshot(
				'"<a href=\\"/test\\" data-no-translate=\\"\\">Test</a>"'
			)
			expect(dynamicElementHtml).toMatchInlineSnapshot(
				'"<a  href=\\"/test\\" data-no-translate=\\"\\">Test</a>"'
			)
		})

		it("translates hardcoded href attributes", async ({ expect }) => {
			const code = `<a href="/test">Test</a>`
			const html = await renderComponent(code)
			expect(html).toMatchInlineSnapshot(`"<a href=\\"/rewritten\\">Test</a>"`)
		})

		it("translates parameterized href attributes", async ({ expect }) => {
			const code = `
        <script>
            const href = "/test"
        </script>
        <a href={href}>Test</a>`

			const html = await renderComponent(code)
			expect(html).toMatchInlineSnapshot(`"<a href=\\"/rewritten\\">Test</a>"`)
		})

		it("translates links inside {#if} blocks", async ({ expect }) => {
			const code = `
        <script>
            const href = "/test"
			const show = true;
        </script>
		{#if show}
        	<a href={href}>Test</a>
		{/if}
		`

			const html = await renderComponent(code)
			expect(html).toMatchInlineSnapshot('"<a href=\\"/rewritten\\">Test</a>"')
		})

		it("translates links inside {:else} blocks", async ({ expect }) => {
			const ifCode = `
		{#if false}
			<span>If</span>
		{:else}
        	<a href = "/test">Test</a>
		{/if}
		`

			const eachCode = `
		{#each [] as item}
			<span>Each</span>
		{:else}
			<a href = "/test">Test</a>
		{/each}
		`

			const elseIfCode = `
		{#if false}
			<span>If</span>
		{:else if true}
			<a href = "/test">Test</a>
		{:else}
			<span>Else</span>
		{/if}
		`

			const ifHtml = await renderComponent(ifCode)
			const eachHtml = await renderComponent(eachCode)
			const elseIfHtml = await renderComponent(elseIfCode)

			expect(ifHtml).toMatchInlineSnapshot('"<a href=\\"/rewritten\\">Test</a>"')
			expect(eachHtml).toMatchInlineSnapshot('"<a href=\\"/rewritten\\">Test</a>"')
			expect(elseIfHtml).toMatchInlineSnapshot('"<a href=\\"/rewritten\\">Test</a>"')
		})

		it("translates links inside {:then} and {:catch} blocks", async ({ expect }) => {
			const code = `
		<script>
			const promise = "not a promise -> resolves instantly"
		</script>
		{#await promise}
			<span>Awaiting</span>
		{:then}<a href = "/test">Test</a>{/await}
		`

			const html = await renderComponent(code)
			expect(html).toMatchInlineSnapshot('"<a href=\\"/rewritten\\">Test</a>"')
		})

		it("translates shorthand href attributes", async ({ expect }) => {
			const code = `
        <script>
            const href = "/test"
        </script>
        <a {href}>content</a>`

			const html = await renderComponent(code)
			expect(html).toMatchInlineSnapshot('"<a href=\\"/rewritten\\">content</a>"')
		})

		it("uses the hreflang attribute", async ({ expect }) => {
			const code = `<a href="/test" hreflang="de" >content</a>`

			const html = await renderComponent(code)
			expect(html).toMatchInlineSnapshot(
				'"<a href=\\"/rewritten/de\\" hreflang=\\"de\\">content</a>"'
			)
		})

		it("uses the hreflang attribute with shorthand", async ({ expect }) => {
			const code = `
        <script>
            const lang = "de"
        </script>
        <a href="/test" hreflang={lang} >content</a>`

			const html = await renderComponent(code)
			expect(html).toMatchInlineSnapshot(
				'"<a href=\\"/rewritten/de\\" hreflang=\\"de\\">content</a>"'
			)
		})

		it("translates the spread operator - no hreflang", async ({ expect }) => {
			const code = `
        <script>
            const props = { href: "/test" }
        </script>
        <a {...props} >content</a>`

			const html = await renderComponent(code)
			expect(html).toMatchInlineSnapshot('"<a href=\\"/rewritten\\">content</a>"')
		})

		it("translates the spread operator - with hreflang", async ({ expect }) => {
			const code = `
        <script>
            const props = { href: "/test", hreflang: "de" }
        </script>
        <a {...props} >content</a>`

			const html = await renderComponent(code)
			expect(html).toMatchInlineSnapshot(
				'"<a href=\\"/rewritten/de\\" hreflang=\\"de\\">content</a>"'
			)
		})

		it("translates <svelte:element> tags if they are links", async ({ expect }) => {
			const hardcoded = `<svelte:element this={"a"} href="/test" hreflang="de" >content</svelte:element>`
			const parameterized = `<script>
			const as = "a"
		</script>
		<svelte:element this={as} href="/test" hreflang="de" />`

			const hardcodedHtml = await renderComponent(hardcoded)
			const parameterizedHtml = await renderComponent(parameterized)

			expect(hardcodedHtml).toMatchInlineSnapshot(
				'"<a  href=\\"/rewritten/de\\" hreflang=\\"de\\">content</a>"'
			)
			expect(parameterizedHtml).toMatchInlineSnapshot(
				'"<a  href=\\"/rewritten/de\\" hreflang=\\"de\\"></a>"'
			)
		})

		it("handles the spread operator on <svelte:element> tags", async ({ expect }) => {
			const formCode = `
		<script>
			//Hreflang doens't do anything on forms, but it's a good test case
			const props = { action: "/test", hreflang: "de" }
		</script>
		<svelte:element this={"form"} {...props} />`

			const linkCode = `
		<script>
			const props = { href: "/test", hreflang:  "de"	 }
		</script>
		<svelte:element this={"a"} {...props} >content</svelte:element>`

			const formHtml = await renderComponent(formCode)
			const linkHtml = await renderComponent(linkCode)

			expect(formHtml).toMatchInlineSnapshot(
				'"<form  action=\\"/rewritten\\" hreflang=\\"de\\"></form>"'
			)
			expect(linkHtml).toMatchInlineSnapshot(
				'"<a  href=\\"/rewritten/de\\" hreflang=\\"de\\">content</a>"'
			)
		})

		it("ignore  the href value if it isn't a string", async ({ expect }) => {
			const attributeCode = `
		<script>
		  let href = undefined
		</script>

		<a href={href} >content</a>
		`

			const shorthandCode = `
		<script>
		  let href = undefined
		</script>

		<a {href} >content</a>
		`

			const spreadCode = `
		<script>
		  let href = undefined
		</script>

		<a {...{href}} >content</a>
		`

			expect(await renderComponent(attributeCode)).toMatchInlineSnapshot('"<a>content</a>"')
			expect(await renderComponent(shorthandCode)).toMatchInlineSnapshot('"<a>content</a>"')
			expect(await renderComponent(spreadCode)).toMatchInlineSnapshot('"<a>content</a>"')
		})

		it("translates the action attribute of forms", async ({ expect }) => {
			const code = `<form action="/test" ></form>`

			const html = await renderComponent(code)
			expect(html).toMatchInlineSnapshot('"<form action=\\"/rewritten\\"></form>"')
		})

		it("translates the formaction attribute of buttons", async ({ expect }) => {
			const code = `<button formaction="/test" ></button>`

			const html = await renderComponent(code)
			expect(html).toMatchInlineSnapshot('"<button formaction=\\"/rewritten\\"></button>"')
		})

		it("translates the spread operator - with external hreflang", async ({ expect }) => {
			const code = `
        <script>
            const props = { href: "/test" }
        </script>
        <a {...props} hreflang="de" >content</a>`

			const html = await renderComponent(code)
			expect(html).toMatchInlineSnapshot(
				'"<a href=\\"/rewritten/de\\" hreflang=\\"de\\">content</a>"'
			)
		})

		it("handles conflicting hreflang values (last one wins)", async ({ expect }) => {
			const code = `
        <script>
            const props_1 = { href: "/test", hreflang: "en" }
            const props_2 = { hreflang: "de" }
        </script>
        <a {...props_1} hreflang="fr" {...props_2} >content</a>`

			const html = await renderComponent(code)
			expect(html).toMatchInlineSnapshot(
				'"<a href=\\"/rewritten/de\\" hreflang=\\"de\\">content</a>"'
			)
		})

		it("handles a language switcher", async ({ expect }) => {
			const code = `
        <script>
            const availableLanguageTags = ["de", "en"]
        </script>
     

		{#each availableLanguageTags as lang}
			<a href="/test" hreflang={lang}>{lang}</a>
		{/each}
		`

			const html = await renderComponent(code)
			expect(html).toMatchInlineSnapshot(
				'"<a href=\\"/rewritten/de\\" hreflang=\\"de\\">de</a><a href=\\"/rewritten/en\\" hreflang=\\"en\\">en</a>"'
			)
		})

		it("handles stores as hrefs", async ({ expect }) => {
			const code = `
        <script>
            import { readable } from 'svelte/store';
			const href = readable("/test");
        </script>
        <a href={$href} hreflang="de">content</a>`
			const html = await renderComponent(code)
			expect(html).toMatchInlineSnapshot(
				'"<a href=\\"/rewritten/de\\" hreflang=\\"de\\">content</a>"'
			)
		})

		it("rewrites hrefs in components with snippets", async ({ expect }) => {
			const code = `
				{#snippet myLink(href)}
				<a href={href}>content</a>
				{/snippet}
				
				{@render myLink("/test")}
				`
			const html = await renderComponent(code)
			expect(html).toMatchInlineSnapshot('"<a href=\\"/rewritten\\">content</a>"')
		})

		it("handles rune syntax", async ({ expect }) => {
			const code = `
        <script>
            const href = $state("/test")
        </script>
		<a href={href}>test</a>
		`

			const html = await renderComponent(code)
			expect(html).toMatchInlineSnapshot('"<a href=\\"/rewritten\\">test</a>"')
		})

		it("handles rune with shorthand", async ({ expect }) => {
			const code = `
        <script>
            const href = $state("/test")
        </script>
		<a {href}>test</a>
		`

			const html = await renderComponent(code)
			expect(html).toMatchInlineSnapshot('"<a href=\\"/rewritten\\">test</a>"')
		})
	},
	{ timeout: 60_000 }
)

/**
 * Takes in a svelte component -> preprocesses it -> SSRs it in context -> returns the html
 *
 * This truly is one of the test utilities of all time
 */
async function renderComponent(svelteCode: string) {
	const EntrySvelteCode = `
    <script>
		import { setParaglideContext } from "@inlang/paraglide-sveltekit/internal" 
        import Component from './Component.svelte'
        import { setContext } from 'svelte';

        setParaglideContext({
            translateHref: (href, lang) => {
                let value = '/rewritten'
                if(lang) value += '/' + lang
                return value
            }
        });
    </script>

    <Component />
    `
	const compilerOptions: CompileOptions = {
		generate: "server",
	}

	const preprocessedEntry = await preprocess(EntrySvelteCode, preprocessor, {
		filename: "src/Entry.svelte",
	})
	const preprocessedComponent = await preprocess(svelteCode, preprocessor, {
		filename: "src/Component.svelte",
	})

	const compiledEntry = compile(preprocessedEntry.code, compilerOptions)
	const compiledComponent = compile(preprocessedComponent.code, compilerOptions)

	// if there are warnings, throw them
	if (compiledComponent.warnings.length >= 1) {
		const warnings = [...compiledComponent.warnings]
		throw new Error("Got Warning while compiling: \n\n" + warnings.map((w) => w.code).join("\n\n"))
	}

	const bundle = await rollup({
		input: "src/Entry.svelte",
		plugins: [
			virtual({
				"src/Entry.svelte": compiledEntry.js.code,
				"src/Component.svelte": compiledComponent.js.code,
			}),
			nodeResolve(),
			alias({
				entries: {
					"@inlang/paraglide-sveltekit/internal": path.resolve(
						__dirname,
						"../../runtime/internal/index.js"
					),
				},
			}),
		],
	})

	const compiledBundle = await bundle.generate({ format: "esm" })
	const base64Bundle = Buffer.from(compiledBundle.output[0].code).toString("base64")
	const module = await import("data:text/javascript;base64," + base64Bundle)
	const { html } = ssr(module.default, { context: new Map(), props: {} })

	//remove all html comments
	return html.replace(/<!--.*?-->/g, "")
}
