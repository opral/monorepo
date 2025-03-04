Inlang is an **open file format** for internationalization (**i18n**) that provides an **SDK** for building and integrating localization tools on top of that open file format. By defining a standardized way to store and manage translations, Inlang enables seamless interoperability between different i18n solutions, translation management apps, developer tools, and any other tools related to localization.

## 🚀 **Why Inlang?**

### **An Open Standard for i18n**

Existing localization solutions operate in silos, each with its own formats and workflows. Inlang introduces a **unified file format** that acts as a common language for all i18n tools. Whether you’re using a translation management system, an i18n library, or a VS Code extension, Inlang ensures compatibility across platforms and tools.

### **SDK for Building i18n Solutions**

The [Inlang SDK](https://github.com/opral/monorepo/tree/main/inlang/packages/sdk) simplifies working with Inlang projects, allowing developers to build their own **i18n apps, CLI tools, plugins, or integrations**. Instead of creating another proprietary solution, you can leverage the SDK to interact with Inlang files, manage translations, and extend functionality effortlessly—benefiting from the ecosystem around the Inlang format.

### **An Ecosystem of Interoperable Tools**

Adopting the Inlang format gives you access to an ecosystem of **[apps](https://inlang.com/c/apps), [plugins](https://inlang.com/c/plugins), and extensions** that work together seamlessly. Popular tools already built on Inlang include:

- **[ParaglideJS](https://inlang.com/m/gerre34r/library-inlang-paraglideJs)** – A lightweight i18n library optimized for developer experience.
- **[Fink](https://fink2.onrender.com/)** – A powerful translation management tool for developers and translators.
- **[Sherlock i18n](https://marketplace.visualstudio.com/items?itemName=inlang.vs-code-extension)** – A VS Code extension that provides real-time translation linting and suggestions.

---

## 🔍 **How It Works**

### **Inlang Files & Directories**

An Inlang project consists of an **Inlang file** (`.inlang`). The project contains:

- **`settings.json`** – Defines project settings, language tags, and imported modules.
- **Translation files** – Store localized messages in a structured format.
- **`project_id`** – Used for optional anonymous telemetry.

This structure enables easy integration and use by applications, supported by a dedicated Inlang SDK. [See SDK docs](https://github.com/opral/monorepo/tree/main/inlang/packages/sdk).

---

## 📜 **License**

Inlang is open-source and licensed under the MIT License.
