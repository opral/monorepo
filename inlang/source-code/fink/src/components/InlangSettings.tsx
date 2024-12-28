import { createComponent } from "@lit/react";
import { InlangSettings } from "@inlang/settings-component2";
import React from "react";

const Settings = createComponent({
	tagName: "inlang-settings",
	elementClass: InlangSettings,
	react: React,
	events: {
		onSetSettings: "set-settings",
	},
});

export default Settings;
