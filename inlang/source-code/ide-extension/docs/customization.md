# Customization

## Custom preview language

You can customize the preview language in the settings. This is useful if you want to see how your translations look in a specific language. This setting is also available in the bottom status bar.

```json
"sherlock.previewLanguageTag": "de"
```

## Custom extension colors

You can customize the colors for inline annotations directly through the VS Code settings JSON file. This feature allows you to set different colors for `info` and `error` states, enhancing the readability and usability of inline annotations.

Add the following properties to your VS Code `settings.json` file to customize annotation colors:

```json
"sherlock.editorColors": {
	"info": {
		"foreground": "#color",
		"background": "rgba(number, number, number, 0.2)", // needs transparency
		"border": "#color"
	},
	"error": {
		"foreground": "#color",
		"background": "rgba(number, number, number, 0.2)", // needs transparency
		"border": "#color"
	}
}

// or (for all extensions)

"workbench.colorCustomizations": {
	"editorError.foreground": "#color",
	"editorError.background": "#color",
	"editorError.border": "#color",
	"editorInfo.foreground": "#color",
	"editorInfo.background": "#color",
	"editorInfo.border": "#color"
}
```

## Disable Inline Annotations

You can disable inline annotations by setting the following property to `false` in your VS Code `settings.json` file or by using the command `Sherlock: Toggle Inline Annotations`. The default value is `true`.

```json
"sherlock.inlineAnnotations.enabled": false
```