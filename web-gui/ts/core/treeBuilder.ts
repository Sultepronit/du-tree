import formatSize from "../utils/formatSize"
import type { DataNode, ViewNode, ViewBranch, DataBranch } from "../types"
import { createLi, genLockedDetails, genTitle, handleBytesExt } from "./treeTemplates"
import { sortBySizeThanName } from "../helpers/sort"
import { filterBranchCont } from "./filters"

const totalSize = document.getElementById("total-size") as HTMLDivElement
const totalLocked = document.getElementById("lock-widget") as HTMLDivElement
const treeBlock = document.getElementById("tree")!

const pageSize = 100

let max = 1

let branches = {} as Record<string, ViewBranch>

let rootPath = ""

// function genLockedDetails(node: DataNode) {
//     const re = []
//     if (node.locked === -1) {
//         re.push(`\nYou have no read rights for this dir`)
//     } else {
//         re.push(`\nContains ${node.locked} nested dir(s) without access`)
//     }
//     re.push(` Run as root to get the full size.`)

//     return re
// }

// const specialTypes = {
//     S: "Socket",
//     p: "Pipe",
//     D: "Device"
// }

// function genTitle(data: DataNode, path: string) {
//     const title = [`Name: ${data.name}`, `Location: ${rootPath}${path}`]

//     if (data.linkPath) {
//         title.push(
//             data.type === "Lbrk"
//                 ? `Broken soft link to: ${data.linkPath}`
//                 : data.type === "Lperm-file"
//                   ? `Soft link (Target hidden: permission denied).`
//                   : data.type === "Lperm-target"
//                     ? `Soft link to: ${data.linkPath} (Target inaccessible: permission denied).`
//                     : `Soft link to: ${data.linkPath}`
//         )
//     }

//     const t = data.linkPath ? data.type.slice(1) : data.type
//     const st = specialTypes[t]
//     if (st) title.push(`File type: ${st}`)

//     title.push(
//         `Last modified: ${formatTime(data.modTime)}`,
//         `Scan time: ${formatTime(data.scanTime)}`
//     )

//     if (data.nlink) {
//         let msg = `\nShared inode: ${data.nlink} hard links exist.\n`
//         if (data.isNeglected) {
//             msg += "Size of this hard link is neglected."
//         } else {
//             msg += "Size of this hard link is counted, all others are neglected."
//         }
//         title.push(msg)
//     }

//     if (data.locked) {
//         title.push(...genLockedDetails(data))
//     }

//     return title.join("\n")
// }

// const handleBytesExt = (data: DataNode) => {
//     return formatSize(data.size, data.temp > 0 || data.locked !== undefined)
// }

// function createLi(data: DataNode, path: string): string {
//     const type = data.type[0] === "L" ? `link t${data.type.slice(1)}` : `t${data.type}`

//     const classes = [`shoot ${type}`]
//     if (data.locked) {
//         classes.push("locked")
//         if (data.locked === -1) classes.push("itself")
//     }
//     if (data.temp) {
//         classes.push("temp")
//         if (data.temp === 2) classes.push("unavailable")
//     }
//     if (data.nlink) {
//         classes.push("hardlink")
//         if (data.isNeglected) classes.push("neglected")
//     }

//     return `<li><div
//             class="${classes.join(" ")}"
//             title="${genTitle(data, path)}"
//             data-path="${path}"
//             data-name="${data.name}"
//             style="--size: ${data.size}%"
//         >
//             <div class="fd-entry">
//                 <div class="fd-sizebar"></div>
//                 <div class="fd-size" title="${data.size} B">${handleBytesExt(data)}</div>
//                 <div class="fd-name">${data.name}</div>
//             </div>
//     </div></li>`
// }

// export function filterTree() {
//     console.log("filter")
//     for (const [name, branch] of Object.entries(branches)) {
//         console.log(name, branch.dataNodesIndex)
//         const data = Array.from(branch.dataNodesIndex.values())
//         console.log(data)
//         const filtered = data.filter(n => {
//             return !n.name.startsWith(".")
//         })
//         updateBranch({ name, content: filtered }, true)
//     }
// }

// setTimeout(filterTree, 2000)

function prepareBranchData(data: DataBranch) {
    if (data.name === "" && data.content[0].size > max) {
        max = data.content[0].size
        document.documentElement.style.setProperty("--max-size", (max / 100).toString())
    }

    if (data.isFiltered) return { filtered: data.content }

    // const filtered = filterBranchCont(data.content)
    return {
        raw: data.content,
        filtered: filterBranchCont(data.content)
    }
}

