# Pages Router (Legacy)

For compatability with older projects we do offer compatability with the pages router.

## Setup

In the pages router we use [Next's built-in i18n routing]((https://nextjs.org/docs/advanced-features/i18n-routing)).

If it wasn't set up already the `paraglide-next init` command will have set it up for you.

It will also have added the `<ParaglideJS>` component to your root layout which makes the language available to all messages. 

Apart from that we just need the regular Paraglide-JS Setup. Create an Inlang project an add messages in `messages/{languageTag}.json`. This should also have been done by the CLI.

## Limitations

The Pages Router is only supported for compatability with older NextJS projects & doesn't benefit from most of the Routing Features in Paraglide-Next. Routing Strategies, Middleware and the Localised Navigation APIs are not supported. 