# Common mistakes in i18n

## Introduction

This guide is a collection of common mistakes that are made when implementing i18n in a project. It is not a complete list, but it should help you to avoid the most common pitfalls.

When it comes to internationalizing your app, avoiding common localization mistakes is crucial for ensuring a seamless user experience across different languages and cultures. In this guide, we'll explore five common mistakes and provide practical solutions to help you navigate the complexities of app localization, ultimately benefiting your global audience.

### Mistake 1: Overlooking Text Expansion and Contraction

Design your app interface with text expansion and contraction in mind. Use flexible layouts and consider the use of placeholders for dynamic content to accommodate varying text lengths in different languages without compromising the design and functionality of your app.

inlang provides a lot of different [lint rules](https://inlang.com/c/lint-rules) to help you with this. You can find them in the [Rules Category](/c/lint-rules).

### Mistake 2: Ignoring Date, Time, and Number Formats

Implement locale-specific date, time, and number formats to align with the conventions of your target regions. Utilize libraries or frameworks that support locale-aware formatting to ensure consistency and accuracy across different languages and regions.

The editor inlang offers, Fink, supports variables out of the box. You can use them to format dates, times, and numbers. You can find more information about this on the [Fink Product Page](https://inlang.com/m/tdozzpar/app-inlang-finkLocalizationEditor).

### Mistake 3: Failing to Test Across Multiple Devices and Platforms

Test your localized app rigorously on a variety of devices, operating systems, and screen sizes to identify and address any layout or functionality issues that may arise due to language-specific content. Embrace responsive design principles to deliver a consistent user experience across diverse platforms.

In the GitHub Repo of inlang there is the initiative to implement an i18n checker, so you don't have to make a checklist yourself [i18n Checker GitHub Issue](https://github.com/opral/monorepo/issues/1730#issuecomment-1825809689).

### Mistake 4: Disregarding User Feedback and Iterative Improvement

Collect user feedback and iterate on your app localization to improve the user experience. Leverage analytics tools to gain insights into user behavior and identify areas for improvement. Consider implementing a feedback mechanism to allow users to report issues and provide suggestions for improvement.



### Still asking yourself what inlang really is?

inlang is an ecosystem for finding globalization products and services. Imagine inlang.com like a marketplace where you can find everything you need to make your app or website global, instead of being limited to a single service or product.

[Homepage](/) | [Documentation](/documentation) | [GitHub](https://github.com/opral/monorepo)

<br />
