---
title: Refactoring Inlang: Elevating Localization to New Heights
href: /blog/refactoring-inlang
description: We're thrilled to introduce the Inlang refactor, a major milestone in our journey towards making localization simpler, more powerful, and more accessible than ever before.
---

# Refactoring Inlang: Elevating Localization to New Heights

The world of software development is constantly evolving, and so is Inlang. Over the last couple of months we talked to you, our early users, very carefully – and you told us about your challenges with i18n & globalization. And we heard you! We're thrilled to introduce the Inlang refactor, a major milestone in our journey towards making localization simpler, more powerful, and more accessible than ever before. In this blog post, we'll take a deep dive into the exciting changes and enhancements that the new Inlang architecture brings to the table.

## **Revamped Architecture: More Customizable, More Reactive**

**Goodbye, `inlang.config.js`. Hello, `project.inlang.json`!** With this change, customization and interoperability reach new heights. This streamlined approach simplifies configuration management and allows for smoother integration with other tools in your workflow.

Reactivity is a core feature of the new Inlang architecture. As new messages are added, lint rules adapt dynamically. This means you can focus on your code, knowing that your localization rules are always up to date.

We've also revamped the module structure, making it more intuitive and developer-friendly. Whether you're working on plugins or lint rules, you'll find the development process more straightforward than ever before.

![architecture inlang new]("https://cdn.jsdelivr.net/gh/inlang/inlang/documentation/assets/architecture.jpeg")

**New Message Format for Greater Flexibility**

Localization needs vary widely, so we've introduced a new message format. This format empowers you to handle advanced use cases such as pluralization, gender-specific translations, supporting multiple distribution platforms, and even running A/B tests. Whatever your localization challenge, the new Inlang architecture has got you covered.

We've also introduced and renamed core concepts to streamline communication. Say hello to "Inlang module," "Inlang app," and "Inlang plugin" – terms that make localization discussions more efficient and understandable.

```typescript
/**
 * A pattern is a sequence of elements that comprise
 * a message that is rendered to the UI.
 */
export type Pattern = Static<typeof Pattern>
export const Pattern = Type.Array(Type.Union([Text, Expression]))

/**
 * A variant is a pattern that is rendered to the UI.
 */
export type Variant = Static<typeof Variant>
export const Variant = Type.Object({
	languageTag: LanguageTag,
	/**
	 * The number of keys in each variant match MUST equal the number of expressions in the selectors.
	 *
	 * Inspired by: https://github.com/unicode-org/message-format-wg/blob/main/spec/formatting.md#pattern-selection
	 */
	match: Type.Record(Type.String(), Type.String()),
	pattern: Pattern,
})

export type Message = Static<typeof Message>
export const Message = Type.Object({
	id: Type.String(),
	/**
	 * The order in which the selectors are placed determines the precedence of patterns.
	 */
	selectors: Type.Array(Expression),
	variants: Type.Array(Variant),
})
```

## **Enhanced Editor Experience: Real-time Linting and More**

The new Inlang architecture takes your editor experience to the next level. Real-time linting ensures that your translations are clean and error-free as you work. No more waiting until the end to catch mistakes – we've got you covered from the start.

Autosaving is now part of the package, making your workflows faster and more efficient. Focus on your code, and let Inlang handle the rest.

## **VS Code Extension: Faster and Smarter**

Our VS Code extension has received a significant boost. It now starts up faster, allowing you to jump into localization tasks without delay. Real-time linting and message updates keep you in the loop, ensuring that your translations are always on point.

But that's not all. The extension now offers automatic migration from `inlang.config.js` to `project.inlang.json`. This streamlined process makes transitioning to the new Inlang project file a breeze. Plus, we've improved error handling to provide a smoother developer experience.

## **Discover the Inlang Marketplace**

The Inlang Marketplace is your go-to destination for finding apps, libraries, and modules that can supercharge your codebase. But it's not just about what you can find – it's also about what you can share. You now have the opportunity to distribute your own Inlang-based products, contributing to the growth of our vibrant community. And yes, you can even **install modules directly from the store**, making your localization tasks even more efficient.

## **CLI: Streamlined Development**

The new Inlang CLI comes with a range of performance improvements. We've updated the `config init` command to `project init` for clarity. Additionally, we've introduced a new `project migrate` command to simplify the process of migrating your config files to JSON. And for those working on modules, the new `module init` and `module build` commands will simplify your development workflow.

## **Meet Lix: The Future of Version Control for Inlang Apps**

Lix, formerly known as "Project Lisa," is our approach to a new version control system. Lix is a **git-compatible** version control foundation for Inlang apps. We're excited about the possibilities this tool brings to the table. It's designed with both user experience (UX) and developer experience (DX) in mind. Get ready for a host of improvements and benefits as Lix becomes an integral part of the Inlang ecosystem.

## **Paraglide JS: Honoring a Passionate Project Lead**

In a bittersweet moment, we pay tribute to Ivan Hofer, the project lead of SDK-JS, who has sadly passed away. In his memory, we've decided to rename the SDK-JS to "Paraglide JS" in recognition of Ivan's major hobby. We chose not to refactor Paraglide JS *yet* due to two significant reasons – the risk of double migration and the potential to break existing apps.

Rest assured, as long as you keep using your `inlang.config.js`, Paraglide JS will continue to function as expected. We're working tirelessly to provide a stable Paraglide JS library, and we're collaborating closely with "hochdruck" (high pressure) to ensure its reliability. For our SvelteKit users: Dominik Göpel continues working on built-in capabilities for SvelteKit i18n routing & we will share an update soon.

**In Conclusion**

The new Inlang architecture & apps are more than just an update – it's a transformation. With a revamped architecture, powerful message format, improved editor experience, and enhanced CLI, we're putting localization at your fingertips like never before. The introduction of Lix and the renaming of Paraglide JS demonstrate our commitment to innovation and honoring our community.

Upgrade your `inlang.config.js` to `project.inlang.json` today (you can use the `npx inlang project migrate` CLI command), and join us in this exciting new era of localization. Let's make software speak your language, effortlessly.