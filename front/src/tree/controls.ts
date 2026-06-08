import { doFetch } from "../api/fetch"

import type { Node } from "../types"
import { createBranch, rebuildTree, removeCanceled, setCanceled, updateTree } from "./buildTree"

let rootPath = ""

export async function initTree(path: string) {
    rootPath = path

    const command = ["du", "-B 1", "--exclude=/proc"]
    // const command = ["du", "-b", "--exclude=/proc"]

    const data = (await doFetch("/dir", {
        path,
        initDu: true,
        command
    })) as Node

    console.log(data)

    rebuildTree(data, path)

    if (data.sizeIsTemp) initUpdate()
}

document.getElementById("cancel").addEventListener("click", async () => {
    const re = await doFetch("/cancel")
    console.log(re)
    if (re?.status === "canceled") setCanceled()
})

let updateInterval = 0
let updateBranches = [] as string[]
function initUpdate() {
    updateBranches = []
    updateInterval = setInterval(async () => {
        const updates = await doFetch("/update", updateBranches)
        console.log(updates)
        if (!updates) {
            clearInterval(updateInterval)
            updateInterval = 0
            setCanceled()
            return
        }

        if (!updates[0].sizeIsTemp) {
            clearInterval(updateInterval)
            updateInterval = 0
            // console.timeEnd("t1")
        } else {
            removeUpdates(updates)
        }
        updateTree(updates)
    }, 1000)
}

function addUpdates(data: Node, path: string, dirname: string) {
    if (updateInterval > 0 && data.sizeIsTemp) {
        updateBranches.push(path ? `${path}/${dirname}` : dirname)
    }
}

function removeUpdates(results: Node[]) {
    updateBranches = updateBranches.filter((_, i) => results[i + 1]?.sizeIsTemp)
}

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

        const data = (await doFetch("/dir", { path: fullPath })) as Node
        console.log(data)
        // if (updateInterval > 0 && data.sizeIsTemp) {
        //     const p = dataset.path ? `${dataset.path}/${dataset.dirname}` : dataset.dirname
        //     updateBranches.push(p)
        // }
        addUpdates(data, dataset.path, dataset.dirname)

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
