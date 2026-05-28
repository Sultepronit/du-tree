import { doFetch } from "../api/fetch"

import type { Node } from "../types"
import { createBranch, rebuildTree, removeCanceled, setCanceled, updateTree } from "./buildTree"

let rootPath = ""

export async function initTree(path: string) {
    rootPath = path

    // const command = ["du", "-b", "--exclude=/proc", path]
    // const command = ["du", "-B 1", "--exclude=/proc", path]
    const command = ["du", "-b", "--exclude=/proc"]

    const data = (await doFetch("/dir", {
        path,
        initDu: true,
        command
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

document.getElementById("cancel").addEventListener("click", async () => {
    const re = await doFetch("/cancel")
    console.log(re)
    if (re?.status === "canceled") setCanceled()
})

document.getElementById("tree").addEventListener("click", async e => {
    const target = e.target as HTMLDivElement
    // console.log(target)
    if (!target.dataset.dir) return

    const shoot = target.closest("div.shoot") as HTMLDivElement
    const dataset = shoot?.dataset

    if (!dataset.nested) {
        const prePath = dataset.path ? `${rootPath}${dataset.path}/` : rootPath
        const fullPath = prePath + dataset.dirname
        console.log(fullPath)

        target.classList.add("unfold")

        const data = await doFetch("/dir", { path: fullPath })
        console.log(data)

        const branch = createBranch(data, dataset.path)
        if (branch) shoot.appendChild(branch)
        dataset.nested = "true"
        dataset.unfolded = "true"
    } else {
        target.classList.toggle("unfold")
        shoot.querySelector<HTMLDivElement>(".dir-content")!.hidden =
            !target.classList.contains("unfold")
    }
})
