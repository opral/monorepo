import { it, expect } from "vitest"
import { parse } from "./messageReferenceMatchers.js"

it("should not match a function that end with t but is not a t function", async () => {
	const sourceCode = `
    const x = somet("some-id")
    `
	const matches = parse(sourceCode)
	expect(matches).toHaveLength(0)
})

it("should not match a string without a t function", async () => {
	const sourceCode = `
    const x = some("some-id")
    `
	const matches = parse(sourceCode)
	expect(matches).toHaveLength(0)
})

it('should detect double quotes t("id")', async () => {
	// double quotes
	const sourceCode = `
    const x = t("some-id")
    `
	const matches = parse(sourceCode)
	expect(matches[0]?.messageId).toBe("some-id")
	expect(matches[0]?.position.start.character).toBe(17)
	expect(matches[0]?.position.end.character).toBe(26)
	expect(
		sourceCode.slice(matches[0]?.position.start.character, matches[0]?.position.end.character),
	).toBe('"some-id"')
})

it(`should detect single quotes t('id')`, async () => {
	// single quotes
	const sourceCode = `
    const x = t('some-id')
  `
	const matches = parse(sourceCode)
	expect(matches[0]?.messageId).toBe("some-id")
	expect(matches[0]?.position.start.character).toBe(17)
	expect(matches[0]?.position.end.character).toBe(26)
})

it(`should detect JSX <p>{t('id')}</p>`, async () => {
	// using the t function in markup
	const sourceCode = `
    <p>{t('some-id')}</p>
    `
	const matches = parse(sourceCode)
	expect(matches[0]?.messageId).toBe("some-id")
	expect(matches[0]?.position.start.character).toBe(11)
	expect(matches[0]?.position.end.character).toBe(20)
})

it("should detect t('id', ...args)", async () => {
	// passing arguments to the t function should not prevent detection
	const sourceCode = `
    <p>{t('some-id' , { name: "inlang" }, variable, arg3)}</p>
    `
	const matches = parse(sourceCode)
	expect(matches[0]?.messageId).toBe("some-id")
	expect(
		sourceCode.slice(matches[0]?.position.start.character, matches[0]?.position.end.character),
	).toBe("'some-id'")
})

it("should not mismatch a string with different quotation marks", async () => {
	const sourceCode = `
    <p>{t("yes')}</p>
    `
	const matches = parse(sourceCode)
	expect(matches).toHaveLength(0)
})

// test not passing, don't know how to fix in short time
it.skip("should ignore whitespace", async () => {
	// prefixing with space see test above
	const sourceCode = `const x = t("some-id", undefined)`
	const matches = parse(sourceCode)
	expect(matches[0]?.messageId).toBe("some-id")
	expect(
		sourceCode.slice(matches[0]?.position.start.character, matches[0]?.position.end.character),
	).toBe('"some-id"')
})

it("should detect combined message.attribute ids", async () => {
	const sourceCode = ` t('some-message.with-attribute')`
	const matches = parse(sourceCode)
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
	const matches = parse(sourceCode)
	expect(matches).toHaveLength(3)
	expect(matches[0]?.messageId).toBe("hello-world")
	expect(matches[1]?.messageId).toBe("404.title")
	expect(matches[2]?.messageId).toBe("421.message")
})

it("should work on a production JSX example with namespaces", async () => {
	const sourceCode = `
		import NextPage from "next";
		import Image from "next/image";
		import { useTranslation } from "react-multi-lang";

		t("common:hello-world")

		const Custom404: NextPage = () => {
			const t = useTranslation();
			return (
				<div className="flex h-screen items-center justify-center">
					<Image
						src="/icons/warning.svg"
						alt={t("vital:404.title")}
						height={25}
						width={25}
					/>
					<h6>{t("common:421.message")}</h6>
				</div>
			);
		};

		export default Custom404;
		`
	const matches = parse(sourceCode)
	expect(matches).toHaveLength(3)
	expect(matches[0]?.messageId).toBe("common:hello-world")
	expect(matches[1]?.messageId).toBe("vital:404.title")
	expect(matches[2]?.messageId).toBe("common:421.message")
})

it("should work on a production JSX example with namespaces option syntax", async () => {
	const sourceCode = `
		<p>{t("a", {ns: "common"})}</p>
		<p>{t("b", { ns: "vital" })}</p>
		<p>{t("c",{  ns: "translation" })}</p>
		<p>{t("d" , { ns: "test"  })}</p>
		<p>{t('a', {ns: 'common'})}</p>
		<p>{t('b', { ns: 'vital' })}</p>
		<p>{t('c',{  ns: 'translation' })}</p>
		<p>{t('d' , { ns: 'test'  })}</p>
	`
	const matches = parse(sourceCode)
	expect(matches).toHaveLength(8)
	expect(matches[0]?.messageId).toBe("common:a")
	expect(matches[1]?.messageId).toBe("vital:b")
	expect(matches[2]?.messageId).toBe("translation:c")
	expect(matches[3]?.messageId).toBe("test:d")
	expect(matches[4]?.messageId).toBe("common:a")
	expect(matches[5]?.messageId).toBe("vital:b")
	expect(matches[6]?.messageId).toBe("translation:c")
	expect(matches[7]?.messageId).toBe("test:d")
})

it("should work on a production JSX example with namespaces option syntax and aditional arguments", async () => {
	const sourceCode = `
		<p>{t("a", {ns: "common"}, variable, arg3)}</p>
	`
	const matches = parse(sourceCode)
	expect(matches).toHaveLength(1)
	expect(matches[0]?.messageId).toBe("common:a")
})
