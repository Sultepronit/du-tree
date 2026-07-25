import { doFetch } from "../api/fetch"

import type { DataNode, reqOptions } from "../types"
import toggleCSS from "../utils/toggleCss"
import { appendBranch, createBranch, rebuildTree, setCanceled, updateTree } from "./builder"

const useBlockSize = document.getElementById("use-block-size") as HTMLInputElement
const scanButton = document.getElementById("scan") as HTMLButtonElement
const autoExit = document.getElementById("auto-exit") as HTMLInputElement

let rootPath = ""

window.addEventListener("pagehide", () => {
    if (autoExit.checked) {
        navigator.sendBeacon("/exit")
    }
})
// navigator.sendBeacon("/exit")

export function setOptions(options: reqOptions) {
    useBlockSize.checked = options.blockSize ?? false
}

function disableEdit() {
    document.dispatchEvent(new CustomEvent("mode", { detail: "results" }))
    useBlockSize.disabled = true
}

function enableEdit() {
    document.dispatchEvent(new CustomEvent("mode", { detail: "preparations" }))
    useBlockSize.disabled = false
}

type statusType = "blank" | "setting" | "ready" | "scanning" | "done"
const status = {
    _val: "blank",
    get(): statusType {
        return this._val
    },
    set(newVal: statusType) {
        // console.log(this._val, newVal)
        this._val = newVal
        if (newVal === "setting") {
            scanButton.disabled = true
            scanButton.title = ""
        } else if (newVal === "ready") {
            enableEdit()
            scanButton.disabled = false
            scanButton.title = "Scan\t[Enter]"
        } else if (newVal === "scanning") {
            disableEdit()
            scanButton.disabled = true
            scanButton.title = ""
        } else if (newVal === "done") {
            scanButton.disabled = false
            scanButton.title = "Discard results & set new scan\t[Ctrl+Enter]"
        }
    }
}
export { status }

// scanButton.addEventListener("click", initNewScan)
scanButton.addEventListener("click", () => {
    const st = status.get()
    // if (st === "ready" || st === "done") initTree(rootPath)
    if (st === "ready") {
        initTree(rootPath)
    } else if (st === "done") {
        status.set("ready")
    }
})

export async function initTree(path: string) {
    rootPath = path
    status.set("scanning")

    const options = {} as reqOptions
    if (useBlockSize.checked) {
        options.blockSize = true
    }

    const data = (await doFetch("/scan", {
        path,
        pages: 1,
        options
    })) as DataNode
    console.log(data)

    rebuildTree(data, path)
    if (data.temp) initUpdates()
    else status.set("done")
}

export async function renderTree(path: string) {
    rootPath = path
    status.set("scanning")

    const data = (await doFetch("/dir", { path: "", pages: 1 })) as DataNode
    console.log(data)

    rebuildTree(data, path)
    if (data.temp) initUpdates()
    else status.set("done")
}

let interval = 200
document.getElementById("cancel").addEventListener("click", async () => {
    interval = 100
    const re = await doFetch("/cancel")
    console.log(re)
    if (re?.status === "canceled") setCanceled()
})

async function update() {
    await new Promise(resolve => setTimeout(resolve, interval))
    if (interval < 900) interval += 100
    const updates = await doFetch("/update", updateBranches)
    // console.log(updates)
    if (!updates) {
        status.set("done")
        setCanceled()
        return
    }

    updateTree(updates)
    sanitizeUpdates(updates)

    if (!updates[0].temp) {
        // syncing = false
        status.set("done")
        return
    }

    update()
}

let updateBranches = [] as { path: string; pages: number }[]
function initUpdates() {
    updateBranches = [{ path: "", pages: 1 }]
    interval = 200
    update()
}

function populateUpdates(data: DataNode, prePath: string, dirname: string) {
    if (status.get() === "scanning" && data.temp) {
        const path = prePath ? `${prePath}/${dirname}` : dirname
        updateBranches.push({ path, pages: 1 })
    }
}

function sanitizeUpdates(results: DataNode[]) {
    updateBranches = updateBranches.filter((_, i) => !results[i] || results[i].temp)
    // remove also branch on DOM manipulations side?
}

async function addMore(button: HTMLButtonElement) {
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

document.getElementById("use-animation").addEventListener("click", e => {
    toggleCSS("./style/animations.css", "animations-css", (e.target as HTMLInputElement).checked)
})
