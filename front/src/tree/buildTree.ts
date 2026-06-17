import handleBytes from "../helpers/handleBytes"
import type { DataNode, ElNode, UpdateBranch } from "../types"

const totalSize = document.getElementById("total-size") as HTMLDivElement
const totalLocked = document.getElementById("lock-widget") as HTMLDivElement
const statePannel = totalSize.parentElement
const treeBlock = document.getElementById("tree")!

let max = 1

let canceled = false

let branches2 = {} as Record<string, UpdateBranch>

function genLockedDetails(node: DataNode) {
    const re = []
    if (node.locked === -1) {
        re.push(` You have no read rights for this dir`)
    } else {
        re.push(` Contains ${node.locked} nested dir(s) without access`)
    }
    re.push(` Run as root to get the full size.`)

    return re
}

function createLi(node: DataNode, prePath: string): string {
    let realPath: string
    let isBrokenLink = false
    if (node.type == "L") {
        const parts = node.name.split("/")
        node.name = parts[0]
        realPath = parts.slice(2).join("/")
        node.type += parts[1]
        if (parts[1] === "brk") isBrokenLink = true
    }

    const title = [`Path: ${prePath ? prePath + "/" : "Root"}`, `Name: ${node.name}`]
    if (realPath) {
        title.push(isBrokenLink ? "Broken link to: " + realPath : "Link to: " + realPath)
    } else if (node.locked) {
        title.push(...genLockedDetails(node))
    }

    const classes = ["shoot"]
    if (node.locked) {
        classes.push("locked")
        if (node.locked === -1) classes.push("itself")
    }
    if (node.sizeIsTemp) classes.push("temp")

    return `<li><div
            class="${classes.join(" ")}"
            data-path="${prePath}" 
            data-name="${node.name}"
            style="--size: ${node.size}%"
        >
            <div class="fd-entry" title="${title.join("\n")}">
                <div class="fd-type t${node.type}"></div>
                <div class="fd-details">
                    <div class="fd-sizebar"></div>
                    <div class="fd-size" title="${node.size} B">${handleBytes(node.size)}</div>
                    <div class="fd-name">${node.name}</div>
                </div>
            </div>
    </div></li>`
}

export function createBranch(node: DataNode, prePath: string): DocumentFragment {
    // if (!node.content) return
    if (!node.content) {
        const templ = document.createElement("template")
        templ.innerHTML = `<ul class="dir-content"></ul>`

        return templ.content
    }
    const path = prePath ? `${prePath}/${node.name}` : node.name

    // node.content.sort((a, b) => b.size - a.size)
    if (node.content[0].size > max) {
        max = node.content[0].size
        document.documentElement.style.setProperty("--max-size", (max / 100).toString())
    }

    // const first100 = node.content.slice(0, 100)

    if (node.sizeIsTemp) {
        branches2[path] = {
            // dataShoots: new Map(first100.map(s => [s.name, s]))
            dataShoots: new Map(node.content.map(s => [s.name, s]))
        }
        console.log("branches2", branches2)
    }

    const lis = node.content.map(entry => createLi(entry, path)).join("")
    // const lis = first100.map(entry => createLi(entry, path)).join("")
    const templ = document.createElement("template")
    // console.log(templ)
    templ.innerHTML = `<ul class="dir-content" data-path="${path}">${lis}</ul>`

    return templ.content
}

function updateShootTitle(elNode: ElNode, oldD: DataNode, newD: DataNode) {
    if (oldD.locked === newD.locked) return
    if (!elNode.entry) elNode.entry = elNode.shoot.querySelector(".fd-entry")

    elNode.shoot.classList.add("locked")
    const details = genLockedDetails(newD).join("\n")
    if (newD.locked === -1) {
        elNode.shoot.classList.add("itself")
        // if (!elNode.entry.title.includes("You have no")) {
        //     elNode.entry.title += "\n" + details
        // }
        elNode.entry.title += "\n" + details
    } else {
        const base = elNode.entry.title.split("\nContains ")[0]
        elNode.entry.title = base + "\n" + details
    }
}

function updateShootSize(elNode: ElNode, oldD: DataNode | null, newD: DataNode) {
    // console.log(oldD?.size, newD.size)
    if (oldD?.size !== newD.size) {
        elNode.shoot.style.setProperty("--size", `${newD.size}%`)
        if (!elNode.size) elNode.size = elNode.shoot.querySelector(".fd-size")
        elNode.size.title = `${newD.size} B`
        elNode.size.textContent = handleBytes(newD.size)
    }

    if (newD.sizeIsTemp) elNode.shoot.classList.add("temp")
    else elNode.shoot.classList.remove("temp")
}

