import { it, expect, describe } from "vitest";
import { parse } from "./messageReferenceMatchers.js";

it("should not match a string without a t function", async () => {
  const sourceCode = `
    const x = some("some-id")
    `;
  const matches = await parse(sourceCode);
  expect(matches).toHaveLength(0);
});

describe("Function", () => {
  it('should detect t("{id}")', async () => {
    // double quotes
    const sourceCode = `
    const x = t("some-id")
    `;
    const matches = await parse(sourceCode);
    expect(matches[0].messageId === "some-id");
  });

  it(`should detect t('{id}')`, async () => {
    // single quotes
    const sourceCode = `
    const x = t('some-id')
    `;
    const matches = await parse(sourceCode);
    expect(matches[0].messageId === "some-id");
  });

  it(`should detect {t('{id}')}`, async () => {
    // using the t function in markup
    const sourceCode = `
    <p>{t('some-id')}</p>
    `;
    const matches = await parse(sourceCode);
    expect(matches[0].messageId === "some-id");
  });

  it(`should detect $t('{id}')`, async () => {
    // using a t function with a prefix such as $ in svelte
    const sourceCode = `
    <p>{$t('some-id')}</p>
    `;
    const matches = await parse(sourceCode);
    expect(matches[0].messageId === "some-id");
  });

  it("should detect t({id}, ...args)", async () => {
    // passing arguments to the t function should not prevent detection
    const sourceCode = `
    <p>{$t('some-id' , { name: "inlang" }, variable, arg3)}</p>
    `;
    const matches = await parse(sourceCode);
    expect(matches[0].messageId === "some-id");
  });

  it("should not mismatch a string with different quotation marks", async () => {
    const sourceCode = `
    <p>{$t("yes')}</p>
    `;
    const matches = await parse(sourceCode);
    expect(matches).toHaveLength(0);
  });

  // it('should match with no pre-fixed whitespace', () => {
  //     const sourceCode = `t('some-id')`;
  //     const matches = parser.parse(sourceCode) as Match[];
  //     expect(matches[0].id === 'some-id');
  // });

  it("should ignore whitespace", async () => {
    // prefixing with space see test above
    const sourceCode = ` t('some-id' ) `;
    const matches = await parse(sourceCode);
    expect(matches[0].messageId === "some-id");
    expect(
      sourceCode.slice(
        matches[0].position.start.character,
        matches[0].position.end.character
      )
    ).toBe("some-id");
  });

  it("should detect combined message.attribute ids", async () => {
    const sourceCode = ` t('some-message.with-attribute')`;
    const matches = await parse(sourceCode);
    expect(matches[0].messageId === "some-message.with-attribute");
  });
});
