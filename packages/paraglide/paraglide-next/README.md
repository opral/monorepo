# Getting Started

Get started instantly with the Paraglide-Next CLI.

```bash
npx @inlang/paraglide-next init
npm install
```

The CLI will ask you which languages you want to support. This can be changed later.

It will:

- Create an [Inlang Project](https://inlang.com/documentation/concept/project)
- Create translation files for each of your languages
- Add necessary Provider Components and files
- Update your `next.config.js` file to use the Paraglide-Next Plugin.
- Offer to automatically migrate to the [Localized navigation APIs](#localized-navigation-apis) if you're using the App Router (recommended)

You can now start your development server and visit `/de`, `/ar`, or whatever languages you've set up.

## Creating and Using Messages

Your messages live in `messages/{languageTag}.json` files. You can add messages in these files as key-value pairs of the message ID and the translations.

Use curly braces to add parameters.

```json
// messages/en.json
{
	// The $schema key is automatically ignored
	"$schema": "https://inlang.com/schema/inlang-message-format",

	"hello_world": "Hello World!",
	"greetings": "Greetings {name}."
}
```

Learn more about the format in the [Inlang Message Format Documentation](https://inlang.com/m/reootnfj/plugin-inlang-messageFormat).

## Using Messages in Code

Use messages by importing them from `@/paraglide/messages.js`. By convention, we do a wildcard import as `m`.

```tsx
import * as m from "@/paraglide/messages.js"

export function Home() {
	return (
		<>
			<h1>{m.homepage_title()}</h1>
			<p>{m.homepage_subtitle({ some: "param" })}</p>
		</>
	)
}
```

Only messages used in client components are sent to the client. Messages in Server Components don't impact bundle size.

# Examples

You can find example projects in [our GitHub repository](https://github.com/opral/monorepo/tree/main/inlang/source-code/paraglide/paraglide-next/examples), or try them on StackBlitz:

<doc-links>
    <doc-link title="App Router Example" icon="simple-icons:stackblitz" href="https://stackblitz.com/~/LorisSigrist/paraglide-next-app-router-example" description="Try out the App router example on StackBlitz"></doc-link>
    <doc-link title="App Router Example Repository" icon="lucide:github" href="https://github.com/opral/monorepo/tree/main/inlang/source-code/paraglide/paraglide-next/examples/app" description="View the source code for the App router Example"></doc-link>
    <doc-link title="Pages Router Example" icon="simple-icons:stackblitz" href="https://stackblitz.com/~/LorisSigrist/paraglide-next-app-router-example" description="Try out the Pages router example on StackBlitz"></doc-link>
	<doc-link title="App Router Example Repository" icon="lucide:github" href="https://github.com/opral/monorepo/tree/main/inlang/source-code/paraglide/paraglide-next/examples/pages" description="View the source code for the Pages router Example"></doc-link>
</doc-links>

# People Love It

<doc-comments>
<doc-comment text="Awesome library 🙂 Thanks so much! 1) The docs were simple and straight forward 2) Everything just worked.. no headaches" author="Dimitry" icon="mdi:discord" data-source="https://discord.com/channels/897438559458430986/1083724234142011392/1225658097016766574"></doc-comment>
<doc-comment text="Thank you for that huge work you have done and still doing!" author="ZerdoX-x" icon="mdi:github"></doc-comment>
</doc-comments>
