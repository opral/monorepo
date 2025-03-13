# @inlang/paraglide-astro

## 0.4.1 

Fix: dist folder not uploaded to NPM.


## 0.4.0

Added a deprecation notice. Paraglide JS 2.0 doesn't need adapters anymore. Please use [Paraglide JS 2.0](https://inlang.com/m/gerre34r/library-inlang-paraglideJs/astro) directly. 

## 0.3.5

### Patch Changes

- @inlang/paraglide-vite@1.3.5

## 0.3.4

### Patch Changes

- @inlang/paraglide-vite@1.3.4

## 0.3.3

### Patch Changes

- @inlang/paraglide-vite@1.3.3

## 0.3.2

### Patch Changes

- @inlang/paraglide-vite@1.3.2

## 0.3.1

### Patch Changes

- @inlang/paraglide-vite@1.3.1

## 0.3.0

### Minor Changes

- 80727ee: Add `experimentalUseVirtualModules` option to use the `$paraglide` virtual module instead of writing files to disk. Closes https://github.com/opral/inlang-paraglide-js/issues/264

  - good for projects that can't have `allowJs: true` in their TypeScript config https://github.com/opral/inlang-paraglide-js/issues/238
  - less clutter in the compiled output directory https://github.com/opral/inlang-paraglide-js/issues/189

  ```diff
  import { paraglide } from "@inlang/paraglide-sveltekit/vite"
  import { defineConfig } from "vite"

  export default defineConfig({
  	plugins: [
  		paraglide({
  			project: "./project.inlang",
  			outdir: "./src/lib/paraglide",
  +			experimentalUseVirtualModules: true,
  		}),
      // ... other vite plugins
  	],
  })
  ```

  The compiled output will only emit the `runtime.d.ts` and `messages.d.ts` files.

  ```diff
  .
  └── src/
      └── paraglide/
  -        ├── messages/
  -        │   ├── de.js
  -        │   ├── en.js
  -        │   ├── fr.js
  -        │   └── ...
  -        ├── messages.js
  +        ├── messages.d.ts
  -        └── runtime.js
  +        ├── runtime.d.ts
  ```

### Patch Changes

- Updated dependencies [80727ee]
  - @inlang/paraglide-vite@1.3.0

## 0.2.6

### Patch Changes

- Update the package.json to accept Astro ^5 as peer dependency. Closes https://github.com/opral/inlang-paraglide-js/issues/270

## 0.2.5

### Patch Changes

- @inlang/paraglide-vite@1.2.77

## 0.2.4

### Patch Changes

- @inlang/paraglide-vite@1.2.76

## 0.2.3

### Patch Changes

- @inlang/paraglide-vite@1.2.75

## 0.2.2

### Patch Changes

- @inlang/paraglide-vite@1.2.74

## 0.2.1

### Patch Changes

- @inlang/paraglide-vite@1.2.73

## 0.2.0

### Minor Changes

- bc6f038: In `output: "server"` mode `AsyncLocalStorage` is now used to scope the language-state to the current request.

  `AsyncLocalStorage` is an experimental node API, but it's already extensively used in frameworks like NextJS and is [on track to become a proper TC39 spec](https://github.com/tc39/proposal-async-context). All major serverless platforms support it.

  If you're using Cloudflare you will need to set `compatibility_flags = [ "nodejs_compat" ]` in `wrangler.toml.`

### Patch Changes

- bc6f038: The `base` path is now respected when detecting the language without `astro:i18n`

## 0.1.32

### Patch Changes

- @inlang/paraglide-vite@1.2.72

## 0.1.31

### Patch Changes

- @inlang/paraglide-vite@1.2.71

## 0.1.30

### Patch Changes

- @inlang/paraglide-vite@1.2.70

## 0.1.29

### Patch Changes

- @inlang/paraglide-vite@1.2.69

## 0.1.28

### Patch Changes

- @inlang/paraglide-vite@1.2.68

## 0.1.27

### Patch Changes

- @inlang/paraglide-vite@1.2.67

## 0.1.26

### Patch Changes

- @inlang/paraglide-vite@1.2.66

## 0.1.25

### Patch Changes

- @inlang/paraglide-vite@1.2.65

## 0.1.24

### Patch Changes

- @inlang/paraglide-vite@1.2.64

## 0.1.23

### Patch Changes

- @inlang/paraglide-vite@1.2.63

## 0.1.22

### Patch Changes

- @inlang/paraglide-vite@1.2.62

## 0.1.21

### Patch Changes

- @inlang/paraglide-vite@1.2.61

## 0.1.20

### Patch Changes

- @inlang/paraglide-vite@1.2.60

## 0.1.19

### Patch Changes

- @inlang/paraglide-vite@1.2.59

## 0.1.18

### Patch Changes

- @inlang/paraglide-vite@1.2.58

