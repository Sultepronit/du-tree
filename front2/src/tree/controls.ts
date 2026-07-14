import { doFetch } from "../api/fetch"

import type { DataNode } from "../types"
import { appendBranch, createBranch, rebuildTree, setCanceled, updateTree } from "./builder"

const useBlockSize = document.getElementById("use-block-size") as HTMLInputElement

let rootPath = ""

export async function initTree(path: string) {
    rootPath = path

    const options = []
    if (useBlockSize.checked) {
        options.push("block-size")
    }

    const data = (await doFetch("/scan", {
        path,
        pages: 1,
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
}

async function unfoldDir(target: HTMLElement) {
    if (target.classList.contains("itself")) return
    if (target.classList.contains("link")) return
    if (target.classList.contains("unavailable")) return

    const shoot = target.closest("div.shoot") as HTMLDivElement
    const dataset = shoot?.dataset

    if (!dataset.nested) {
        dataset.nested = "true"
        target.classList.add("unfold")

        const path = dataset.path ? `${dataset.path}/${dataset.name}` : dataset.name

        const data = (await doFetch("/dir", { path, pages: 1 })) as DataNode
        console.log(data)

        populateUpdates(data, dataset.path, dataset.name)

        const branch = createBranch(data, dataset.path)
        if (branch) shoot.appendChild(branch)
    } else {
        target.classList.toggle("unfold")
        shoot.querySelector<HTMLDivElement>(".dir-content")!.hidden =
            !target.classList.contains("unfold")
    }
}

document.getElementById("tree").addEventListener("click", async e => {
    const target = e.target as HTMLDivElement | HTMLButtonElement
    // console.log(target)
    if (target instanceof HTMLButtonElement && target.name === "add-more") addMore(target)
    else if (target.classList.contains("td")) unfoldDir(target)
})
