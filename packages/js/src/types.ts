export type Inlang = {
    t: (text: string) => string
}

declare global {
    interface Window {
        inlang: Inlang
    }
}
