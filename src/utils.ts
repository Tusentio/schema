import type { SchemaLike } from "./types.js";

export type MaybePromise<T> = T | PromiseLike<T>;

export type PartialRecord<K extends PropertyKey = PropertyKey, T = unknown> = Partial<Record<K, T>>;

export type ExtractKeys<T extends object, U> = {
    [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

export type ExcludeKeys<T extends object, U> = {
    [K in keyof T]: T[K] extends U ? never : K;
}[keyof T];

const identRegex = /^[\p{XID_Start}$_]\p{XID_Continue}*$/u;

export function isIdent(name: string | number) {
    if (typeof name === "number") return false;
    if (!identRegex.test(name)) return false;

    try {
        // eslint-disable-next-line @typescript-eslint/no-implied-eval
        new Function(name, "");
    } catch {
        return false;
    }

    return true;
}

export function isObject(value: unknown): value is object {
    return value != null && typeof value === "object";
}

export function isRecord(value: unknown): value is Record<PropertyKey, unknown> {
    return value != null && typeof value === "object";
}

export function isUnsignedSize(value: unknown): value is number {
    return value === Number(value) >>> 0;
}

export function isSchema(value: unknown): value is SchemaLike {
    return isObject(value) && "type" in value && typeof value.type === "string";
}

export function nullPrototype<T>(value: T): T {
    return Object.assign(Object.create(null), value) as T;
}

export function cloningCall<const TArgs, const TReturn>(fn: (...args: TArgs[]) => TReturn, ...args: TArgs[]): TReturn {
    return structuredClone(fn(...structuredClone(args)));
}
