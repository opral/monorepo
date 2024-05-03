# Switching to Sherlock from i18n-ally: A Comprehensive Guide

Internationalization (i18n) is crucial for software projects aiming to reach a global audience. While i18n-ally has been a popular tool in this space, new solutions like Sherlock have emerged, offering advanced features and integrations that enhance the localization process within Visual Studio Code. Let’s explore why you might consider switching to Sherlock and how to effectively set it up, with a special focus on its syntax matcher functionality.

### Understanding i18n-ally situation

i18n-ally has been a popular choice among developers for its comprehensive support for i18n functions directly within VS Code. It offers similar features to Sherlock, such as inline editing of translations and visualization of translation keys. However, i18n-ally has seen a [lack of maintenance](https://github.com/lokalise/i18n-ally/pull/1048) compared to Sherlock, which has become a more dynamic and evolving tool in the i18n space.

### Why Consider Switching to Sherlock?

Sherlock stands out in the Inlang ecosystem, not only for its core features but for its broader integrations with tools like Fink and the Inlang Web Editor. This suite of tools provides a robust environment for managing i18n tasks more efficiently and with greater flexibility.

### Setting Up Sherlock

Transitioning to Sherlock involves a few straightforward steps:
1. **Install Sherlock**: Download and install Sherlock from the VS Code Marketplace.
2. **Create the Project Directory**: Set up a `project.inlang` directory in your project root to store localization settings and configurations.
3. **Configure `settings.json`**: In the `project.inlang` directory, create a `project.inlang/settings.json` file. Here’s an example configuration:
   ```json
   {
     "$schema": "https://inlang.com/schema/project-settings",
     "sourceLanguageTag": "en",
     "languageTags": ["en", "de"],
     "modules": [
       "https://cdn.jsdelivr.net/npm/@inlang/plugin-json@4/dist/index.js"
     ]
   }
   ```
   This setup specifies English as the source language and includes support for German, utilizing a JSON plugin for managing translation files.

### Understanding Syntax Matchers in Sherlock

One of the standout features of Sherlock is its use of syntax matchers. These are plugins that you can install from the Sherlock marketplace, designed to recognize and handle specific patterns in your code that relate to localization functions.

#### How Syntax Matchers Work:
- **Function Recognition**: Syntax matchers are designed to identify where translation functions (like `t()` for translating text) are used in your code. This is crucial for the tool to provide inline editing and visualization of translations.
- **Customization**: Depending on your project’s setup and the programming languages or frameworks you use, you might require different matchers. For instance, a React project might use a different set of translation functions compared to a Vue.js project.
- **Installation**: You can select and install syntax matchers directly from the Inlang marketplace, ensuring that they are perfectly tailored to your project's needs.

#### Example of Setting Up a Syntax Matcher:
If your project uses a common i18n library like `i18next`, you would:
1. **Find the Matcher**: Go to the Sherlock or Inlang marketplace and find the `i18next` syntax matcher.
2. **Install the Matcher**: Install the matcher via your `project.inlang` configuration by adding it to the `modules` section.
3. **Configure as Needed**: Some matchers might require additional configuration, such as specifying which translation function names to look for (e.g., `t`, `_`, or `translate`).

### Why Make the Switch?

While i18n-ally has been effective, Sherlock’s continuous updates, active community, and integration with modern development tools offer a compelling reason to switch. Its structured approach to managing translations—via `project.inlang` directories and JSON configuration—provides clarity and control over your localization workflow.

By incorporating Sherlock into your VS Code environment, you're adopting a tool that not only meets current technological standards but also simplifies the process of making your application globally accessible. This ensures that your i18n efforts are as efficient and effective as possible, positioning your projects to succeed on the international stage.