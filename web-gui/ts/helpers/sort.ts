import type { DataNode } from "../types"

export function sortBySizeThanName(list: DataNode[]) {
    return list.sort((a, b) => {
        if (b.size === a.size) {
            return a.name.localeCompare(b.name)
        }
        return b.size - a.size
    })
}
