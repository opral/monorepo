import { isAvailableLanguageTag, setLanguageTag, sourceLanguageTag } from '$paraglide-adapter-next-internal/runtime.js';
import React from 'react';

function ParaglideJS(props) {
    if (isAvailableLanguageTag(props.language)) {
        setLanguageTag(props.language);
    }
    else {
        // dev only log
        if (process.env.NODE_ENV === "development") {
            console.error(`[paraglide]: "${props.language}" is not one of the available language tags. Falling back to "${sourceLanguageTag}"`);
        }
        setLanguageTag(sourceLanguageTag);
    }
    return React.createElement(React.Fragment, null, props.children);
}

export { ParaglideJS as default };
