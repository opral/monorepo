export declare const setLocale: (locale: string) => void;

export declare const getLocale: () => string;

export declare const locales: string[];

export declare const init: () => Promise<void> | undefined;

export declare const middleware: (...args: any[]) => any;
