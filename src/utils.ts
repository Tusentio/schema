import type { Schema } from "./types.js";

const identRegex = /^[\p{XID_Start}$_]\p{XID_Continue}*$/u;

export function isIdent(name: string | number) {
    if (typeof name === "number") return false;
    if (!identRegex.test(name)) return false;

    try {
        new Function(name, "");
    } catch {
        return false;
    }

    return true;
}

export function isObject(o: unknown): o is Record<keyof any, unknown> {
    return o != null && typeof o === "object";
}

export function isUnsignedSize(n: unknown): n is number {
    return n === Number(n) >>> 0;
}

export function isSchema(value: unknown): value is Schema {
    return isObject(value) && typeof value.type === "string";
}

export function nullPrototype<T>(value: T): T {
    return Object.assign(Object.create(null), value);
}

export function cloneCall<const TArgs, const TReturn>(fn: (...args: TArgs[]) => TReturn, ...args: TArgs[]): TReturn {
    return structuredClone(fn(...structuredClone(args)));
}
