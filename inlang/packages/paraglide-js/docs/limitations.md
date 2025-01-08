# Limitations

## Per language splitting is not implemented yet

Read [scaling](https://inlang.com/m/gerre34r/scaling) for more information.

Paraglide JS does not support per language splitting yet. This means that if you have more than 10 languages, you will have a large bundle size than a traditional runtime based i18n library. 

## Native support for components in messages is not implemented yet

Read the [markup placeholder discussion](https://github.com/orgs/opral/discussions/913).

The workaround is to write HTML directly in the message and render the message as HTML. 

```json
{
  "my_cool_message": "Hello <strong>{name}</strong>!"
}
```

```html
<div innerHTML={m.my_cool_message({name: "John"})}></div>
```

## Messages with `.` in the key can't be compiled yet 

TypeScript recently shipped arbitrary module exports which will make this possible in the future. Follow issue [#285](https://github.com/opral/inlang-paraglide-js/issues/285). 
