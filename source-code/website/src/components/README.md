UI components used across the app.

Some components are not real components but spread APIs or classes as indicated by the `.ts` ending instead of `.tsx`.

### Using dynamic colors like `bg-${props.color}`

The tailwind config is set up to detect dynamic color classes like `bg-${color}` or `bg-${props.color}`. See [/source-code/website/tailwind.config.cjs](/source-code/website/tailwind.config.cjs).
