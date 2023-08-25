import { isArray, stringifyJS } from "./utils.js";

export type Path = (string | number | object)[];
export default Path;

const identRegex = /^[\p{XID_Start}$_]\p{XID_Continue}*$/u;

function isIdent(name: string | number) {
    if (typeof name === "number") return false;
    if (!identRegex.test(name)) return false;

    try {
        new Function(name, "");
    } catch {
        return false;
    }

    return true;
}

const indices = new WeakMap<{}, Path>();

export function index(i: Path): object;
export function index(i: {}): Path;
export function index(i: Path | {}): Path | object {
    if (isArray(i)) {
        const o = {};
        indices.set(o, i as Path);
        return o;
    } else {
        if (!indices.has(i)) throw new TypeError("Invalid index.");
        return indices.get(i)!;
    }
}

export function joinPath(...parts: Path) {
    if (parts.length === 0) throw new TypeError("Invalid path.");
    let path = "";

    const part = parts.shift()!;
    if (typeof part === "object") {
        path += joinPath(...index(part));
    } else if (isIdent(part)) {
        path += `${part}`;
    } else {
        throw new TypeError("Invalid path.");
    }

    for (const part of parts) {
        if (typeof part === "object") {
            path += `[${joinPath(...index(part))}]`;
        } else {
            path += isIdent(part) ? `.${part}` : `[${stringifyJS(part)}]`;
        }
    }

    if (!path) throw new TypeError("Invalid path.");
    return path;
}
