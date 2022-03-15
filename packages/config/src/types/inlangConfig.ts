import { InlangConfig01 } from './v0.1';

export type InlangConfig = {
    latest: InlangConfig01;
    /**
     * Any version of inlang config.
     *
     * (Union of all inlang config versions.)
     */
    any: InlangConfig01;
    '0.1': InlangConfig01;
};
