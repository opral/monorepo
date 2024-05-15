## FAQ

<doc-accordion
	heading="Can I also prefix the default language?"
	text="Yes, you can also include the default language in the URL by passing prefixDefaultLanguage: 'always' to createI18n.">
</doc-accordion>

<doc-accordion
	heading="Can I change default language?"
	text="Yes, using the 'defaultLanguage' option on 'createI18n'.">
</doc-accordion>

<doc-accordion
	heading="Do I have to have the language in the URL?"
	text="Using the right options you can get the language from anywhere, but the main benefit of using this library is the i18n routing. If you don't plan on using that you might be
	better off using ParaglideJS directly.">
</doc-accordion>

<doc-accordion
	heading="'Can't find module $paraglide/runtime.js' - What do I do?"
	text="This likely means that you haven't registered the $paraglide alias for src/paraglide in svelte.config.js. Try adding that. Check the example if you're stuck">
</doc-accordion>

<doc-accordion
	heading="How can I make my alternate links full urls when prerendering?"
	text="According to the spec, alternate links should be full urls that include the protocol and origin. By default Paraglide-SvelteKit can't know which URL your page will be deployed to while prerendering, so it only includes the path in the alternate url, not the origin or protocol. This works, but is suboptimal. You can tell Paraglide-SvelteKit which url you will be deploying to by setting kit.prerender.origin in your svelte.config.js">
</doc-accordion>

<doc-accordion
	heading="Does this work with vite-plugin-kit-routes"
	text="Yes! Vite-plugin-kit-routes should work with no additional configuration">
</doc-accordion>

<doc-accordion
	heading="Can I dynamically fetch translations from an external server?"
	text="Paraglide is a compiler, so all translations need to be known at build time. You can of course manually react to the current language & fetch external content, but you will end up implementing your own solution for dynamically fetched translations.">
</doc-accordion>

<doc-accordion
	heading="Help! Links in +layout.svelte aren't being translated"
	text="As stated in the caveats, <a> tags are not translated if they are in the same component as the <ParaglideJS> component. Move your Links into a different component and it should work.">
</doc-accordion>
