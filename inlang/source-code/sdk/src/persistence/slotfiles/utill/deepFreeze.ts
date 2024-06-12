
export function deepFreeze<T>(o: T): T {
    if (!o || 
        typeof o === 'string' ||
        typeof o === 'number'
    ) return o;

    Object.freeze(o);
    Object.getOwnPropertyNames(o).forEach(function (prop) {
        if (
            Object.prototype.hasOwnProperty.call(o, prop) &&
            (o as any)[prop] !== null &&
            (
                typeof (o as any)[prop] === 'object'
                ||
                typeof (o as any)[prop] === 'function'
            ) &&
            !Object.isFrozen((o as any)[prop])
        ) {
            deepFreeze((o as any)[prop]);
        }
    });
    return o;
}