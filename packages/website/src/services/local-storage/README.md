Consistent local storage across the app. Read more https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage.

## Usage

### In a component (or page)

The localStorage [context](https://www.solidjs.com/tutorial/stores_context) must be used.

```ts
function Component() {
  const [localStorage] = useLocalStorage();
}
```

### Outside of a component

Use `getLocalStorage()` like

```ts
const localStorage = getLocalStorage();
```
