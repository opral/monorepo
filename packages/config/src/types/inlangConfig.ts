import { InlangConfigV1 } from './v1';

export type InlangConfig = {
    latest: InlangConfigV1;
    /**
     * Any version of inlang config.
     *
     * (Union of all inlang config versions.)
     */
    any: InlangConfigV1;
    v1: InlangConfigV1;
};
