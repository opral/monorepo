import { InlangConfig10 } from './v1.0';

export type InlangConfig = {
    latest: InlangConfig10;
    /**
     * Any version of inlang config.
     *
     * (Union of all inlang config versions.)
     */
    any: InlangConfig10;
    '1.0': InlangConfig10;
};
