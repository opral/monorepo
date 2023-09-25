[BCP-47 language tags](https://en.wikipedia.org/wiki/IETF_language_tag) types and validators.

> Always bear in mind that the golden rule is to keep your language tag as short as possible. Only add further subtags to your language tag if they are needed to distinguish the language from something else in the context where your content is used.

## Language tags

Further information on choosing the language tag for your content can be found in the [W3C article on choosing language tags](https://www.w3.org/International/questions/qa-choosing-language-tags).

```js
/^(
  (?<grandfathered>
    (en-GB-oed|i-ami|i-bnn|i-default|i-enochian|i-hak|i-klingon|i-lux|
    i-mingo|i-navajo|i-pwn|i-tao|i-tay|i-tsu|sgn-BE-FR|sgn-BE-NL|sgn-CH-DE)|
    (art-lojban|cel-gaulish|no-bok|no-nyn|zh-guoyu|zh-hakka|zh-min|zh-min-nan|zh-xiang)
  )|
  (
    (?<language>
      ([A-Za-z]{2,3}(-(?<extlang>[A-Za-z]{3}(-[A-Za-z]{3}){0,2}))?)
      ([A-Za-z]{2,3}(-(?<extlang>[A-Za-z]{3}(-[A-Za-z]{3}){0,2}))?)|
      [A-Za-z]{4}|[A-Za-z]{5,8}
    )
    (-(?<script>[A-Za-z]{4}))?
    (-(?<region>[A-Za-z]{2}|[0-9]{3}))?
    (-(?<variant>[A-Za-z0-9]{5,8}|[0-9][A-Za-z0-9]{3}))*
    (-(?<extension>[0-9A-WY-Za-wy-z](-[A-Za-z0-9]{2,8})+))*
    (-(?<privateUse>x(-[A-Za-z0-9]{1,8})+))?
  )
  |
  (?<privateUse>x(-[A-Za-z0-9]{1,8})+)
)$/;
```