// export function createBranch(data: DataNode, prePath: string): DocumentFragment {
export function createBranch(data: DataBranch, prePath: string): DocumentFragment {
    const templ = document.createElement("template")
    if (!data?.content) {
        templ.innerHTML = `<ul class="dir-content"></ul>`

        return templ.content
    }
    const path = prePath ? `${prePath}/${data.name}` : data.name

    prepareBranchData(data)
    // if (data.content[0].size > max) {
    //     max = data.content[0].size
    //     document.documentElement.style.setProperty("--max-size", (max / 100).toString())
    // }

    const viewNodesIndex = new Map<string, ViewNode>()
    for (const n of data.content) {
        viewNodesIndex.set(n.name, { data: n })
    }

    branches[path] = {
        data: data.content,
        // dataNodesIndex: new Map(data.content.map(s => [s.name, s])),
        viewNodesIndex,
        pages: 1
    }

    // console.log("branches:", branches)

    const lis = data.content.map(entry => createLi(entry, path, rootPath))
    if (data.contentCount) {
        // lis.push(`<li class="show-more" title="${path ? path + "/" : "Root"}">
        lis.push(`<li class="show-more">
            <span class="so-far">${data.content.length}/${data.contentCount}</span>
            <button name="add-more" data-path="${path}" data-pages="1">
                Show more
            </button>
        </li>`)
    }
    // const templ = document.createElement("template")
    // console.log(templ)
    templ.innerHTML = `<ul class="dir-content" data-path="${path}">${lis.join("")}</ul>`

    return templ.content
}

// export function appendBranch(data: DataNode, button: HTMLButtonElement, pages: number) {
export function appendBranch(data: DataBranch, button: HTMLButtonElement, pages: number) {
    const oldNodesCount = (pages - 1) * pageSize
    const newNodes = data.content.slice(oldNodesCount)
    // console.log(oldNodesCount, newNodes)

    const shortPath = button.dataset.path
    const lis = newNodes.map(entry => createLi(entry, shortPath, rootPath))

    const buttonLi = button.closest("li") as HTMLLIElement

    data.name = shortPath
    updateBranch(data) // update old pages
    buttonLi.insertAdjacentHTML("beforebegin", lis.join("")) // add new one

    const branch = branches[shortPath]
    if (branch) {
        branch.pages = pages // for next updates
        // newNodes.forEach(d => branch.dataNodesIndex.set(d.name, d))
        // branch.data.push(...newNodes) // & sort?
        branch.data = data.content
        for (const n of newNodes) {
            branch.viewNodesIndex.set(n.name, { data: n })
        }
    }

    if (!data.contentCount) {
        buttonLi.remove()
        return
    }
    button.dataset.pages = pages.toString()
    const soFar = buttonLi.querySelector(".so-far")
    // soFar.textContent = (pages * pageSize).toString()
    soFar.textContent = `${pages * pageSize}/${data.contentCount}`
}

// function updateLocked(elNode: ViewNode, oldD: DataNode, newD: DataNode) {
function updateLocked(viewNode: ViewNode, newData: DataNode) {
    // if (oldD.locked === newD.locked) return
    if (viewNode.data.locked === newData.locked) return

    viewNode.shoot.classList.add("locked")
    const details = genLockedDetails(newData).join("\n")
    if (newData.locked === -1) {
        viewNode.shoot.classList.add("itself")
        viewNode.shoot.title += "\n" + details
    } else {
        viewNode.shoot.title = genTitle(newData, viewNode.shoot.dataset.path, rootPath)
    }
}

// function updateShootSize(viewNode: ViewNode, oldD: DataNode | null, newD: DataNode) {
function updateShootSize(viewNode: ViewNode, newData: DataNode) {
    // if (oldD?.size !== newData.size) {
    if (viewNode.data.size !== newData.size) {
        viewNode.shoot.style.setProperty("--size", `${newData.size}%`)
        if (!viewNode.sizeVidget) viewNode.sizeVidget = viewNode.shoot.querySelector(".fd-size")
        viewNode.sizeVidget.textContent = handleBytesExt(newData)
        viewNode.sizeVidget.title = `${newData.size} B`
        // } else if (oldD?.temp !== newData.temp || oldD?.locked !== newData.locked) {
    } else if (viewNode.data.temp !== newData.temp || viewNode.data.locked !== newData.locked) {
        if (!viewNode.sizeVidget) viewNode.sizeVidget = viewNode.shoot.querySelector(".fd-size")
        viewNode.sizeVidget.textContent = handleBytesExt(newData)
    }

    if (newData.temp) {
        viewNode.shoot.classList.add("temp")
        if (newData.temp === 2) {
            viewNode.shoot.classList.add("unavailable")
        } else {
            viewNode.shoot.classList.remove("unavailable")
        }
    } else {
        viewNode.shoot.classList.remove("temp", "unavailable")
    }
}

