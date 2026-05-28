import { doFetch } from "../api/fetch"
// import { pathInpunt } from "../path/pathInput"
import handleBytes from "../helpers/handleBytes"
import type { Branch, Node } from "../types"

const totalSize = document.getElementById("total-size") as HTMLDivElement
const totalLocked = document.getElementById("lock-widget") as HTMLDivElement
const statePannel = totalSize.parentElement
const treeBlock = document.getElementById("tree")!
// const cancelButton = document.getElementById("cancel")

let rootPath = ""

let max = 1

let canceled = false

let branches = {} as Record<string, Branch>

function genLockedDetails(node: Node) {
    const re = []
    if (node.locked === -1) {
        re.push(`You have no read rights for this dir`)
    } else {
        re.push(`Contains ${node.locked} nested dir(s) without access`)
    }
    re.push(` run as root to get the full size.`)

    return re
}

function createLi(node: Node, prePath: string): string {
    let realPath: string
    // let linkType: string
    if (node.type == "L") {
        const parts = node.name.split("/")
        node.name = parts[0]
        realPath = parts.slice(2).join("/")
        // linkType = `<span class="t${parts[1]}"><span>`
        node.type += parts[1]
    }
    const title = [
        `Path: ${prePath ? prePath + "/" : "Root"}`,
        `Name: ${node.name}`
        // `${realPath ? "linked: " + realPath : ""}`
    ]
    if (realPath) {
        title.push("Link to: " + realPath)
    } else if (node.locked) {
        title.push(...genLockedDetails(node))
    }
    // console.log(node.name, node.locked)
    // title="path: ${prePath ? prePath + "/" : "root"}\nname: ${node.name}\n${realPath ? "linked: " + realPath : ""}"
    //
    return `<li><div
            class="shoot
                ${node.locked > 0 ? "locked" : node.locked === -1 ? "locked itself" : ""}
                ${node.sizeIsTemp ? "temp" : ""}"
            data-path="${prePath}" 
            ${node.type === "d" ? 'data-dirname="' + node.name + '"' : ""}
            data-size="${node.size}"
            style="--size: ${node.size}%"
        >
            <div
                class="fd-entry"
                title="${title.join("\n")}"
            >
                <div
                    class="fd-type t${node.type}"
                    ${node.type === "d" ? "data-dir='true'" : ""}
                >
                </div>
                <div class="fd-details">
                    <div class="fd-vizual-size"></div>
                    <div class="fd-size" title="${node.size} B">${handleBytes(node.size)}</div>
                    <div class="fd-name">${node.name}</div>
                </div>
            </div>
    </div></li>`
} // <div class="fd-name">${linkType ? linkType : ""}${node.name}</div>

export function createBranch(node: Node, prePath: string): DocumentFragment {
    // if (!node.content) return
    if (!node.content) {
        const templ = document.createElement("template")
        templ.innerHTML = `<ul class="dir-content"></ul>`

        return templ.content
    }
    const path = prePath ? `${prePath}/${node.name}` : node.name

    node.content.sort((a, b) => b.size - a.size)
    if (node.content[0].size > max) {
        max = node.content[0].size
        document.documentElement.style.setProperty("--max-size", (max / 100).toString())
    }

    // const lis = node.content.map(entry => createLi(entry, prePath)).join("")
    const lis = node.content.map(entry => createLi(entry, path)).join("")
    // return `<ul class="dir-content">${lis}</ul>`
    // const ulHtml = `<ul class="dir-content">${lis}</ul>`
    const templ = document.createElement("template")
    // console.log(templ)
    templ.innerHTML = `<ul class="dir-content" data-path="${path}">${lis}</ul>`

    return templ.content
}

function updateSize(node: Node, display: HTMLDivElement, tempWidget: HTMLDivElement) {
    // if (!display.classList.contains("temp") && !node.sizeIsTemp) return false
    if (!tempWidget.classList.contains("temp") && !node.sizeIsTemp) return false
    // console.log(node, display, tempWidget)

    // if (node.sizeIsTemp) display.classList.add("temp")
    // else display.classList.remove("temp")
    if (node.sizeIsTemp) tempWidget.classList.add("temp")
    // else tempWidget.classList.remove("temp")

    const b = `${node.size} B`
    const h = handleBytes(node.size)
    if (display.title !== b) {
        display.title = b
        display.textContent = h

        return true
    }

    return false
}

