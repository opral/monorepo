# NextJS Guide

**Video Tutorial**

[![Video Tutorial](https://img.youtube.com/vi/fnmM-sih_7Y/0.jpg)](https://www.youtube.com/watch?v=fnmM-sih_7Y)


### Requirements

1. You setup [internationalized routing](https://nextjs.org/docs/advanced-features/i18n-routing) in your NextJS app. 
2. Installed inlang via npm or yarn.
3. Created a project at [inlang.dev](https://app.inlang.dev)

### 1. Load Translations via `getStaticProps()`

Export an async function called `getStaticProps()` at every page you have which loads the translations like so:

```TS
export async function getStaticProps(context){
  const translations = await loadTranslations(<your project domain>, context.locale)
  return {
    props: {
      translations
    }
  }
}
```

In your page component get the translations from the props and `setTranslations()`.

```TS
export default function Home( { translations } ) {
  setTranslations(translations)
  return (
    <h1>Hello World</h1>
  )
}
```

Read more about NextJS's `getStaticProps()` [here](https://nextjs.org/docs/basic-features/data-fetching#getstaticprops-static-generation)

### 2. Use `t()` for everything you want to translate

```JS
<h1>{t(`Hello World`)}</h1>
```

### 3. Manage your translations at [inlang.dev](https://app.inlang.dev)

The setup is done. 

## Current limitations: 

- Rendering html content in a `t('Click <a href="https://inlang.dev">here</a>')` function is only possible with 
  an external dependency which parses the string back to HTML. See [html-react-parser](https://www.npmjs.com/package/html-react-parser).
  Auto translating your content within XML tags such as `<a></a>` is possible already.
