---
title: BYOK
description: Use your own Google Cloud Translation API key with the inlang CLI for higher reliability and control over machine translations.
---

# Bring Your Own Google Translate API Key

By default, the `machine translate` command uses inlang's free translation service. For higher reliability and control, you can provide your own Google Cloud Translation API key.

## Setup

### 1. Create a Google Cloud project

Go to the [Google Cloud Console](https://console.cloud.google.com/) and create a new project, or select an existing one.

### 2. Enable the Cloud Translation API

Enable the **Cloud Translation API (Basic)** for your project. The CLI uses the v2 REST API.

Follow the [Cloud Translation setup guide](https://cloud.google.com/translate/docs/setup) for detailed instructions.

### 3. Generate an API key

1. In the Google Cloud Console, go to **APIs & Services > Credentials**
2. Click **Create Credentials** and select **API key**
3. Copy the generated key

### 4. Set the environment variable

Export the API key as `INLANG_GOOGLE_TRANSLATE_API_KEY`:

```bash
export INLANG_GOOGLE_TRANSLATE_API_KEY="your-google-api-key"
```

To make this permanent, add it to your shell profile (`~/.bashrc`, `~/.zshrc`, etc.):

```bash
echo 'export INLANG_GOOGLE_TRANSLATE_API_KEY="your-google-api-key"' >> ~/.bashrc
source ~/.bashrc
```

For CI/CD pipelines, add the key as a secret environment variable in your CI provider's settings.

## Usage

Once the environment variable is set, the CLI will automatically use your API key:

```bash
npx @inlang/cli machine translate --project ./project.inlang
```
