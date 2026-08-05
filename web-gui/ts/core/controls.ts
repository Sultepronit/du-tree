import { doFetch } from "../api/fetch"

import type { DataNode, ReqOptions } from "../types"
import { disablePathInput, enablePathInput, handlePathInput } from "./pathInput"
import {
    appendBranch,
    createBranch,
    buildTree,
    updateTree,
    simulateScan,
    resetTree
} from "./treeBuilder"

const useBlockSize = document.getElementById("use-block-size") as HTMLInputElement
const scanButton = document.getElementById("scan") as HTMLButtonElement
const autoExit = document.getElementById("auto-exit") as HTMLInputElement
const treeRoot = document.getElementById("tree-root") as HTMLElement

let rootPath = ""

// page close
window.addEventListener("pagehide", () => {
    if (autoExit.checked) {
        navigator.sendBeacon("/exit")
    }
})

export function setOptions(options: ReqOptions) {
    useBlockSize.checked = options.blockSize ?? false
}

function disableEdit() {
    // document.dispatchEvent(new CustomEvent("mode", { detail: "results" }))
    useBlockSize.disabled = true
    disablePathInput()
}

function enableEdit() {
    document.dispatchEvent(new CustomEvent("mode", { detail: "preparations" }))
    useBlockSize.disabled = false
    enablePathInput()
    resetTree()
}

// is there need for "blank"?
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
            removeCanceled()
            enableEdit()
            scanButton.disabled = false
            scanButton.title = "Scan\t[Enter]"
        } else if (newVal === "scanning") {
            disableEdit()
            simulateScan()
            scanButton.disabled = true
            scanButton.title = ""
        } else if (newVal === "done") {
            scanButton.disabled = false
            scanButton.title = "Discard results & set new scan\t[Ctrl+Enter]"
        }
    }
}
export { status }
document.addEventListener("path-status", (e: CustomEvent) => {
    status.set(e.detail === "valid" ? "ready" : "setting")
})

scanButton.addEventListener("click", () => {
    const st = status.get()
    if (st === "ready") {
        initTree(rootPath)
    } else if (st === "done") {
        status.set("ready")
    }
})

export async function initTree(path: string, initScan = true) {
    rootPath = path
    status.set("scanning")

    const options = {} as ReqOptions
    if (useBlockSize.checked) {
        options.blockSize = true
    }

    const req = initScan ? "/scan" : "/dir"
    // yes, if "/dir" case options mean nothing
    // const data = (await doFetch("/scan", {
    const data = (await doFetch(req, {
        path,
        pages: 1,
        options
    })) as DataNode
    console.log(data)
    if (!data) {
        // one of cases -- dir without the access
        status.set("done")
        return
    }

    buildTree(data, path)
    if (data.temp) initUpdates()
    else status.set("done")
}
document.addEventListener("scan-request", (e: CustomEvent) => {
    initTree(e.detail)
})

// export async function renderTree(path: string) {
//     rootPath = path
//     status.set("scanning")

//     const data = (await doFetch("/dir", { path: "", pages: 1 })) as DataNode
//     console.log(data)
//     if (!data) {
//         // one of cases -- dir without the access
//         status.set("done")
//         return
//     }

//     rebuildTree(data, path)
//     if (data.temp) initUpdates()
//     else status.set("done")
// }

let canceled = false
export function setCanceled() {
    canceled = true
    document.body.classList.add("canceled")
    treeRoot.classList.remove("temp")
}

export function removeCanceled() {
    if (!canceled) return
    canceled = false
    document.body.classList.remove("canceled")
}

let interval = 200
document.getElementById("cancel").addEventListener("click", async () => {
    interval = 100
    setCanceled()
    const re = await doFetch("/cancel")
    console.log(re)
    // if (re?.status === "canceled") setCanceled()
    if (re?.status !== "canceled") removeCanceled()
})

