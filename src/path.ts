import { stringify } from "./stringify.js";
import { isIdent, isObject } from "./utils.js";

export type Path = (string | number | object)[];

const indices = new WeakMap<object, Path>();

export function index(index: Path): object;
export function index(index: object): Path;
export function index(index: Path | object): object {
    if (Array.isArray(index)) {
        const key = {};
        indices.set(key, index as Path);
        return key;
    } else {
        if (!indices.has(index)) {
            throw new TypeError("Invalid index.");
        }

        return indices.get(index)!;
    }
}

export function joinPath([...parts]: Path) {
    if (parts.length === 0) throw new TypeError("Invalid path.");
    let path = "";

    const part = parts.shift()!;
    if (isObject(part)) {
        path += joinPath(index(part));
    } else if (isIdent(part)) {
        path += part.toString();
    } else {
        throw new TypeError("Invalid path.");
    }

    for (const part of parts) {
        if (isObject(part)) {
            path += `[${joinPath(index(part))}]`;
        } else {
            path += isIdent(part) ? `.${part}` : `[${stringify(part)}]`;
        }
    }

    if (!path) throw new TypeError("Invalid path.");
    return path;
}
