# Run the app (dashboard) locally

0. get the env file from @samuelstroschein
1. `npm install`
2. `npm run dev`
3. Open [localhost:3000](http://localhost:3000)

## Structure of the app

The app is developed with [SvelteKit](https://kit.svelte.dev/), [CarbonComponents](https://carbon-svelte.vercel.app/) and [TailwindCSS](https://tailwindcss.com/).
Most questions should be answered by reading the documentation of either one of them.

## Pull latest database types

[see this](https://supabase.io/docs/reference/javascript/generating-types)

### 1.

run the following from command line and root folder:

```
npx openapi-typescript https://jxaqemnoabezizetynth.supabase.co/rest/v1/\?apikey\=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYzMTcxNDM1NywiZXhwIjoxOTQ3MjkwMzU3fQ.aKT6sg-vJjnCUNitwy9HrIpl1rVAaP9NWIc9K7WFu6w --output src/lib/types/databaseDefinitions.ts

```

### 2. Adjust some types manually

All array types have to be adjusted e.g.:  
`locales: string;` -> `locales: string[];`

JSON types too, either with `Record<x,y>` or a specific type like `translations: Translations;`

Some string types e.g. `locale: string` -> `locale: Locale`
