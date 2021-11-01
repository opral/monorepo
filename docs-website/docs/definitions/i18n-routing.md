---
title: i18n Routing
---

i18n routing is a technique used to provide an interface for different locales by adding a `/lang/` structure to the url path, for example: *www.inlang.dev/de/example*. The language parameter, in this case "de" (German), makes it possible to evaluate the requested language and show the correct content (in this example German content).

`www.inlang.dev/example` -> Website in default language (in most cases en)  
`www.inlang.dev/fr/example` -> French website  
`www.inlang.dev/de/example` -> German website