function updateBranch(bNode: Node) {
    if (!bNode.content) return

    console.log(bNode)
    if (!branches[bNode.name]) {
        const branch = {
            ul: treeBlock.querySelector(`ul[data-path="${bNode.name}"]`),
            shoots: {}
        } as Branch

        const shootEls = branch.ul.querySelectorAll(
            `.shoot[data-path="${bNode.name}"]`
        ) as NodeListOf<HTMLDivElement>
        console.log(shootEls)
        shootEls.forEach((el, i) => {
            branch.shoots[el.dataset.dirname || i] = { el }
        })
        branches[bNode.name] = branch
    }
    const branch = branches[bNode.name]
    // console.log(branch)
    for (const cNode of bNode.content) {
        // console.log(cNode)
        const shoot = branch.shoots[cNode.name]
        // console.log(cNode.name, shoot)
        if (cNode.locked) {
            console.log("Locked!", cNode.name)
            shoot.el.classList.add("locked")
            // if (cNode.locked > 1) shoot.el.classList.add("itself")
            const details = genLockedDetails(cNode).join("\n")
            const element = shoot.el.querySelector(".fd-entry") as HTMLDivElement
            if (cNode.locked === -1) {
                shoot.el.classList.add("itself")
                if (!element.title.includes("You have no")) {
                    element.title += "\n" + details
                }
            } else {
                const base = element.title.split("\nContains ")[0]
                element.title = base + "\n" + details
            }
        }

        if (!shoot.sizeDisplay) shoot.sizeDisplay = shoot.el.querySelector(".fd-size")
        const updated = updateSize(cNode, shoot.sizeDisplay, shoot.el)
        console.log(updated)
        if (!updated) continue

        const sizeStr = cNode.size.toString()
        if (sizeStr !== shoot.el.dataset.size) {
            shoot.el.dataset.size = sizeStr
            shoot.el.style.setProperty("--size", `${sizeStr}%`)
        }
    }

    const shoots = Object.values(branch.shoots)

    shoots.sort((a, b) => Number(b.el.dataset.size) - Number(a.el.dataset.size))
    // console.log(shoots)

    // const fragment = document.createDocumentFragment()
    // shoots.forEach(e => fragment.appendChild(e.li))
    // branch.ul.appendChild(fragment)
    // console.log(branch)
    shoots.forEach((shoot, i) => {
        if (branch.ul.childNodes[i].childNodes[0] !== shoot.el) {
            branch.ul.childNodes[i].appendChild(shoot.el)
            // console.log("moved", shoot.li)
            console.log("moved")
        }
    })
}

export function updateTree(bNodes: Node[]) {
    const root = bNodes[0]
    updateTreeRoot(root)
    if (!root.content) return

    root.content.sort((a, b) => b.size - a.size)
    // if (root.content[0].size != max) {
    if (root.content[0].size > max) {
        max = root.content[0].size
        document.documentElement.style.setProperty("--max-size", (max / 100).toString())
    }

    for (const b of bNodes) {
        updateBranch(b)
    }
}

function updateTreeRoot(node: Node) {
    updateSize(node, totalSize, totalSize.parentElement as HTMLDivElement)
    if (node.locked) {
        totalLocked.classList.remove("hidden")
        totalLocked.textContent = node.locked.toString()
    } else {
        totalLocked.classList.add("hidden")
    }
}

export async function rebuildTree(data: Node, path: string) {
    rootPath = path

    removeCanceled()
    treeBlock.innerHTML = ""
    totalSize.parentElement.classList.add("temp")
    max = 1
    branches = {}

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

// treeBlock.addEventListener("click", async e => {
//     const target = e.target as HTMLDivElement
//     console.log(target)
//     // if (!target.classList.contains("interactive")) return
//     // if (!target.classList.contains("td")) return
//     if (!target.dataset.dir) return
//     const shoot = target.closest("div.shoot") as HTMLDivElement
//     // const dataset = target?.dataset
//     const dataset = shoot?.dataset

//     if (!dataset.nested) {
//         // const prePath = dataset.path ? `${pathInpunt.value}${dataset.path}/` : pathInpunt.value
//         const prePath = dataset.path ? `${rootPath}${dataset.path}/` : rootPath
//         const fullPath = prePath + dataset.dirname
//         // const path = target.dataset.path
//         console.log(fullPath)

//         target.classList.add("unfold")

//         const data = await doFetch("/dir", { path: fullPath })
//         // node.content = await doFetch("/dir", { path: fullPath })
//         console.log(data)
//         const branch = createBranch(data, dataset.path)
//         if (branch) shoot.appendChild(branch)
//         dataset.nested = "true"
//         dataset.unfolded = "true"
//         // target.classList.add("unfold")
//     } else {
//         target.classList.toggle("unfold")
//         shoot.querySelector<HTMLDivElement>(".dir-content")!.hidden =
//             !target.classList.contains("unfold")
//     }
// })
