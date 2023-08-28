import { isIdent } from "./utils.js";
import { stringify } from "./stringify.js";

export type Path = (string | number | object)[];

const indices = new WeakMap<{}, Path>();

export function index(i: Path): object;
export function index(i: {}): Path;
export function index(i: Path | {}): Path | object {
    if (Array.isArray(i)) {
        const o = {};
        indices.set(o, i as Path);
        return o;
    } else {
        if (!indices.has(i)) throw new TypeError("Invalid index.");
        return indices.get(i)!;
    }
}

export function joinPath([...parts]: Path) {
    if (parts.length === 0) throw new TypeError("Invalid path.");
    let path = "";

    const part = parts.shift()!;
    if (typeof part === "object") {
        path += joinPath(index(part));
    } else if (isIdent(part)) {
        path += `${part}`;
    } else {
        throw new TypeError("Invalid path.");
    }

    for (const part of parts) {
        if (typeof part === "object") {
            path += `[${joinPath(index(part))}]`;
        } else {
            path += isIdent(part) ? `.${part}` : `[${stringify(part)}]`;
        }
    }

    if (!path) throw new TypeError("Invalid path.");
    return path;
}
