import { doFetch } from "../api/fetch"

import type { DataNode } from "../types"
import { appendBranch, createBranch, rebuildTree, setCanceled, updateTree } from "./builder"

const useBlockSize = document.getElementById("use-block-size") as HTMLInputElement

let rootPath = ""

export async function initTree(path: string) {
    rootPath = path

    // const command = ["du", "-B", "1", "--exclude=/proc"]
    // const options = ["block-size"]
    // const command = ["du", "-b", "--exclude=/proc"]
    // const options = []
    // const command = ["uutils-du", "-B", "1", "--exclude=/proc"]
    // const command = ["du", "--exclude=/proc"]
    const command = ["uutils-du", "--exclude=/proc"]
    const options = []
    if (useBlockSize.checked) {
        command.push("-B", "1")
        options.push("block-size")
    } else {
        command.push("-b")
    }

    // const data = (await doFetch("/dir", {
    const data = (await doFetch("/scan", {
        path,
        pages: 1,
        // command,
        options
    })) as DataNode

    console.log(data)

    rebuildTree(data, path)

    if (data.temp) initUpdates()
}

document.getElementById("cancel").addEventListener("click", async () => {
    const re = await doFetch("/cancel")
    console.log(re)
    if (re?.status === "canceled") setCanceled()
})

let syncing = false
async function update() {
    await new Promise(resolve => setTimeout(resolve, 900))
    const updates = await doFetch("/update", updateBranches)
    console.log(updates)
    if (!updates) {
        setCanceled()
        return
    }

    updateTree(updates)
    sanitizeUpdates(updates)

    if (!updates[0].temp) {
        syncing = false
        return
    }

    update()
}

// let updateInterval = 0
let updateBranches = [] as { path: string; pages: number }[]
function initUpdates() {
    updateBranches = [{ path: "", pages: 1 }]
    syncing = true
    update()
}

function populateUpdates(data: DataNode, prePath: string, dirname: string) {
    // console.log(updateInterval, data.temp)
    if (syncing && data.temp) {
        const path = prePath ? `${prePath}/${dirname}` : dirname
        // updateBranches.push(prePath ? `${prePath}/${dirname}` : dirname)
        updateBranches.push({ path, pages: 1 })
    }
}

function sanitizeUpdates(results: DataNode[]) {
    // updateBranches = updateBranches.filter((_, i) => !results[i + 1] || results[i + 1].temp)
    updateBranches = updateBranches.filter((_, i) => !results[i] || results[i].temp)
    // remove branch on DOM manipulations side!
}

async function addMore(button: HTMLButtonElement) {
    console.log(button)
    // const path = button.dataset.path ? `${rootPath}${button.dataset.path}/` : rootPath
    const path = rootPath + button.dataset.path
    const pages = Number(button.dataset.pages) + 1
    const data = (await doFetch("/dir", { path, pages })) as DataNode
    console.log(data)

    appendBranch(data, button, pages)

    const branch = updateBranches.find(b => b.path === button.dataset.path)
    if (branch) branch.pages = pages
    // console.log(updateBranches)
    // console.log(branch)
    // console.log(path)
}

document.getElementById("tree").addEventListener("click", async e => {
    const target = e.target as HTMLDivElement | HTMLButtonElement
    // console.log(target)
    // if (!target.dataset.dir) return
    if (target instanceof HTMLButtonElement && target.name === "add-more") addMore(target)

    if (!target.classList.contains("td")) return
    if (target.classList.contains("itself")) return

    const shoot = target.closest("div.shoot") as HTMLDivElement
    const dataset = shoot?.dataset

    if (!dataset.nested) {
        // const prePath = dataset.path ? `${rootPath}${dataset.path}/` : rootPath
        // const fullPath = prePath + dataset.name
        // console.log(fullPath)
        // const path =`${dataset.path}/${dataset.name}`
        const path = dataset.path ? `${dataset.path}/${dataset.name}` : dataset.name

        target.classList.add("unfold")

        // const data = (await doFetch("/dir", { path: fullPath, pages: 1 })) as DataNode
        const data = (await doFetch("/dir", { path, pages: 1 })) as DataNode
        console.log(data)

        populateUpdates(data, dataset.path, dataset.name)

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