async function update() {
    await new Promise(resolve => setTimeout(resolve, interval))
    if (interval < 900) interval += 100
    const updates = await doFetch("/update", updateList)
    // console.log(updates)
    if (!updates) {
        status.set("done")
        setCanceled()
        return
    }

    updateTree(updates)
    sanitizeUpdateList(updates)

    if (!updates[0].temp) {
        // syncing = false
        status.set("done")
        return
    }

    update()
}

let updateList = [] as { path: string; pages: number }[]
function initUpdates() {
    updateList = [{ path: "", pages: 1 }]
    interval = 200
    update()
}

function populateUpdateList(data: DataNode, prePath: string, dirname: string) {
    if (status.get() === "scanning" && data.temp) {
        const path = prePath ? `${prePath}/${dirname}` : dirname
        updateList.push({ path, pages: 1 })
    }
}

function sanitizeUpdateList(results: DataNode[]) {
    updateList = updateList.filter((_, i) => !results[i] || results[i].temp)
    // remove also branches on DOM manipulations side?
}

async function addMore(button: HTMLButtonElement) {
    const path = rootPath + button.dataset.path
    const pages = Number(button.dataset.pages) + 1
    const data = (await doFetch("/dir", { path, pages })) as DataNode
    console.log(data)

    appendBranch(data, button, pages)

    const branch = updateList.find(b => b.path === button.dataset.path)
    if (branch) branch.pages = pages
}

async function unfoldDir(target: HTMLElement) {
    // if (target.classList.contains("itself")) return
    // if (target.classList.contains("link")) return
    // if (target.classList.contains("unavailable")) return
    const l = target.classList
    if (l.contains("itself") || l.contains("link") || l.contains("unavailable")) return

    const shoot = target.closest("div.shoot") as HTMLDivElement
    const dataset = shoot?.dataset

    if (!dataset.nested) {
        dataset.nested = "true"
        target.classList.add("pending", "unfold")

        const path = dataset.path ? `${dataset.path}/${dataset.name}` : dataset.name

        const data = (await doFetch("/dir", { path, pages: 1 })) as DataNode
        console.log("dir:", data)

        if (dataset.name !== data.name) {
            // orphans of reseted entry!
            return
        }

        populateUpdateList(data, dataset.path, dataset.name)

        const branch = createBranch(data, dataset.path)
        // if (branch) shoot.appendChild(branch)
        if (branch) {
            if (!target.classList.contains("unfold")) {
                branch.querySelector(".dir-content").classList.add("hidden")
            }
            shoot.appendChild(branch)
        }
        target.classList.remove("pending")
    } else {
        target.classList.toggle("unfold")
        if (target.classList.contains("pending")) return

        // shoot.querySelector<HTMLDivElement>(".dir-content").hidden =
        //     !target.classList.contains("unfold")
        shoot.querySelector<HTMLDivElement>(".dir-content").classList.toggle("hidden")
    }
}

document.getElementById("tree").addEventListener("click", async e => {
    const target = e.target as HTMLDivElement | HTMLButtonElement
    // console.log(target)
    if (target instanceof HTMLButtonElement && target.name === "add-more") addMore(target)
    else if (target.classList.contains("td")) unfoldDir(target)
})

document.getElementById("use-animation").addEventListener("click", e => {
    // toggleCSS("./style/animations.css", "animations-css", (e.target as HTMLInputElement).checked)
    if ((e.target as HTMLInputElement).checked) {
        document.body.classList.add("animation")
    } else {
        document.body.classList.remove("animation")
    }
})

document.addEventListener("keydown", async e => {
    // console.log(e.key)
    // console.log(e.code)
    if (e.ctrlKey && e.code === "KeyQ") {
        autoExit.checked = !autoExit.checked
    }

    const st = status.get()
    if (st === "scanning") return
    if (st === "done") {
        if (e.key === "Enter" && e.ctrlKey) {
            e.preventDefault()
            status.set("ready")
        }

        return
    }
    handlePathInput(e)
})
