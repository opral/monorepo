# Inlang typesafe-i18n adapter

Automatically retrieve all translations from the [Inlang translation management platform](https://github.com/inlang/inlang) to the [typesafe-i18n](https://github.com/ivanhofer/typesafe-i18n) package.

## Getting started

1. Fill in the database details in the .env at the root of your project

```
VITE_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
VITE_PUBLIC_SUPABASE_URL="your-supabase-url"
```

2. Write the project id to inlang.json

```
{
    ProjectId: "your-id-here"
}
```

3. Run `npx ts-node @inlang/inlang-typesafe-i18n-adapter`

4. Add your translations to the dashboard and see them appear in your project!
