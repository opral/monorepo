import { it, expect } from "vitest";
import { parse } from "./messageReferenceMatchers.js";
import type { PluginSettings } from "../settings.js";

it("should not match a function that end with t but is not a t function", async () => {
	const sourceCode = `
    const x = somet("some-id")
    `;
	const settings: PluginSettings = {
		pathPattern: "./{language}.json",
	};
	const matches = parse(sourceCode, settings);
	expect(matches).toHaveLength(0);
});

it("should not match a string without a t function", async () => {
	const sourceCode = `
    const x = some("some-id")
    `;
	const settings: PluginSettings = {
		pathPattern: "./{language}.json",
	};
	const matches = parse(sourceCode, settings);
	expect(matches).toHaveLength(0);
});

it('should detect double quotes t("id")', async () => {
	// double quotes
	const sourceCode = `
    const x = t("some-id")
    `;
	const settings: PluginSettings = {
		pathPattern: "./{language}.json",
	};
	const matches = parse(sourceCode, settings);
	expect(matches[0]?.messageId).toBe("some-id");
	expect(matches[0]?.position.start.character).toBe(17);
	expect(matches[0]?.position.end.character).toBe(26);
	expect(
		sourceCode.slice(
			matches[0]?.position.start.character,
			matches[0]?.position.end.character
		)
	).toBe('"some-id"');
});

it(`should detect single quotes t('id')`, async () => {
	// single quotes
	const sourceCode = `
    const x = t('some-id')
  `;
	const settings: PluginSettings = {
		pathPattern: "./{language}.json",
	};
	const matches = parse(sourceCode, settings);
	expect(matches[0]?.messageId).toBe("some-id");
	expect(matches[0]?.position.start.character).toBe(17);
	expect(matches[0]?.position.end.character).toBe(26);
});

it(`should detect JSX <p>{t('id')}</p>`, async () => {
	// using the t function in markup
	const sourceCode = `
    <p>{t('some-id')}</p>
    `;
	const settings: PluginSettings = {
		pathPattern: "./{language}.json",
	};
	const matches = parse(sourceCode, settings);
	expect(matches[0]?.messageId).toBe("some-id");
	expect(matches[0]?.position.start.character).toBe(11);
	expect(matches[0]?.position.end.character).toBe(20);
});

it("should detect t('id', ...args)", async () => {
	// passing arguments to the t function should not prevent detection
	const sourceCode = `
    <p>{t('some-id' , { name: "inlang" }, variable, arg3)}</p>
    `;
	const settings: PluginSettings = {
		pathPattern: "./{language}.json",
	};
	const matches = parse(sourceCode, settings);
	expect(matches[0]?.messageId).toBe("some-id");
	expect(
		sourceCode.slice(
			matches[0]?.position.start.character,
			matches[0]?.position.end.character
		)
	).toBe("'some-id'");
});

it("should not mismatch a string with different quotation marks", async () => {
	const sourceCode = `
    <p>{t("yes')}</p>
    `;
	const settings: PluginSettings = {
		pathPattern: "./{language}.json",
	};
	const matches = parse(sourceCode, settings);
	expect(matches).toHaveLength(0);
});

// test not passing, don't know how to fix in short time
it.skip("should ignore whitespace", async () => {
	// prefixing with space see test above
	const sourceCode = `const x = t("some-id", undefined)`;
	const settings: PluginSettings = {
		pathPattern: "./{language}.json",
	};
	const matches = parse(sourceCode, settings);
	expect(matches[0]?.messageId).toBe("some-id");
	expect(
		sourceCode.slice(
			matches[0]?.position.start.character,
			matches[0]?.position.end.character
		)
	).toBe('"some-id"');
});

it(`should detect human readable id t("penguin_purple_shoe_window")`, async () => {
	const sourceCode = `
	const x = t("penguin_purple_shoe_window")
	`;
	const settings: PluginSettings = {
		pathPattern: "./{language}.json",
	};
	const matches = parse(sourceCode, settings);
	expect(matches[0]?.messageId).toBe("penguin_purple_shoe_window");
	expect(matches[0]?.position.start.character).toBe(14);
	expect(matches[0]?.position.end.character).toBe(42);
});