function resetShoot(viewNode: ViewNode, data: DataNode) {
    delete viewNode.shoot.dataset.nested
    viewNode.shoot.querySelector("ul")?.remove() // remove the branch too?

    const classes = [`shoot t${data.type}`]
    if (data.locked) {
        classes.push("locked")
        if (data.locked === -1) classes.push("itself")
    } else if (data.nlink) {
        classes.push("hardlink")
        if (data.isNeglected) classes.push("neglected")
    }
    viewNode.shoot.className = classes.join(" ")

    viewNode.shoot.dataset.name = data.name
    // viewNode.shoot.querySelector(".fd-name").textContent = data.name
    if (!viewNode.nameVidget) viewNode.nameVidget = viewNode.shoot.querySelector(".fd-name")
    viewNode.nameVidget.textContent = data.name

    // updateShootSize(viewNode, null, data)
    updateShootSize(viewNode, data)
    // resetTitle(viewNode, data)
    viewNode.shoot.title = genTitle(data, viewNode.shoot.dataset.path, rootPath)
    viewNode.data = data
}

// function updateBranch(branchUpdate: DataNode, forcefully = false) {
function updateBranch(dataBranch: DataBranch, forcefully = false) {
    if (!dataBranch?.content) return // user navigates dirs before scan

    console.log("branch update:", dataBranch)

    const branch = branches[dataBranch.name]
    // console.log("branch:", branch)

    let actual: DataNode[]
    if (forcefully) {
        actual = dataBranch.content
    } else {
        // const mix = new Map(branch.dataNodesIndex)
        // branchUpdate.content.forEach(s => mix.set(s.name, s))
        const mix = new Map()
        for (const n of branch.data) {
            mix.set(n.name, n)
        }
        for (const n of dataBranch.content) {
            mix.set(n.name, n)
        }

        // actual = [...mix.values()]
        //     .sort((a, b) => {
        //         if (b.size === a.size) {
        //             return a.name.localeCompare(b.name)
        //         }
        //         return b.size - a.size
        //     })
        //     .slice(0, pageSize * branch.pages)
        actual = sortBySizeThanName([...mix.values()]).slice(0, pageSize * branch.pages)
        branch.data = actual
    }

    if (dataBranch.name === "") {
        // if (actual[0].size != max) {
        if (actual[0].size > max) {
            // works bad if recalculation gives less sum?
            max = actual[0].size
            document.documentElement.style.setProperty("--max-size", (max / 100).toString())
        }
    }

    if (!branch.ul) {
        branch.ul = treeBlock.querySelector(`ul[data-path="${dataBranch.name}"]`)
        // branch.viewNodesIndex = new Map()

        // do we need them all?..
        const shootEls = branch.ul.querySelectorAll(
            `.shoot[data-path="${dataBranch.name}"]`
        ) as NodeListOf<HTMLDivElement>
        // console.log(shootEls)
        shootEls.forEach(shoot => {
            // branch.viewNodesIndex.set(shoot.dataset.name, { shoot })
            const node = branch.viewNodesIndex.get(shoot.dataset.name)
            if (node) {
                node.shoot = shoot
                branch.viewNodesIndex.set(shoot.dataset.name, node)
            } else {
                console.warn("No node found for:", shoot.dataset.name)
            }
        })
    }

    branch.ul.style.display = "none"

    if (branch.viewNodesIndex.size < actual.length) {
        // const newNodes = actual.filter(s => !branch.dataNodesIndex.has(s.name))
        // const newNodes = actual.filter(s => !branch.viewNodesIndex.has(s.name))

        // newNodes.forEach(n => branch.dataNodesIndex.set(n.name, n))
        // const newNodes = [] as DataNode[]
        const lis = [] as string[]
        for (const n of actual) {
            if (!branch.viewNodesIndex.has(n.name)) {
                // newNodes.push(n)
                branch.viewNodesIndex.set(n.name, { data: n })
                lis.push(createLi(n, branch.ul.dataset.path, rootPath))
            }
        }

        // const lis = newNodes.map(entry => createLi(entry, branch.ul.dataset.path, rootPath))
        console.log(lis)
        branch.ul.insertAdjacentHTML("beforeend", lis.join(""))
    }

    const store = new DocumentFragment()
    // update exhisting shoots
    actual.forEach((data, i) => {
        // const existing = branch.dataNodesIndex.get(data.name)
        const found = branch.viewNodesIndex.get(data.name)
        if (!found) return

        // let viewNode = branch.viewNodesIndex.get(data.name)
        // if (!viewNode) {
        if (!found.shoot) {
            // const shoot = branch.ul.querySelector(
            found.shoot = branch.ul.querySelector(
                `.shoot[data-name="${data.name}"]`
            ) as HTMLDivElement
            // console.log(shoot)

            // there is the data node but not the shoot... for some reason...
            // STILL HAPPENS???
            // if (!shoot) {
            if (!found.shoot) {
                // branch.dataNodesIndex.delete(data.name)
                branch.viewNodesIndex.delete(data.name)
                return
            }

            // viewNode = { shoot }
            // branch.viewNodesIndex.set(data.name, viewNode)
        }
        // const shootEl = viewNode.shoot
        const liContShoot = branch.ul.childNodes[i].childNodes[0]

        // if li does not contain the shoot we need
        // if (liCont !== shootEl) {
        if (liContShoot !== found.shoot) {
            // if it contains wrong one - pull it out
            if (liContShoot instanceof HTMLDivElement) store.appendChild(liContShoot)
            // add the right one
            // branch.ul.childNodes[i].appendChild(shootEl)
            branch.ul.childNodes[i].appendChild(found.shoot)
            // console.log("moved", data.name)
            console.log("moved")
        }

        // updateShootSize(viewNode, found, data)
        updateShootSize(found, data)
        // updateLocked(viewNode, found, data)
        updateLocked(found, data)
        found.data = data
    })
    // console.log(store.childNodes)
    // reset shoots
    actual.forEach((data, i) => {
        // if (!branch.dataNodesIndex.has(data.name)) {
        if (branch.viewNodesIndex.has(data.name)) return
        // console.log("reset:", data.name)
        let shootEl = branch.ul.childNodes[i].childNodes[0] as HTMLDivElement
        if (!shootEl) {
            shootEl = store.firstElementChild as HTMLDivElement
            branch.ul.childNodes[i].appendChild(shootEl)
        }
        // const viewNode =
        //     branch.viewNodesIndex.get(shootEl.dataset.name) ||
        //     ({
        //         shoot: shootEl
        //     } as ViewNode)
        let viewNode = branch.viewNodesIndex.get(shootEl.dataset.name)
        if (viewNode) branch.viewNodesIndex.delete(shootEl.dataset.name)
        else {
            console.warn("No node found for:", shootEl.dataset.name)
            viewNode = { data, shoot: shootEl }
        }
        branch.viewNodesIndex.set(data.name, viewNode)

        resetShoot(viewNode, data)
        console.log("reset")
    })
    branch.ul.style.display = ""
    // console.log(store.childNodes)

    // branch.dataNodesIndex =
    //     mix.size === branch.dataNodesIndex.size ? mix : new Map(actual.map(s => [s.name, s]))
}

