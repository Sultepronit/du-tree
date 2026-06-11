import handleBytes from "../helpers/handleBytes"
import type { Branch, DataNode, UpdateBranch } from "../types"

const totalSize = document.getElementById("total-size") as HTMLDivElement
const totalLocked = document.getElementById("lock-widget") as HTMLDivElement
const statePannel = totalSize.parentElement
const treeBlock = document.getElementById("tree")!

// let rootPath = ""

let max = 1

let canceled = false

let branches = {} as Record<string, Branch>
let branches2 = {} as Record<string, UpdateBranch>

function genLockedDetails(node: DataNode) {
    const re = []
    if (node.locked === -1) {
        re.push(`You have no read rights for this dir`)
    } else {
        re.push(`Contains ${node.locked} nested dir(s) without access`)
    }
    re.push(`Run as root to get the full size.`)

    return re
}

function createLi(node: DataNode, prePath: string): string {
    let realPath: string
    if (node.type == "L") {
        const parts = node.name.split("/")
        node.name = parts[0]
        realPath = parts.slice(2).join("/")
        node.type += parts[1]
    }

    const title = [`Path: ${prePath ? prePath + "/" : "Root"}`, `Name: ${node.name}`]
    if (realPath) {
        title.push("Link to: " + realPath)
    } else if (node.locked) {
        title.push(...genLockedDetails(node))
    }

    const classes = ["shoot"]
    if (node.locked) {
        classes.push("locked")
        if (node.locked === -1) classes.push("itself")
    }
    if (node.sizeIsTemp) classes.push("temp")

    // class="shoot
    //     ${node.locked > 0 ? "locked" : node.locked === -1 ? "locked itself" : ""}
    //     ${node.sizeIsTemp ? "temp" : ""}"
    return `<li><div
            class="${classes.join(" ")}"
            data-path="${prePath}" 
            data-name="${node.name}"
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
                    <div class="fd-sizebar"></div>
                    <div class="fd-size" title="${node.size} B">${handleBytes(node.size)}</div>
                    <div class="fd-name">${node.name}</div>
                </div>
            </div>
    </div></li>`
} // <div class="fd-name">${linkType ? linkType : ""}${node.name}</div>

export function createBranch(node: DataNode, prePath: string): DocumentFragment {
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

    const first100 = node.content.slice(0, 100)

    if (node.sizeIsTemp) {
        branches2[path] = {
            dataShoots: first100,
            dataShootsMap: new Map(first100.map(s => [s.name, s]))
        }
        console.log("branches2", branches2)
    }

    // const lis = node.content.map(entry => createLi(entry, path)).join("")
    const lis = first100.map(entry => createLi(entry, path)).join("")
    const templ = document.createElement("template")
    // console.log(templ)
    templ.innerHTML = `<ul class="dir-content" data-path="${path}">${lis}</ul>`

    return templ.content
}

function updateSize(node: DataNode, display: HTMLDivElement, tempWidget: HTMLDivElement) {
    // if (!display.classList.contains("temp") && !node.sizeIsTemp) return false
    if (!tempWidget.classList.contains("temp") && !node.sizeIsTemp) return false
    // console.log(node, display, tempWidget)

    // if (node.sizeIsTemp) display.classList.add("temp")
    // else display.classList.remove("temp")
    if (node.sizeIsTemp) tempWidget.classList.add("temp")
    else tempWidget.classList.remove("temp")

    const b = `${node.size} B`
    const h = handleBytes(node.size)
    if (display.title !== b) {
        display.title = b
        display.textContent = h

        return true
    }

    return false
}

