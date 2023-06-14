import { it, expect } from "vitest"
import { parse } from "./messageReferenceMatchers.typescript.js"

it("should not match a string without a t function", async () => {
	const sourceCode = `
    const x = some("some-id")
    `
	const matches = await parse(sourceCode)
	expect(matches).toHaveLength(0)
})

it('should detect t("{id}")', async () => {
	// double quotes
	const sourceCode = `
    const x = t("some-id")
    `
	const matches = await parse(sourceCode)
	expect(matches[0]?.messageId).toBe("some-id")
})

it(`should detect t('{id}')`, async () => {
	// single quotes
	const sourceCode = `
    const x = t('some-id')
  `
	const matches = await parse(sourceCode)
	expect(matches[0]?.messageId).toBe("some-id")
})

it(`should detect {t('{id}')}`, async () => {
	// using the t function in markup
	const sourceCode = `
    <p>{t('some-id')}</p>
    `
	const matches = await parse(sourceCode)
	expect(matches[0]?.messageId).toBe("some-id")
})

it("should detect t({id}, ...args)", async () => {
	// passing arguments to the t function should not prevent detection
	const sourceCode = `
    <p>{t('some-id' , { name: "inlang" }, variable, arg3)}</p>
    `
	const matches = await parse(sourceCode)
	expect(matches[0]?.messageId).toBe("some-id")
})

it("should not mismatch a string with different quotation marks", async () => {
	const sourceCode = `
    <p>{t("yes')}</p>
    `
	const matches = await parse(sourceCode)
	expect(matches).toHaveLength(0)
})

it("should ignore whitespace", async () => {
	// prefixing with space see test above
	const sourceCode = `const x =  t('some-id' ) `
	const matches = await parse(sourceCode)
	expect(matches[0]?.messageId).toBe("some-id")
	expect(
		sourceCode.slice(matches[0]?.position.start.character, matches[0]?.position.end.character),
	).toBe("some-id")
})

it("should detect combined message.attribute ids", async () => {
	const sourceCode = ` t('some-message.with-attribute')`
	const matches = await parse(sourceCode)
	expect(matches[0]?.messageId).toBe("some-message.with-attribute")
})

it("should work on a production JSX example", async () => {
	const sourceCode = `
		import NextPage from "next";
		import Image from "next/image";
		import { useTranslation } from "react-multi-lang";

		t("hello-world")

		const Custom404: NextPage = () => {
			const t = useTranslation();
			return (
				<div className="flex h-screen items-center justify-center">
					<Image
						src="/icons/warning.svg"
						alt={t("404.title")}
						height={25}
						width={25}
					/>
					<h6>{t("421.message")}</h6>
				</div>
			);
		};

		export default Custom404;
		`
	const matches = await parse(sourceCode)
	expect(matches).toHaveLength(3)
	expect(matches[0].messageId).toBe("hello-world")
	expect(matches[1].messageId).toBe("404.title")
	expect(matches[2].messageId).toBe("421.message")
})
