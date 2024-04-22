# ParaglideJS Example with NextJS Pages Router
This is an example of how to use ParaglideJS with NextJS Pages Router. It shows that Paraglide is still able to work with NextJS Pages Router.

The interesting files are:
- `next.config.js` - Where the i18n configuration is set up
- `pages/_app.js` - Where the language is passed to ParaglideJS
- `pages/_document.js` - Where the `html` lang attribute is set
- `pages/index.js` and `pages/about.js` - Where some messages are used