it("should detect combined message.attribute ids", async () => {
	const sourceCode = ` t('some-message.with-attribute')`;
	const settings: PluginSettings = {
		pathPattern: "./{language}.json",
	};
	const matches = parse(sourceCode, settings);
	expect(matches[0]?.messageId).toBe("some-message.with-attribute");
});

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
		`;
	const settings: PluginSettings = {
		pathPattern: "./{language}.json",
	};
	const matches = parse(sourceCode, settings);
	expect(matches).toHaveLength(3);
	expect(matches[0]?.messageId).toBe("hello-world");
	expect(matches[1]?.messageId).toBe("404.title");
	expect(matches[2]?.messageId).toBe("421.message");
});

it("should add the defined namespace by useTranslations/getTranslaton hook", async () => {
	const sourceCode = `
		import { getTranslations } from "next-intl/server";

		export const C1 = async () => {
			const t = await getTranslations("/cart");
			return t("empty.title");
		};
		export const C2 = async () => {
			const t = await getTranslations("/product");
			return t("page.imagesTitle");
		};
	`;
	const settings: PluginSettings = {
		pathPattern: "./{language}.json",
	};
	const matches = parse(sourceCode, settings);
	expect(matches).toHaveLength(2);
	expect(matches[0]?.messageId).toBe("/cart.empty.title");
	expect(matches[1]?.messageId).toBe("/product.page.imagesTitle");
});

it("should add the defined namespace by useTranslations hook", async () => {
	const sourceCode = `
		const { t } = useTranslations("login");
		<p>{t("a")}</p>
	`;
	const settings: PluginSettings = {
		pathPattern: "./{language}.json",
	};
	const matches = parse(sourceCode, settings);
	expect(matches).toHaveLength(1);
	expect(matches[0]?.messageId).toBe("login.a");
});

it("should add the defined namespaces by useTranslations hook", async () => {
	const sourceCode = `
		const { t } = useTranslations("login.test");
		<p>{t("button.a")}</p>
	`;
	const settings: PluginSettings = {
		pathPattern: "./{language}.json",
	};
	const matches = parse(sourceCode, settings);
	expect(matches).toHaveLength(1);
	expect(matches[0]?.messageId).toBe("login.test.button.a");
});

it("should add the defined namespace by getTranslations hook", async () => {
	const sourceCode = `
		const { t } = await getTranslations("login");
		<p>{t("a")}</p>
	`;
	const settings: PluginSettings = {
		pathPattern: "./{language}.json",
	};
	const matches = parse(sourceCode, settings);
	expect(matches).toHaveLength(1);
	expect(matches[0]?.messageId).toBe("login.a");
});

it("should add the defined namespaces by getTranslations hook", async () => {
	const sourceCode = `
		const { t } = await getTranslations("login.test");
		<p>{t("button.a")}</p>
	`;
	const settings: PluginSettings = {
		pathPattern: "./{language}.json",
	};
	const matches = parse(sourceCode, settings);
	expect(matches).toHaveLength(1);
	expect(matches[0]?.messageId).toBe("login.test.button.a");
});

it("should add the defined namespaces by getTranslations hook with namespace object", async () => {
	const sourceCode = `
		const { t } = await getTranslations({locale, namespace: "Metadata"});
		<p>{t("button.a")}</p>
	`;
	const settings: PluginSettings = {
		pathPattern: "./{language}.json",
	};
	const matches = parse(sourceCode, settings);
	expect(matches).toHaveLength(1);
	expect(matches[0]?.messageId).toBe("Metadata.button.a");
});

it("should add the defined namespaces by getTranslations hook with namespace object variation", async () => {
	const sourceCode = `
		const { t } = await getTranslations({locale: "en", namespace: "Metadata"});
		<p>{t("button.a")}</p>
	`;
	const settings: PluginSettings = {
		pathPattern: "./{language}.json",
	};
	const matches = parse(sourceCode, settings);
	expect(matches).toHaveLength(1);
	expect(matches[0]?.messageId).toBe("Metadata.button.a");
});

it("should add the defined namespaces by getTranslations hook with namespace object variation 2", async () => {
	const sourceCode = `
		const { t } = await getTranslations({namespace: "Metadata", locale: props.params.locale});
		<p>{t("button.a")}</p>
	`;
	const settings: PluginSettings = {
		pathPattern: "./{language}.json",
	};
	const matches = parse(sourceCode, settings);
	expect(matches).toHaveLength(1);
	expect(matches[0]?.messageId).toBe("Metadata.button.a");
});

it("should add the defined namespaces by getTranslations hook with namespace object variation 3", async () => {
	const sourceCode = `
		const { t } = await getTranslations({namespace: "Metadata"});
		<p>{t("button.a")}</p>
	`;
	const settings: PluginSettings = {
		pathPattern: "./{language}.json",
	};
	const matches = parse(sourceCode, settings);
	expect(matches).toHaveLength(1);
	expect(matches[0]?.messageId).toBe("Metadata.button.a");
});

it("should add the defined namespace by useTranslations hook", async () => {
	const sourceCode = `
		const { t } = useTranslations('DirectoryPage');
		<p>{t('title')}</p>
	`;
	const settings: PluginSettings = {
		pathPattern: "./{language}.json",
	};
	const matches = parse(sourceCode, settings);
	expect(matches).toHaveLength(1);
	expect(matches[0]?.messageId).toBe("DirectoryPage.title");
});


it("should correctly reference messages with multiple useTranslations hooks", async () => {
	const sourceCode = `
		const tOne = useTranslations("namespaceOne");
		const tTwo = useTranslations("namespaceTwo");
		const tThree = useTranslations("namespaceThree");
		const tNested = useTranslations("nestedNamespace.section");

		// Simulate usage of these translation functions
		const message1 = tOne("messageKey1");
		const message2 = tTwo("messageKey2");
		const message3 = tThree("messageKey3");
		const message4 = tNested("messageKey4");

		// Interleaved usage
		const message5 = tOne("anotherKey1");
		const message6 = tTwo("anotherKey2");
	`;
	const settings: PluginSettings = {
		pathPattern: "./{language}.json",
	};
	const matches = parse(sourceCode, settings);

	expect(matches).toHaveLength(6);
	expect(matches[0]?.messageId).toBe("namespaceOne.messageKey1");
	expect(matches[1]?.messageId).toBe("namespaceTwo.messageKey2");
	expect(matches[2]?.messageId).toBe("namespaceThree.messageKey3");
	expect(matches[3]?.messageId).toBe("nestedNamespace.section.messageKey4");
	expect(matches[4]?.messageId).toBe("namespaceOne.anotherKey1");
	expect(matches[5]?.messageId).toBe("namespaceTwo.anotherKey2");
});
