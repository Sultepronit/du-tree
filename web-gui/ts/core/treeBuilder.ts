import formatSize from "../utils/formatSize"
import type { DataNode, ViewNode, ViewBranch, DataBranch } from "../types"
import { createLi, genLockedDetails, genTitle, genVoidLi, handleBytesExt } from "./treeTemplates"
import { filterBranchCont } from "./filters"

const totalSize = document.getElementById("total-size") as HTMLDivElement
const totalLocked = document.getElementById("lock-widget") as HTMLDivElement
const treeBlock = document.getElementById("tree")!

const baceLimit = 50

let max = 1

let branches = {} as Record<string, ViewBranch>

let rootPath = ""

function filterTree() {
    for (const [name, b] of Object.entries(branches)) {
        updateBranch({ name, content: b.data, size: b.size }, false)
    }
}
document.addEventListener("filter-update", filterTree)

function setMax(data: DataBranch) {
    if (data.name === "" && data.content[0].size > max) {
        max = data.content[0].size
        document.documentElement.style.setProperty("--max-size", (max / 100).toString())
    }
}

function genFilteredOutName(count: number) {
    return `${count} Filtered Out Item(s)`
}

export function createBranch(data: DataBranch, prePath: string): DocumentFragment {
    const templ = document.createElement("template")
    if (!data?.content) {
        templ.innerHTML = `<ul class="dir-content"></ul>`

        return templ.content
    }

    setMax(data)

    const filtered = filterBranchCont(data)

    const viewNodesIndex = new Map<string, ViewNode>()

    const lis = [] as string[]
    const path = prePath ? `${prePath}/${data.name}` : data.name
    for (const n of filtered.content) {
        viewNodesIndex.set(n.name, { data: n })
        lis.push(createLi(n, path, rootPath))
    }

    const viewBranch = {
        size: data.size,
        data: data.content,
        filtered: filtered.content,
        // limit: baceLimit,
        viewNodesIndex,
        hiddenItems: filtered.hiddenItems,
        hiddenSize: filtered.hiddenSize
    } as ViewBranch

    viewBranch.hiddenSummary = {
        data: {
            name: genFilteredOutName(filtered.hiddenItems),
            size: filtered.hiddenSize,
            type: "_filt"
        } as DataNode
    }
    branches[path] = viewBranch
    // console.log("branches:", branches)

    lis.push(createLi(viewBranch.hiddenSummary.data, path, rootPath))
    lis.push(`<li class="show-more" ${data.contentCount ? "" : "hidden"}>
    <span class="so-far">${data.content.length}/${data.contentCount}</span>
    <button name="add-more" data-path="${path}" data-limit="${baceLimit}">
        Show more
    </button>
</li>`)

    templ.innerHTML = `<ul class="dir-content" data-path="${path}">${lis.join("")}</ul>`

    templ.content.querySelector<HTMLElement>(".t_filt").hidden = !filtered.hiddenItems

    return templ.content
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
        // if (!viewNode.sizeVidget) viewNode.sizeVidget = viewNode.shoot.querySelector(".fd-size")
        if (!viewNode.sizeVidget)
            viewNode.sizeVidget = viewNode.shoot.children[0].children[1] as HTMLDivElement
        viewNode.sizeVidget.textContent = handleBytesExt(newData)
        viewNode.sizeVidget.title = `${newData.size} B`
        // } else if (oldD?.temp !== newData.temp || oldD?.locked !== newData.locked) {
    } else if (viewNode.data.temp !== newData.temp || viewNode.data.locked !== newData.locked) {
        // if (!viewNode.sizeVidget) viewNode.sizeVidget = viewNode.shoot.querySelector(".fd-size")
        if (!viewNode.sizeVidget)
            viewNode.sizeVidget = viewNode.shoot.children[0].children[1] as HTMLDivElement
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

function setShoot(viewNode: ViewNode, data: DataNode) {
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
    if (!viewNode.nameVidget) {
        viewNode.nameVidget = viewNode.shoot.children[0].children[2] as HTMLDivElement
    }
    viewNode.nameVidget.textContent = data.name

    updateShootSize(viewNode, data)
    viewNode.shoot.title = genTitle(data, viewNode.shoot.dataset.path, rootPath)
    viewNode.data = data
}

function createLi2(data: DataNode, path: string) {
    const li = genVoidLi()
    const viewNode = {
        data: {},
        shoot: li.children[0]
    } as ViewNode

    viewNode.shoot.dataset.path = path

    setShoot(viewNode, data)

    return { li, viewNode }
}

function resetShoot(viewNode: ViewNode, data: DataNode) {
    delete viewNode.shoot.dataset.nested
    viewNode.shoot.querySelector("ul")?.remove() // remove the branch too?

    setShoot(viewNode, data)
    // const classes = [`shoot t${data.type}`]
    // if (data.locked) {
    //     classes.push("locked")
    //     if (data.locked === -1) classes.push("itself")
    // } else if (data.nlink) {
    //     classes.push("hardlink")
    //     if (data.isNeglected) classes.push("neglected")
    // }
    // // if (data.temp) {
    // //     classes.push("temp")
    // //     if (data.temp === 2) classes.push("unavailable")
    // // }
    // viewNode.shoot.className = classes.join(" ")

    // viewNode.shoot.dataset.name = data.name
    // // viewNode.shoot.querySelector(".fd-name").textContent = data.name
    // if (!viewNode.nameVidget) viewNode.nameVidget = viewNode.shoot.querySelector(".fd-name")
    // viewNode.nameVidget.textContent = data.name

    // // updateShootSize(viewNode, null, data)
    // updateShootSize(viewNode, data)
    // // resetTitle(viewNode, data)
    // viewNode.shoot.title = genTitle(data, viewNode.shoot.dataset.path, rootPath)
    // viewNode.data = data
}

function selectElements(viewBranch: ViewBranch, dataBranch: DataBranch) {
    if (viewBranch.ul) return

    viewBranch.ul = treeBlock.querySelector(`ul[data-path="${dataBranch.name}"]`)

    viewBranch.store = new DocumentFragment()

    // const shootEls = viewBranch.ul.querySelectorAll(
    //     `.shoot[data-path="${dataBranch.name}"]`
    // ) as NodeListOf<HTMLDivElement>

    // shootEls.forEach(shoot => {
    //     const node = viewBranch.viewNodesIndex.get(shoot.dataset.name)
    //     if (node) {
    //         node.shoot = shoot
    //         viewBranch.viewNodesIndex.set(shoot.dataset.name, node)
    //     } else if (shoot.classList.contains("t_filt")) {
    //         viewBranch.hiddenSummary.shoot = shoot
    //     } else {
    //         console.warn("No node found for:", shoot.dataset.name)
    //     }
    // })

    for (let i = 0; i < viewBranch.ul.children.length - 2; i++) {
        const shoot = viewBranch.ul.children[i].children[0] as HTMLDivElement
        // console.log(shoot)
        const node = viewBranch.viewNodesIndex.get(shoot.dataset.name)
        if (node) {
            node.shoot = shoot
            viewBranch.viewNodesIndex.set(shoot.dataset.name, node)
        } else {
            console.warn("No node found for:", shoot.dataset.name)
        }
    }

    viewBranch.hiddenSummary.shoot = viewBranch.ul.children[viewBranch.ul.children.length - 2]
        .children[0] as HTMLDivElement
}

function updateHidden(branch: ViewBranch, filtered: DataBranch) {
    if (branch.hiddenItems !== filtered.hiddenItems) {
        branch.hiddenItems = filtered.hiddenItems
        branch.hiddenSize = filtered.hiddenSize // no need to check
        if (!branch.hiddenItems) {
            branch.hiddenSummary.shoot.hidden = true
            return
        }

        branch.hiddenSummary.shoot.hidden = false

        resetShoot(branch.hiddenSummary, {
            name: genFilteredOutName(branch.hiddenItems),
            type: "_filt",
            size: branch.hiddenSize,
            temp: 0
        } as DataNode)
    } else if (branch.hiddenSize !== filtered.hiddenSize) {
        branch.hiddenSize = filtered.hiddenSize

        updateShootSize(branch.hiddenSummary, {
            size: branch.hiddenSize,
            temp: 0
        } as DataNode)
    }
}

export function updateBranch(inputData: DataBranch, newData = true) {
    if (!inputData?.content) return

    console.log("branch update:", inputData)

    const branch = branches[inputData.name]
    // console.log("branch:", branch)

    const filtered = filterBranchCont(inputData)
    branch.filtered = filtered.content
    let actual = filtered.content

    if (newData) {
        branch.size = inputData.size
        branch.data = inputData.content
        setMax(inputData)
    }

    selectElements(branch, inputData)

    branch.ul.style.display = "none"

    const showMoreLi = branch.ul.lastElementChild as HTMLElement
    if (inputData.contentCount) {
        showMoreLi.hidden = false
        const soFar = showMoreLi.querySelector(".so-far")
        soFar.textContent = `${filtered.content.length}/${inputData.contentCount}`
    } else {
        showMoreLi.hidden = true
    }

    updateHidden(branch, filtered)

    // if (branch.viewNodesIndex.size < actual.length) {
    //     const lis = [] as string[]
    //     for (const n of actual) {
    //         if (!branch.viewNodesIndex.has(n.name)) {
    //             // newNodes.push(n)
    //             branch.viewNodesIndex.set(n.name, { data: n })
    //             lis.push(createLi(n, branch.ul.dataset.path, rootPath))
    //         }
    //     }
    //     // console.log(branch.ul.children[branch.ul.children.length - 3])
    //     // console.log(branch.hiddenSummary.shoot.closest("li"))
    //     // branch.hiddenSummary.shoot.closest("li").insertAdjacentHTML("beforebegin", lis.join(""))
    //     branch.ul.children[branch.ul.children.length - 3].insertAdjacentHTML(
    //         "afterend",
    //         lis.join("")
    //     )
    // }

    // create new lis
    let lastLiIdx = branch.ul.children.length - 2
    const fragment = new DocumentFragment()
    for (let i = lastLiIdx; i < branch.filtered.length; i++) {
        const data = branch.filtered[i]
        const { li, viewNode } = createLi2(data, inputData.name)
        // branch.ul.children[lastLiIdx++].before(li)
        fragment.appendChild(li)
        branch.viewNodesIndex.set(data.name, viewNode)
    }
    branch.ul.children[lastLiIdx].before(fragment)

    // const store = new DocumentFragment()
    // update exhisting shoots
    // limit traversal!
    branch.filtered.forEach((data, i) => {
        const found = branch.viewNodesIndex.get(data.name)
        if (!found) return

        if (!found.shoot) {
            found.shoot = branch.ul.querySelector(
                `.shoot[data-name="${data.name}"]`
            ) as HTMLDivElement

            // there is the data node but not the shoot... for some reason...
            // STILL HAPPENS???
            if (!found.shoot) {
                branch.viewNodesIndex.delete(data.name)
                return
            }
        }
        const liContShoot = branch.ul.children[i].children[0]

        // if li does not contain the shoot we need
        if (liContShoot !== found.shoot) {
            // if it contains wrong one - pull it out
            // if (liContShoot instanceof HTMLDivElement) store.appendChild(liContShoot)
            if (liContShoot instanceof HTMLDivElement) branch.store.appendChild(liContShoot)
            // add the right one
            branch.ul.children[i].appendChild(found.shoot)
            // console.log("moved", data.name)
            console.log("moved")
        }

        updateShootSize(found, data)
        updateLocked(found, data)
        found.data = data
    })

    // reset shoots
    // limit traversal!
    actual.forEach((data, i) => {
        if (branch.viewNodesIndex.has(data.name)) return
        let shootEl = branch.ul.children[i].children[0] as HTMLDivElement
        if (!shootEl) {
            // shootEl = store.firstElementChild as HTMLDivElement
            shootEl = branch.store.firstElementChild as HTMLDivElement
            branch.ul.children[i].appendChild(shootEl)
        }

        let viewNode = branch.viewNodesIndex.get(shootEl.dataset.name)
        if (viewNode) {
            branch.viewNodesIndex.delete(shootEl.dataset.name)
        } else {
            console.warn("No node found for:", shootEl.dataset.name)
            // yes, no real data for reset to work!
            viewNode = { data: {} as DataNode, shoot: shootEl }
        }
        branch.viewNodesIndex.set(data.name, viewNode)

        resetShoot(viewNode, data)
        console.log("reset")
    })

    // remove shoots
    for (let i = actual.length; i < branch.ul.children.length - 2; i++) {
        const liContShoot = branch.ul.children[i].children[0]
        // if (liContShoot instanceof HTMLDivElement) store.appendChild(liContShoot)
        if (liContShoot instanceof HTMLDivElement) branch.store.appendChild(liContShoot)
    }

    branch.ul.style.display = ""
    // console.log(store.children)
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

    // console.log(createLi2(data.content[0]))
}

export function simulateScan() {
    updateTreeRoot({ name: "", size: 0, temp: 1 } as DataBranch)
}

export function resetTree() {
    branches = {}
    treeBlock.innerHTML = ""
    max = 1
    updateTreeRoot({ name: "", size: -7 } as DataBranch)
    totalSize.title = ""
    totalSize.textContent = ""
}
