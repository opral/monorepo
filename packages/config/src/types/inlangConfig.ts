import { InlangConfig01 } from './v0.1';
import { InlangConfig02 } from './v0.2';

export type InlangConfig = {
    latest: InlangConfig02;
    /**
     * Any version of inlang config.
     *
     * (Union of all inlang config versions.)
     */
    any: InlangConfig01 | InlangConfig02;
    '0.1': InlangConfig01;
    '0.2': InlangConfig02;
};
