# Using ParaglideJS with Next.js' App Router

In this guide you will lean how to add internationalised routing to your Next.js App that's using the App Router. We will use [Paraglide-Next](https://inlang.com/m/osslbuzt/paraglide-next-i18n) for managing messages and i18n routing.

Paraglide is a great fit for the NextJS App router because it uses a compiler to generate tree-shakeable messages. That way your client bundle only includes the messages that are used in client components on any given page.

## Installing dependencies

First, set up a NextJS project using the App Router.
Then run Paraglide's init CLI & install dependencies

```bash
npx @inlang/paraglide-next init
npm install
```

The CLI will ask you which messages you want to support. Don't worry, this can be changed later.

The Command will do a few things:

- Create an inlang project in your project root
- Add the required devDependencies to your `package.json`
- Generate a `messages/` folder with a file for each language
- Add a `middleware.ts` file with the necessary routing logic.
- Add a `lib/i18n.ts` file for configuring i18n routing
- Add the paraglide compiler plugin to your `next.config.js` file.

## Our first Message

Your translations live in the generated `messages/{lang}.json` files. The files contian key-value pairs of message ids and translations. Nesting is _not_ supported.

```json
// messages/en.json
{
  "$schema": "https://inlang.com/schema/inlang-message-format",
  "greeting": "Hello {name}!"
}
```

The Paraglide compiler needs to re-run when your messages change. This happens automatically while your dev-server is running & right before you build. The compiler output is placed in `src/paraglide`.

Let's use the `greeting` message on our homepage. Open `app/page.tsx`, import all messages from `@/paraglide/messages.js` and use the `greeting` message by simply calling it.

```jsx
import * as m from "@/paraglide/messages"; //use nextjs's default alias for src folder

export default function Home() {
  return (
    <div>
      <h1>{m.greeting({ name: "World" })}</h1>
    </div>
  );
}
```

You should now see `"Hello World!"` on the homepage!

Switch languages by navigating to `/en` and `/de`.

> Note: If you are using Visual Studio Code, you should install the [Sherlock VsCode extension](https://inlang.com/m/r7kp499g/app-inlang-ideExtension). It will give you inline previews of messages and allow you to edit them right in your source code.

## Navigating

We can show a page in a given language by prefixing it with the locale. Eg: `/en/about` and `/de/about`. But adding the prefix to all our `<Link>` components will get tedious quickly.

This is why Paraglide-Next provides a custom `<Link>` component that automatically adds the locale to the href (and has a few other superpowers that we will get to later). It's exported from `@/lib/i18n`.

Replace the `<Link>` imports from `next/link` with the `Link` component from `@/lib/i18n`. This can be done quickly with a find & replace.

```diff
- import Link from "next/link"
+ import { Link } from "@/lib/i18n"
```

```jsx
<Link href="/about" />

//will render with the current language
<a href="/de/about" />
```

You can specify which language a link should be in by adding a `locale` prop:

```jsx
<Link href="/about" locale="de" />
```

And your imports from `next/navigation` with the ones from `@/lib/i18n`.

There are similar convenience functions for `usePathname`, `useRouter`, `redirect`, and `permanentRedirect`.

```diff
- import { usePathname, useRouter, redirect, permanentRedirect} from "next/navigation"
+ import { usePathname, useRouter, redirect, permanentRedirect} from "@/lib/i18n"
```

All navigation hooks take & return paths without the locale prefix.

```jsx
const pathname = usePathname(); // will be `/about` if the current path is `/de/about`

// will redirect to `/en/about` or `/de/about` depending on the current language
redirect("/about");
permanentRedirect("/about");

// will navigate to `/en/about` or `/de/about` depending on the current language
const router = useRouter();
router.push("/about");
router.replace("/about");
```

## Building a Language Switcher

You can build a Language Switcher by linking to the current page with a different language. This can be done with an `<Link>` tag or with a programmatic navigation.

```jsx
import { Link, usePathname } from "@/lib/i18n";

export default function LanguageSwitcher() {
  const pathname = usePathname(); //make sure to use the one from `@/lib/i18n`
  return (
    <div>
      <Link href={pathname} locale="en" hreflang="en">
        English
      </Link>
      <Link href={pathname} locale="de" hreflang="de">
        Deutsch
      </Link>
    </div>
  );
}
```

## Translated Pathnames

Currently the names of the pages are the same in all languages. Eg: `/en/about` and `/de/about`.
Wouldn't it be nice if we could have different names for each language?

In `lib/i18n` you can add the `pathnames` to the `createI18n` function. There, provide a map of the paths to the translated pathnames. You can use parameters using square brackets, catch-all parameters using triple-dots and optional parameters using double-square brackets.

```ts
// src/lib/i18n.ts
export const { ... } = createI18n<AvailableLanguageTag>({
	pathnames: {
		"/about": {
			en: "/about",
			de: "/ueber-uns",
		},
		"/admin/[...rest]" : {
			en: "/admin/[...rest]",
			de: "/administration/[...rest]",
		},
		"/user/[[id]]" : {
			en: "/user/[[id]]",
			de: "/benutzer/[[id]]",
		}
	}
})
```

## Changing the configured languages

You can edit which languages you support in `project.inlang/settings.json`.

```json
// project.inlang/settings.json
{
  "$schema": "https://inlang.com/schema/project-settings",
  "sourceLanguageTag": "en", // The main language you author your messages in
  "languageTags": ["en", "de"] // The languages you support
}
```

## Next Steps

You now have a fully functional multilingual NextJS app using ParaglideJS. Wasn't that hard was it?

You can check out the full source code of this example [here](https://github.com/opral/monorepo/tree/main/inlang/packages/paraglide/paraglide-next/examples/app).

If you want to learn more about Paraglide, check out the [Paraglide-Next Documentation](https://inlang.com/m/osslbuzt/paraglide-next-i18n). If you need help or have some ideas, feel free to reach out to us on [Discord](https://discord.gg/CNPfhWpcAa) or open a Discussion on [GitHub](https://github.com/opral/monorepo/discussions).
