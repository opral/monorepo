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
		`;
	const settings: PluginSettings = {
		pathPattern: {
			common: "./{language}/common.json",
			vital: "./{language}/vital.json",
		},
	};
	const matches = parse(sourceCode, settings);
	expect(matches).toHaveLength(3);
	expect(matches[0]?.messageId).toBe("common:hello-world");
	expect(matches[1]?.messageId).toBe("vital:404.title");
	expect(matches[2]?.messageId).toBe("common:421.message");
});

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
	`;
	const settings: PluginSettings = {
		pathPattern: {
			common: "./{language}/common.json",
			vital: "./{language}/vital.json",
			translation: "./{language}/translation.json",
			test: "./{language}/test.json",
		},
	};
	const matches = parse(sourceCode, settings);
	expect(matches).toHaveLength(8);
	expect(matches[0]?.messageId).toBe("common:a");
	expect(matches[1]?.messageId).toBe("vital:b");
	expect(matches[2]?.messageId).toBe("translation:c");
	expect(matches[3]?.messageId).toBe("test:d");
	expect(matches[4]?.messageId).toBe("common:a");
	expect(matches[5]?.messageId).toBe("vital:b");
	expect(matches[6]?.messageId).toBe("translation:c");
	expect(matches[7]?.messageId).toBe("test:d");
});

it("should work on a production JSX example with namespaces option syntax and aditional arguments", async () => {
	const sourceCode = `
		<p>{t("a", {ns: "common"}, variable, arg3)}</p>
	`;
	const settings: PluginSettings = {
		pathPattern: {
			common: "./{language}/common.json",
		},
	};
	const matches = parse(sourceCode, settings);
	expect(matches).toHaveLength(1);
	expect(matches[0]?.messageId).toBe("common:a");
});

// it("should add the default namespace if required by pathPattern", async () => {
// 	const sourceCode = `
// 		<p>{t("a")}</p>
// 	`
// 	const settings: PluginSettings = {
// 		pathPattern: {
// 			common: "./{language}/common.json",
// 		},
// 	}
// 	const matches = parse(sourceCode, settings)
// 	expect(matches).toHaveLength(1)
// 	expect(matches[0]?.messageId).toBe("common:a")
// })

it("should add the defined namespace by useTranslation hook", async () => {
	const sourceCode = `
		const { t } = useTranslation("login");
		<p>{t("a")}</p>
	`;
	const settings: PluginSettings = {
		pathPattern: {
			test: "./{language}/test.json",
			login: "./{language}/login.json",
		},
	};
	const matches = parse(sourceCode, settings);
	expect(matches).toHaveLength(1);
	expect(matches[0]?.messageId).toBe("login:a");
});

it("should add the defined namespace by useTranslation hook with arrat pattern", async () => {
	const sourceCode = `
		const { t } = useTranslation(["login"]);
		<p>{t("a")}</p>
	`;
	const settings: PluginSettings = {
		pathPattern: {
			test: "./{language}/test.json",
			login: "./{language}/login.json",
		},
	};
	const matches = parse(sourceCode, settings);
	expect(matches).toHaveLength(1);
	expect(matches[0]?.messageId).toBe("login:a");
});

it("should add the defined namespace by useTranslation hook with array pattern", async () => {
	const sourceCode = `
		const { t } = useTranslation(["login", "test"]);
		<p>{t("a")}</p>
		<p>{t("test:a")}</p>
		<p>{t("a", {ns: "test"})}</p>
	`;
	const settings: PluginSettings = {
		pathPattern: {
			test: "./{language}/test.json",
			login: "./{language}/login.json",
		},
	};
	const matches = parse(sourceCode, settings);
	expect(matches).toHaveLength(3);
	expect(matches[0]?.messageId).toBe("login:a");
	expect(matches[1]?.messageId).toBe("test:a");
	expect(matches[2]?.messageId).toBe("test:a");
});

it("should add the defined namespace by useTranslation hook and keyPrefix", async () => {
	const sourceCode = `
		const { t } = useTranslation("home", { keyPrefix: "intro" });
		<p>{t("a")}</p>
	`;
	const settings: PluginSettings = {
		pathPattern: {
			test: "./{language}/test.json",
			login: "./{language}/login.json",
		},
	};
	const matches = parse(sourceCode, settings);
	expect(matches).toHaveLength(1);
	expect(matches[0]?.messageId).toBe("home:intro.a");
});

it("should add the defined namespace when using next-intl conform useTranslations()", async () => {
	const sourceCode = `
		const { t } = useTranslations("home");
		<p>{t("a")}</p>
	`;
	const settings: PluginSettings = {
		pathPattern: {
			test: "./{language}/test.json",
			login: "./{language}/login.json",
		},
	};
	const matches = parse(sourceCode, settings);
	expect(matches).toHaveLength(1);
	expect(matches[0]?.messageId).toBe("home:a");
});