## 0.1.17

### Patch Changes

- @inlang/paraglide-vite@1.2.57

## 0.1.16

### Patch Changes

- @inlang/paraglide-vite@1.2.56

## 0.1.15

### Patch Changes

- @inlang/paraglide-vite@1.2.55

## 0.1.14

### Patch Changes

- @inlang/paraglide-vite@1.2.54

## 0.1.13

### Patch Changes

- @inlang/paraglide-vite@1.2.53

## 0.1.12

### Patch Changes

- @inlang/paraglide-vite@1.2.52

## 0.1.11

### Patch Changes

- @inlang/paraglide-vite@1.2.51

## 0.1.10

### Patch Changes

- @inlang/paraglide-vite@1.2.50

## 0.1.9

### Patch Changes

- @inlang/paraglide-vite@1.2.49

## 0.1.8

### Patch Changes

- @inlang/paraglide-vite@1.2.48

## 0.1.7

### Patch Changes

- @inlang/paraglide-vite@1.2.47

## 0.1.6

### Patch Changes

- @inlang/paraglide-vite@1.2.46

## 0.1.5

### Patch Changes

- @inlang/paraglide-vite@1.2.45

## 0.1.4

### Patch Changes

- @inlang/paraglide-vite@1.2.44

## 0.1.3

### Patch Changes

- @inlang/paraglide-vite@1.2.43

## 0.1.2

### Patch Changes

- @inlang/paraglide-vite@1.2.42

## 0.1.1

### Patch Changes

- @inlang/paraglide-vite@1.2.41

## 0.1.30

### Patch Changes

- @inlang/paraglide-js-adapter-vite@1.2.40

## 0.1.29

### Patch Changes

- @inlang/paraglide-js-adapter-vite@1.2.39

## 0.1.28

### Patch Changes

- @inlang/paraglide-js-adapter-vite@1.2.38

## 0.1.27

### Patch Changes

- @inlang/paraglide-js-adapter-vite@1.2.37

## 0.1.26

### Patch Changes

- @inlang/paraglide-js-adapter-vite@1.2.36

## 0.1.25

### Patch Changes

- @inlang/paraglide-js-adapter-vite@1.2.35

## 0.1.24

### Patch Changes

- @inlang/paraglide-js-adapter-vite@1.2.34

## 0.1.23

### Patch Changes

- @inlang/paraglide-js-adapter-vite@1.2.33

## 0.1.22

### Patch Changes

- @inlang/paraglide-js-adapter-vite@1.2.32

## 0.1.21

### Patch Changes

- @inlang/paraglide-js-adapter-vite@1.2.31

## 0.1.20

### Patch Changes

- @inlang/paraglide-js-adapter-vite@1.2.30

## 0.1.19

### Patch Changes

- @inlang/paraglide-js-adapter-vite@1.2.29

## 0.1.18

### Patch Changes

- 95cf84e: fix: `languageTag()` not being set properly on windows. This bug was caused by duplicate module instantiation.
  - @inlang/paraglide-js-adapter-vite@1.2.28

## 0.1.17

### Patch Changes

- @inlang/paraglide-js-adapter-vite@1.2.27

## 0.1.16

### Patch Changes

- @inlang/paraglide-js-adapter-vite@1.2.26

## 0.1.15

### Patch Changes

- @inlang/paraglide-js-adapter-vite@1.2.25

## 0.1.14

### Patch Changes

- @inlang/paraglide-js-adapter-vite@1.2.24

## 0.1.13

### Patch Changes

- bcd4ad8: Respect the `path` when using astro's built in i18n

## 0.1.12

### Patch Changes

- @inlang/paraglide-js-adapter-vite@1.2.23

## 0.1.11

### Patch Changes

- @inlang/paraglide-js-adapter-vite@1.2.22

## 0.1.10

### Patch Changes

- @inlang/paraglide-js-adapter-vite@1.2.21

## 0.1.9

### Patch Changes

- @inlang/paraglide-js-adapter-vite@1.2.20

## 0.1.8

### Patch Changes

- @inlang/paraglide-js-adapter-vite@1.2.19

## 0.1.7

### Patch Changes

- @inlang/paraglide-js-adapter-vite@1.2.18

## 0.1.6

### Patch Changes

- @inlang/paraglide-js-adapter-vite@1.2.17

## 0.1.5

### Patch Changes

- @inlang/paraglide-js-adapter-vite@1.2.16

## 0.1.4

### Patch Changes

- 26c0a8b0c: update `package.json` metadata

## 0.1.3

### Patch Changes

- @inlang/paraglide-js-adapter-vite@1.2.15

## 0.1.2

### Patch Changes

- @inlang/paraglide-js-adapter-vite@1.2.14

## 0.1.1

### Patch Changes

- @inlang/paraglide-js-adapter-vite@1.2.13
