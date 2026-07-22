import { doFetch } from "../api/fetch"

import type { DataNode } from "../types"
import { createBranch, rebuildTree, setCanceled, updateTree } from "./buildTree"

let rootPath = ""

export async function initTree(path: string) {
    rootPath = path

    const command = ["du", "-B", "1", "--exclude=/proc"]
    // const command = ["du", "-b", "--exclude=/proc"]

    const data = (await doFetch("/dir", {
        path,
        initDu: true,
        command
    })) as DataNode

    console.log(data)

    rebuildTree(data)

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

function addUpdates(data: DataNode, path: string, dirname: string) {
    console.log(updateInterval, data.sizeIsTemp)
    if (updateInterval > 0 && data.sizeIsTemp) {
        updateBranches.push(path ? `${path}/${dirname}` : dirname)
    }
}

function removeUpdates(results: DataNode[]) {
    updateBranches = updateBranches.filter((_, i) => !results[i + 1] || results[i + 1].sizeIsTemp)
    // remove branch on DOM manipulations side!
}

document.getElementById("tree").addEventListener("click", async e => {
    const target = e.target as HTMLDivElement
    // console.log(target)
    // if (!target.dataset.dir) return
    if (!target.classList.contains("td")) return

    const shoot = target.closest("div.shoot") as HTMLDivElement
    const dataset = shoot?.dataset

    if (!dataset.nested) {
        const prePath = dataset.path ? `${rootPath}${dataset.path}/` : rootPath
        const fullPath = prePath + dataset.name
        console.log(fullPath)

        target.classList.add("unfold")

        const data = (await doFetch("/dir", { path: fullPath })) as DataNode
        console.log(data)

        addUpdates(data, dataset.path, dataset.name)

        const branch = createBranch(data, dataset.path)
        if (branch) shoot.appendChild(branch)
        dataset.nested = "true"
        // dataset.unfolded = "true"
    } else {
        target.classList.toggle("unfold")
        shoot.querySelector<HTMLDivElement>(".dir-content")!.hidden =
            !target.classList.contains("unfold")
    }
})
