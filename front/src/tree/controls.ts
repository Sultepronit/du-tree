import { doFetch } from "../api/fetch"

import type { Node } from "../types"
import { rebuildTree, removeCanceled, setCanceled, updateTree } from "./buildTree"

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
        if (update.length < 1) {
            clearInterval(t)
            setCanceled()
            return
        }

        if (!update[0].sizeIsTemp) {
            clearInterval(t)
            // console.timeEnd("t1")
        }
        updateTree(update)
    }, 1000)
}

// function setCanceled(panel: HTMLElement) {
//     document.documentElement.style.setProperty("--temp-dir-icon", `url("icons/folder-x.svg")`)
//     panel.classList.add("canceled");
// }

// function removeCanceled() {
//     document.documentElement.style.removeProperty("--temp-dir-icon")
//     // panel.classList.remove("canceled");
// }

document.getElementById("cancel").addEventListener("click", async (e) => {
    const re = await doFetch("/cancel")
    console.log(re)
    if (re?.status === "canceled") setCanceled()
    // setCanceled((e.target as HTMLDivElement).parentElement)
})