function resetShoot(elNode: ElNode, data: DataNode) {
    delete elNode.shoot.dataset.nested
    // delete elNode.shoot.dataset.unfolded
    elNode.shoot.className = "shoot"
    elNode.shoot.querySelector("ul")?.remove() // remove the branch too?

    elNode.shoot.dataset.name = data.name
    elNode.shoot.querySelector(".fd-name").textContent = data.name
    elNode.shoot.querySelector(".fd-type").className = `fd-type t${data.type}`

    updateShootSize(elNode, null, data)
}

const pageSize = 100
async function updateBranch(branchUpdate: DataNode) {
    // if (!branchUpdate.content) return // are there such cases?

    console.log("branch update:", branchUpdate)

    const branch = branches2[branchUpdate.name]
    console.log("branch:", branch)

    const mix = new Map(branch.dataShoots)
    branchUpdate.content.forEach(s => mix.set(s.name, s))

    const actual = [...mix.values()].sort((a, b) => b.size - a.size).slice(0, pageSize)
    console.log("actual", actual)

    if (!branch.ul) {
        branch.ul = treeBlock.querySelector(`ul[data-path="${branchUpdate.name}"]`)
        branch.elShoots = new Map()

        const shootEls = branch.ul.querySelectorAll(
            `.shoot[data-path="${branchUpdate.name}"]`
        ) as NodeListOf<HTMLDivElement>
        // console.log(shootEls)
        shootEls.forEach(shoot => {
            branch.elShoots.set(shoot.dataset.name, { shoot })
        })
    }

    branch.ul.style.display = "none"
    const store = new DocumentFragment()
    // update exhisting shoots
    actual.forEach((data, i) => {
        const old = branch.dataShoots.get(data.name)
        if (old) {
            // debug!
            // if (!branch.elNodes.get(data.name)) {
            //     console.log(data)
            // }
            const elNode = branch.elShoots.get(data.name)
            const shootEl = elNode.shoot
            const liCont = branch.ul.childNodes[i].childNodes[0]

            // if li does not contain the shoot we need
            if (liCont !== shootEl) {
                // if it contains wrong one - pull it out
                if (liCont instanceof HTMLDivElement) store.appendChild(liCont)
                // add the right one
                branch.ul.childNodes[i].appendChild(shootEl)
                console.log("moved")
            }

            updateShootSize(elNode, old, data)
            updateShootTitle(elNode, old, data)
        }
    })
    // console.log(store.childNodes)
    // reset shoots
    actual.forEach((data, i) => {
        if (!branch.dataShoots.has(data.name)) {
            let shootEl = branch.ul.childNodes[i].childNodes[0] as HTMLElement
            if (!shootEl) {
                shootEl = store.firstElementChild as HTMLElement
                branch.ul.childNodes[i].appendChild(shootEl)
            }
            const elNode = branch.elShoots.get(shootEl.dataset.name)
            branch.elShoots.delete(shootEl.dataset.name)
            branch.elShoots.set(data.name, elNode)

            resetShoot(elNode, data)
            console.log("reset")
        }
    })
    branch.ul.style.display = ""
    // console.log(store.childNodes)

    branch.dataShoots =
        mix.size === branch.dataShoots.size ? mix : new Map(actual.map(s => [s.name, s]))
}

export function updateTree(bNodes: DataNode[]) {
    const root = bNodes[0]
    updateTreeRoot(root)
    if (!root.content) return

    root.content.sort((a, b) => b.size - a.size)
    if (root.content[0].size != max) {
        // if (root.content[0].size > max) { // works bad if recalculation gives less sum
        max = root.content[0].size
        document.documentElement.style.setProperty("--max-size", (max / 100).toString())
    }

    for (const b of bNodes) {
        updateBranch(b)
    }
}

let totalSizeVal = 0
function updateTreeRoot(data: DataNode) {
    // updateSize(node, totalSize, totalSize.parentElement as HTMLDivElement)
    if (data?.size !== totalSizeVal) {
        totalSize.title = `${data.size} B`
        totalSize.textContent = handleBytes(data.size)
    }

    if (data.sizeIsTemp) totalSize.parentElement.classList.add("temp")
    else totalSize.parentElement.classList.remove("temp")

    if (data.locked) {
        totalLocked.classList.remove("hidden")
        totalLocked.textContent = data.locked.toString()
    } else {
        totalLocked.classList.add("hidden")
    }
}

export async function rebuildTree(data: DataNode) {
    removeCanceled()
    treeBlock.innerHTML = ""
    // totalSize.parentElement.classList.add("temp")
    max = 1
    branches2 = {}

    updateTreeRoot(data)

    treeBlock.appendChild(createBranch(data, ""))
}

export function setCanceled() {
    canceled = true
    document.documentElement.style.setProperty("--temp-dir-icon", `url("icons/folder-x.svg")`)
    statePannel.classList.add("canceled")
}

export function removeCanceled() {
    if (!canceled) return
    canceled = false
    document.documentElement.style.removeProperty("--temp-dir-icon")
    statePannel.classList.remove("canceled")
}
