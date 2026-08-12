import { doFetch } from "../api/fetch"
import excluded from "../functions/exclude"

import type { DataNode, ReqOptions } from "../types"
import { getFilters } from "./filters"
import { disablePathInput, enablePathInput, handlePathInput } from "./pathInput"
import {
    appendBranch,
    createBranch,
    buildTree,
    updateTree,
    simulateScan,
    resetTree
} from "./treeBuilder"

const optionsForm = document.getElementById("options") as HTMLFormElement
// const filtersForm = document.getElementById("filters") as HTMLFormElement
// const useBlockSize = document.getElementById("use-block-size") as HTMLInputElement
const scanButton = document.getElementById("scan") as HTMLButtonElement
const autoExit = document.getElementById("auto-exit") as HTMLInputElement
const treeRoot = document.getElementById("tree-root") as HTMLElement

export { autoExit }

let rootPath = ""

// page close
window.addEventListener("pagehide", () => {
    if (autoExit.checked) {
        navigator.sendBeacon("/exit")
    }
})

export function setOptions(inputOptions: ReqOptions) {
    optionsForm["size-type"].value = inputOptions.blockSize ? "block" : "apparent"
    // optionsForm["exclude-hidden"].checked = inputOptions.excludeHidden
    optionsForm["one-fs"].checked = inputOptions.oneFS
    if (
        inputOptions.excludeHidden ||
        (inputOptions.exPatt?.length > 0 && inputOptions.exPatt[0] !== "")
    ) {
        optionsForm.exclude.checked = true
        excluded.show(true)
        excluded.set({
            hidden: inputOptions.excludeHidden,
            patterns: inputOptions.exPatt
        })
    }
}

optionsForm.exclude.addEventListener("change", e => {
    excluded.show(e.target.checked)
})

function disableEdit() {
    optionsForm.scanset.disabled = true
    disablePathInput()
    excluded.disable()
}

function enableEdit() {
    optionsForm.scanset.disabled = false
    enablePathInput()
    excluded.enable()
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

function getOptions() {
    const options = {
        blockSize: optionsForm["size-type"].value === "block",
        // excludeHidden: optionsForm["exclude-hidden"].checked,
        oneFS: optionsForm["one-fs"].checked
    } as ReqOptions

    if (optionsForm.exclude.checked === true) {
        const exc = excluded.get()
        options.excludeHidden = exc.hidden
        options.exPatt = exc.patterns as string[]
    }

    return options
}

// function getFilters() {
//     return {
//         showHidden: filtersForm["show-hidden"].checked
//     }
// }

export async function initTree(path: string, initScan = true) {
    rootPath = path
    status.set("scanning")

    // const options = {} as ReqOptions
    // if (useBlockSize.checked) {
    // if (optionsForm["size-type"].value === "block") {
    //     options.blockSize = true
    // }

    // const options = {
    //     blockSize: optionsForm["size-type"].value === "block",
    //     // excludeHidden: optionsForm["exclude-hidden"].checked,
    //     oneFS: optionsForm["one-fs"].checked
    //     // excludeHidden: exc.hidden,
    //     // exPatt: exc.patterns
    // } as ReqOptions

    // if (optionsForm.exclude.checked === true) {
    //     const exc = excluded.get()
    //     console.log(exc)
    //     options.excludeHidden = exc.hidden
    //     options.exPatt = exc.patterns as string[]
    // }

    const req = initScan ? "/scan" : "/dir"
    // yes, if "/dir" case options mean nothing
    // const data = (await doFetch("/scan", {
    const data = (await doFetch(req, {
        path,
        pages: 1,
        options: getOptions(),
        filters: getFilters()
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

scanButton.addEventListener("click", () => {
    const st = status.get()
    if (st === "ready") {
        initTree(rootPath)
    } else if (st === "done") {
        status.set("ready")
    }
})

function rescan() {
    removeCanceled()
    resetTree()
    simulateScan()
    initTree(rootPath)
}
document.getElementById("rescan-button").addEventListener("click", rescan)

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
async function cancel() {
    interval = 100
    setCanceled()
    const re = await doFetch("/cancel")
    console.log(re)
    // if (re?.status === "canceled") setCanceled()
    if (re?.status !== "canceled") removeCanceled()
}
document.getElementById("cancel").addEventListener("click", cancel)

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
    // if (st === "scanning") return
    if (st === "scanning") {
        if (e.key === "Escape") cancel()
    } else if (st === "done") {
        // if (e.key === "Enter" && e.ctrlKey) {
        //     e.preventDefault()
        //     status.set("ready")
        // }
        if (e.key === "Enter") {
            e.preventDefault()

            if (e.ctrlKey) {
                status.set("ready")
            } else if (e.shiftKey && canceled) {
                rescan()
            }
        }
    } else {
        handlePathInput(e)
    }
})
