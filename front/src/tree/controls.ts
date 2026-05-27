import { doFetch } from "../api/fetch"

import type { Branch, Node } from "../types"
import { rebuildTree, updateTree } from "./buildTree"

export async function initTree(path: string) {
    const data = (await doFetch("/dir", {
        path,
        initDu: true,
        // command: ["du", "-b", "--exclude=/proc", path]
        // command: ["du", "-B 1", "--exclude=/proc", path]
        command: ["du", "-b", "--exclude=/proc"]
    })) as Node

    console.log(data)

    rebuildTree(data, path)

    if (data.sizeIsTemp) initUpdate()
}

function initUpdate() {
    const t = setInterval(async () => {
        const update = await doFetch("/update")
        console.log(update)
        if (!update[0].sizeIsTemp) {
            clearInterval(t)
            // console.timeEnd("t1")
        }
        updateTree(update)
    }, 10000)
}

document.getElementById("cancel").addEventListener("click", async (e) => {
    const re = await doFetch("/cancel")
    console.log(re)
})