const pageSize = 100
async function updateBranch(branchData: DataNode) {
    // if (!bNode.content) return // are there such cases?

    console.log("branch update:", branchData)

    const branch = branches2[branchData.name]
    // console.log(branch)
    const updates = branchData.content.sort((a, b) => b.size - a.size).slice(0, pageSize)
    // const mixed = new Map<string, DataNode>()
    // branch.dataShoots.forEach(u => mixed.set(u.name, u))
    const mix = new Map(branch.dataShootsMap)
    updates.forEach(s => mix.set(s.name, s))
    // console.log("mixed", mixed)
    // const mixed = [...mix.values()].sort((a, b) => b.size - a.size).slice(0, pageSize)
    const mixed = [...mix.values()].sort((a, b) => b.size - a.size)
    console.log("mixed", mixed)

    if (!branch.ul) {
        branch.ul = treeBlock.querySelector(`ul[data-path="${branchData.name}"]`)
        branch.elNodes = new Map()

        const shootEls = branch.ul.querySelectorAll(
            `.shoot[data-path="${branchData.name}"]`
        ) as NodeListOf<HTMLDivElement>
        // console.log(shootEls)
        shootEls.forEach(shoot => {
            branch.elNodes.set(shoot.dataset.name, { shoot })
        })
    }
    console.log("branch:", branch)

    const selected = mixed.slice(0, pageSize)
    for (const node of selected) {
        console.log(node)
    }

    branch.dataShootsMap =
        mix.size === branch.dataShootsMap.size ? mix : new Map(selected.map(s => [s.name, s]))

    for (let i = pageSize; i < mixed.length; i++) {
        // if (branch.elNodes.has(mixed[i].name))
        const elNode = branch.elNodes.get(mixed[i].name)
        if (elNode) {
            elNode.shoot.remove()
            // elNode.size?.remove()
            branch.elNodes.delete(mixed[i].name)
        }
    }

    // for (const shootData of branchData.content) {
    //     // console.log(cNode)
    //     const shoot = branch.shoots[shootData.name]
    //     // console.log(cNode.name, shoot)
    //     if (shootData.locked) {
    //         console.log("Locked!", shootData.name)
    //         shoot.el.classList.add("locked")
    //         // if (cNode.locked > 1) shoot.el.classList.add("itself")
    //         const details = genLockedDetails(shootData).join("\n")
    //         const element = shoot.el.querySelector(".fd-entry") as HTMLDivElement
    //         if (shootData.locked === -1) {
    //             shoot.el.classList.add("itself")
    //             if (!element.title.includes("You have no")) {
    //                 element.title += "\n" + details
    //             }
    //         } else {
    //             const base = element.title.split("\nContains ")[0]
    //             element.title = base + "\n" + details
    //         }
    //     }

    //     if (!shoot.sizeDisplay) shoot.sizeDisplay = shoot.el.querySelector(".fd-size")
    //     const updated = updateSize(shootData, shoot.sizeDisplay, shoot.el)
    //     // console.log(updated)
    //     if (!updated) continue

    //     const sizeStr = shootData.size.toString()
    //     if (sizeStr !== shoot.el.dataset.size) {
    //         shoot.el.dataset.size = sizeStr
    //         shoot.el.style.setProperty("--size", `${sizeStr}%`)
    //     }
    // }

    // const shoots = Object.values(branch.shoots)

    // shoots.sort((a, b) => Number(b.el.dataset.size) - Number(a.el.dataset.size))
    // // console.log(shoots)

    // shoots.forEach((shoot, i) => {
    //     if (branch.ul.childNodes[i].childNodes[0] !== shoot.el) {
    //         branch.ul.childNodes[i].appendChild(shoot.el)
    //         // console.log("moved", shoot.li)
    //         console.log("moved")
    //     }
    // })
}

// async function updateBranch0(bNode: DataNode) {
//     if (!bNode.content) return

//     console.log(bNode)
//     if (!branches[bNode.name]) {
//         let ul: HTMLUListElement
//         for (let i = 0; i < 22; i++) {
//             ul = treeBlock.querySelector(`ul[data-path="${bNode.name}"]`)
//             if (ul) break
//             await new Promise(res => setTimeout(res, 200))
//         }

//         const branch = {
//             // ul: treeBlock.querySelector(`ul[data-path="${bNode.name}"]`),
//             ul,
//             shoots: {}
//         } as Branch

//         const shootEls = branch.ul.querySelectorAll(
//             `.shoot[data-path="${bNode.name}"]`
//         ) as NodeListOf<HTMLDivElement>
//         console.log(shootEls)
//         shootEls.forEach((el, i) => {
//             branch.shoots[el.dataset.dirname || i] = { el }
//         })
//         branches[bNode.name] = branch
//     }
//     const branch = branches[bNode.name]
//     // console.log(branch)
//     for (const cNode of bNode.content) {
//         // console.log(cNode)
//         const shoot = branch.shoots[cNode.name]
//         // console.log(cNode.name, shoot)
//         if (cNode.locked) {
//             console.log("Locked!", cNode.name)
//             shoot.el.classList.add("locked")
//             // if (cNode.locked > 1) shoot.el.classList.add("itself")
//             const details = genLockedDetails(cNode).join("\n")
//             const element = shoot.el.querySelector(".fd-entry") as HTMLDivElement
//             if (cNode.locked === -1) {
//                 shoot.el.classList.add("itself")
//                 if (!element.title.includes("You have no")) {
//                     element.title += "\n" + details
//                 }
//             } else {
//                 const base = element.title.split("\nContains ")[0]
//                 element.title = base + "\n" + details
//             }
//         }

//         if (!shoot.sizeDisplay) shoot.sizeDisplay = shoot.el.querySelector(".fd-size")
//         const updated = updateSize(cNode, shoot.sizeDisplay, shoot.el)
//         // console.log(updated)
//         if (!updated) continue

//         const sizeStr = cNode.size.toString()
//         if (sizeStr !== shoot.el.dataset.size) {
//             shoot.el.dataset.size = sizeStr
//             shoot.el.style.setProperty("--size", `${sizeStr}%`)
//         }
//     }

//     const shoots = Object.values(branch.shoots)

//     shoots.sort((a, b) => Number(b.el.dataset.size) - Number(a.el.dataset.size))
//     // console.log(shoots)

//     shoots.forEach((shoot, i) => {
//         if (branch.ul.childNodes[i].childNodes[0] !== shoot.el) {
//             branch.ul.childNodes[i].appendChild(shoot.el)
//             // console.log("moved", shoot.li)
//             console.log("moved")
//         }
//     })
// }

export function updateTree(bNodes: DataNode[]) {
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

function updateTreeRoot(node: DataNode) {
    updateSize(node, totalSize, totalSize.parentElement as HTMLDivElement)
    if (node.locked) {
        totalLocked.classList.remove("hidden")
        totalLocked.textContent = node.locked.toString()
    } else {
        totalLocked.classList.add("hidden")
    }
}

export async function rebuildTree(data: DataNode, path: string) {
    // rootPath = path

    removeCanceled()
    treeBlock.innerHTML = ""
    totalSize.parentElement.classList.add("temp")
    max = 1
    branches = {}
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