export function updateTree(bNodes: DataBranch[]) {
    updateTreeRoot(bNodes[0])
    if (!bNodes[0].content) return

    for (const b of bNodes) {
        updateBranch(b)
    }
}

let totalSizeVal = -7
function updateTreeRoot(data: DataBranch) {
    if (data?.size !== totalSizeVal) {
        totalSize.title = `${data.size} B`
        totalSize.textContent = formatSize(data.size)
        totalSizeVal = data.size
    }

    if (data.temp) totalSize.parentElement.classList.add("temp")
    else totalSize.parentElement.classList.remove("temp")

    if (data.locked) {
        totalLocked.classList.remove("hidden")
        totalLocked.textContent = data.locked.toString()
    } else {
        totalLocked.classList.add("hidden")
    }

    if (data.temp || data.locked) totalSize.parentElement.classList.add("probably-bigger")
    else totalSize.parentElement.classList.remove("probably-bigger")
}

export function buildTree(data: DataBranch, path: string) {
    rootPath = path
    updateTreeRoot(data)
    treeBlock.appendChild(createBranch(data, ""))
}

export function simulateScan() {
    updateTreeRoot({ name: "", size: 0, temp: 1 } as DataBranch)
}

export function resetTree() {
    treeBlock.innerHTML = ""
    max = 1
    branches = {}
    updateTreeRoot({ name: "", size: -7 } as DataBranch)
    totalSize.title = ""
    totalSize.textContent = ""
}
