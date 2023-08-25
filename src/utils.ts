import type { Schema } from "./types.js";

export function nullPrototype<T>(value: T): T {
    return Object.assign(Object.create(null), value);
}

export function isObject(o: unknown): o is Record<keyof any, unknown> {
    return o != null && typeof o === "object";
}

export function isArray(o: unknown): o is unknown[] {
    return Array.isArray(o);
}

export function isUnsignedSize(n: unknown): n is number {
    return n === Number(n) >>> 0;
}

export function isSchema(value: unknown): value is Schema {
    return isObject(value) && typeof value.type === "string";
}

export function stringifyJS(value: any) {
    if (value instanceof RegExp) {
        return value.toString();
    } else if (value instanceof BigInt) {
        return value.toString() + "n";
    } else if (typeof value === "object" && value != null && !isArray(value)) {
        return JSON.stringify({ ...value });
    } else {
        return JSON.stringify(value);
    }
}
