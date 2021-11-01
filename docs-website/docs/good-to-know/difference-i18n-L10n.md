---
title: Difference between i18n and L10n
---

# Difference between i18n (internationalization) and L10n (localization)?

---

### Summary:

i18n = making software able to display content for different locales/languages  
L10n = creating the content which is displayed in the i18n software (translating text etc.)

---

Internationalization and localization both describe the process of designing a product or service that "adapts" to different languages and cultures. Internationalization (i18n) describes the process of enabling software to display localized content. Whereas localization (L10n) describes the actual content creation.

Take this website and the text you are reading as an example. As of Friday, 22 October 2021 - 19:49 Copenhagen time, this website and text you are reading is only available in English and therefore neither internationalized (i18n), nor localized (L10n). In order to make this text available for different regions such as Germany, Denmark or China, we would first have to **internationalize (i18n)** this website:

- the website needs to detect which language you are speaking
- display the correct content for that language
- add a language button so that you can switch the language

After the website is internationalized (i18n), we would have to **localize (L10n)** this text (translate to German, Danish, Chinese etc.). Both i18n and L10n are required so that you can read this content in your preffered language.

Internationalization and localization are one key aspect of making an application go global; there is also globalization that has to do with promoting products or services around the world.

## Why the abbreviations i18n and L10n?

Because we developers are lazy. The 18 stands for the number of characters in between the first and last letter **i** _nternationalizatio_ **n**. Same holds for L10n **L** _ocalizatio_ **n**.
