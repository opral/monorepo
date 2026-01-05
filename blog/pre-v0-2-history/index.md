---
og:title: "Pre v0.2 History of Inlang"
og:description: "The history of inlang before v0.2."
---

# Pre v0.2 History of Inlang

## September 2021: Proof of Concept II

The previous proof of concept was limited to specific web-frameworks like NextJS and SvelteKit. It became clear
that for most software stacks, having the translations living in the source code is ensured more compatibility.

The proof of concept II made use of a GitHub integration to commit translation file (changes) to source code
instead of relying on SSR. The app still "reported" missing translations, the main pain that got me started
working on inlang.

Watch: https://www.youtube.com/watch?v=mivXTx-cpcM

## Early August 2021: "Can't i18n be easier?" Proof of Concept posted on Reddit

By the time of the reddit post, I had an IoT company with a B2C app that had to be offered in German and English. Even though I am fluent
in German (and somewhat) English, internationalizing the app was a pain. I used the summer break to develop a proof of concept which
would solve one of my main pains: missing translations.

To solve the problem, I had a relatively simple idea. Why does the app not "report" the translations it needs?

https://www.reddit.com/r/sveltejs/comments/p4h6bg/proof_of_concept_internationalize_a_svelte_app_in/

Watch: https://www.youtube.com/watch?v=6xzbc6QYzDs

Btw, I did not plan to develop inlang further after that reddit post. I was about to start my masters
and knew I would be easily distracted otherwise. However, by coincidance, my proof of concept and myself ended up as part
of project within my masters which meant the further development of inlang, and touchée, dropping out of my masters.
