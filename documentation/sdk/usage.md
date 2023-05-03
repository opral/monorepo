---
title: Usage
href: /documentation/sdk/usage
description: This is a list of all the functions you can export from the inlang SDK, what they provide and how to use them.
---

# {% $frontmatter.title %}

With `@inlang/sdk-js` you get many useful functions to help you implement internationalization in your application. This is a list of all the functions, what they provide and how to use them.

## `i`

With the `i` function you can get the a language dependent text. The function takes the key of the text as a parameter and returns the string according to the current language.

#### Example

```js
import { i } from "@inlang/sdk-js"

function App() {
	// language is "en" => "Welcome" is returned
	return <h1>{i("welcome")}</h1>
}
```

## `language`

The `language` function returns the current language of the application.

#### Example

```js
import { language } from "@inlang/sdk-js"

function App() {
	// language is "en" => "en" is returned
	return <h1>{language}</h1>
}
```

## `languages`

The `languages` function returns the current language of the application.

#### Example

```js
import { languages } from "@inlang/sdk-js"

funtion App() {
  // list of all languages is returned
  return (
    <ul>
      {languages.map((language) => (
        <li>{language}</li>
      ))}
    </ul>
  )
}
```

## `referenceLanguage`

The `referenceLanguage` function returns the reference language that is used to translate the texts.

#### Example

```js
import { referenceLanguage } from "@inlang/sdk-js"

function App() {
	// referenceLanguage is "en" => "en" is returned
	return <h1>{referenceLanguage}</h1>
}
```

## `switchLanguage`

The `switchLanguage` function allows you to change the language of the application. The function takes the language as a parameter and returns a promise that resolves when the language has been changed.

#### Example

```js
import { switchLanguage } from "@inlang/sdk-js"

function App() {
	return (
		<button
			onClick={() => {
				switchLanguage("de")
			}}
		>
			Switch to German
		</button>
	)
}
```

## `loadResource`

The `loadResource` function allows you to load the resource file for a specific language. The function takes the language as a parameter and returns a promise that resolves when the resource file has been loaded.

#### Example

```js
import { loadResource } from "@inlang/sdk-js"

function App() {
	return (
		<button
			onClick={() => {
				loadResource("de")
			}}
		>
			Load German
		</button>
	)
}
```

## `route`

The `route` function allows you to get the current route of the application. The function returns the current route as a string.

#### Example

```js
import { route } from "@inlang/sdk-js"

function App() {
	// route is "en/home" => "en/home" is returned
	return <h1>{route}</h1>
}
```
