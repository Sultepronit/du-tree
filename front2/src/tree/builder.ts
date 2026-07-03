import handleBytes from "../helpers/handleBytes"
import type { DataNode, ElNode, UpdateBranch } from "../types"

const totalSize = document.getElementById("total-size") as HTMLDivElement
const totalLocked = document.getElementById("lock-widget") as HTMLDivElement
const statePannel = totalSize.parentElement
const treeBlock = document.getElementById("tree")!

const pageSize = 100

let max = 1

let canceled = false

let branches2 = {} as Record<string, UpdateBranch>

let rootPath = ""

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

function genTitle(data: DataNode, path: string) {
    const title = [`Path: ${rootPath}${path}`, `Name: ${data.name}`]
    if (data.linkPath) {
        title.push(`${data.type === "Lbrk" ? "Broken link to:" : "Link to:"} ${data.linkPath}`)
    } else if (data.locked) {
        title.push(...genLockedDetails(data))
    }
    if (data.nlink) {
        title.push(
            ` Shared inode: ${data.nlink} hard links exist.\n Size counted once to reflect actual disk usage.`
        )
    }
    return title.join("\n")
}

function createLi(data: DataNode, path: string): string {
    const classes = [`shoot t${data.type}`]
    if (data.locked) {
        classes.push("locked")
        if (data.locked === -1) classes.push("itself")
    }
    if (data.sizeIsTemp) classes.push("temp")
    if (data.nlink) classes.push("hardlink")

    // <div class="fd-type t${data.type}"></div>
    // <div class="fd-details"></div>
    return `<li><div
            class="${classes.join(" ")}"
            data-path="${path}" 
            data-name="${data.name}"
            style="--size: ${data.size}%"
        >
            <div class="fd-entry" title="${genTitle(data, path)}">
                <div class="fd-sizebar"></div>
                <div class="fd-size" title="${data.size} B">${handleBytes(data.size)}</div>
                <div class="fd-name">${data.name}</div>
            </div>
    </div></li>`
}

export function createBranch(data: DataNode, prePath: string): DocumentFragment {
    // if (!node.content) return
    if (!data.content) {
        const templ = document.createElement("template")
        templ.innerHTML = `<ul class="dir-content"></ul>`

        return templ.content
    }
    const path = prePath ? `${prePath}/${data.name}` : data.name

    if (data.content[0].size > max) {
        max = data.content[0].size
        document.documentElement.style.setProperty("--max-size", (max / 100).toString())
    }

    if (data.sizeIsTemp || data.contentCount) {
        branches2[path] = {
            dataShoots: new Map(data.content.map(s => [s.name, s])),
            pages: 1
        }
        console.log("branches2", branches2)
    }

    const lis = data.content.map(entry => createLi(entry, path))
    if (data.contentCount) {
        lis.push(`<li class="fd-more" title="${path ? path + "/" : "Root"}">
            <span class="so-far">${data.content.length}</span>/${data.contentCount}
            <button name="add-more" data-path="${path}" data-pages="1">
                Show more
            </button>
        </li>`)
    }
    const templ = document.createElement("template")
    // console.log(templ)
    templ.innerHTML = `<ul class="dir-content" data-path="${path}">${lis.join("")}</ul>`

    return templ.content
}

export function appendBranch(data: DataNode, button: HTMLButtonElement, pages: number) {
    const oldNodesCount = (pages - 1) * pageSize
    const newNodes = data.content.slice(oldNodesCount)
    console.log(oldNodesCount, newNodes)

    const shortPath = button.dataset.path
    const lis = newNodes.map(entry => createLi(entry, shortPath))

    const li = button.closest("li") as HTMLLIElement

    data.name = shortPath
    updateBranch(data) // update old pages
    li.insertAdjacentHTML("beforebegin", lis.join("")) // add new one
    // if (branches2[shortPath]) branches2[shortPath].pages = pages // for next updates
    const branch = branches2[shortPath]
    if (branch) {
        branch.pages = pages // for next updates
        newNodes.forEach(d => branch.dataShoots.set(d.name, d))
    }

    if (!data.contentCount) {
        li.remove()
        return
    }
    button.dataset.pages = pages.toString()
    const soFar = li.querySelector(".so-far")
    soFar.textContent = (pages * pageSize).toString()
}

function updateLocked(elNode: ElNode, oldD: DataNode, newD: DataNode) {
    if (oldD.locked === newD.locked) return
    if (!elNode.entry) elNode.entry = elNode.shoot.querySelector(".fd-entry")

    elNode.shoot.classList.add("locked")
    const details = genLockedDetails(newD).join("\n")
    if (newD.locked === -1) {
        elNode.shoot.classList.add("itself")
        elNode.entry.title += "\n" + details
    } else {
        elNode.entry.title = genTitle(newD, elNode.shoot.dataset.path)
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

function resetTitle(elNode: ElNode, data: DataNode) {
    if (!elNode.entry) elNode.entry = elNode.shoot.querySelector(".fd-entry")
    elNode.entry.title = genTitle(data, elNode.shoot.dataset.path)
}

function resetShoot(elNode: ElNode, data: DataNode) {
    delete elNode.shoot.dataset.nested
    // delete elNode.shoot.dataset.unfolded
    // elNode.shoot.className = "shoot"
    elNode.shoot.querySelector("ul")?.remove() // remove the branch too?

    const classes = [`shoot t${data.type}`]
    if (data.locked) {
        classes.push("locked")
        if (data.locked === -1) classes.push("itself")
    } else if (data.nlink) classes.push("hardlink")
    elNode.shoot.className = classes.join(" ")

    elNode.shoot.dataset.name = data.name
    elNode.shoot.querySelector(".fd-name").textContent = data.name
    // elNode.shoot.querySelector(".fd-type").className = `fd-type t${data.type}`

    updateShootSize(elNode, null, data)
    resetTitle(elNode, data)
}

async function updateBranch(branchUpdate: DataNode) {
    if (!branchUpdate?.content) return // user navigates dirs before scan

    console.log("branch update:", branchUpdate)

    const branch = branches2[branchUpdate.name]
    console.log("branch:", branch)

    const mix = new Map(branch.dataShoots)
    branchUpdate.content.forEach(s => mix.set(s.name, s))

    const count = pageSize * branch.pages
    // const actual = [...mix.values()].sort((a, b) => b.size - a.size).slice(0, count)
    const actual = [...mix.values()]
        .sort((a, b) => {
            if (b.size === a.size) {
                return a.name.localeCompare(b.name)
            }
            return b.size - a.size
        })
        .slice(0, count)
    console.log("actual", actual)

    if (branchUpdate.name === "") {
        if (actual[0].size != max) {
            // if (actual[0].size > max) { // works bad if recalculation gives less sum
            max = actual[0].size
            document.documentElement.style.setProperty("--max-size", (max / 100).toString())
        }
    }

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

    // branch.ul.style.display = "none"
    const store = new DocumentFragment()
    // update exhisting shoots
    actual.forEach((data, i) => {
        const old = branch.dataShoots.get(data.name)
        if (old) {
            // debug!
            // if (!branch.elNodes.get(data.name)) {
            //     console.log(data)
            // }
            let elNode = branch.elShoots.get(data.name)
            if (!elNode) {
                const shoot = branch.ul.querySelector(
                    `.shoot[data-name="${data.name}"]`
                ) as HTMLDivElement
                // console.log(shoot)

                // there is the data node but not the shoot... for some reason...
                if (!shoot) {
                    branch.dataShoots.delete(data.name)
                    return
                }

                elNode = { shoot }
                branch.elShoots.set(data.name, elNode)
            }
            const shootEl = elNode.shoot
            const liCont = branch.ul.childNodes[i].childNodes[0]

            // if li does not contain the shoot we need
            if (liCont !== shootEl) {
                // if it contains wrong one - pull it out
                if (liCont instanceof HTMLDivElement) store.appendChild(liCont)
                // add the right one
                // console.log(elNode)
                // console.log(i, branch.ul.childNodes[i], shootEl)
                branch.ul.childNodes[i].appendChild(shootEl)
                // console.log("moved", data.name)
                console.log("moved")
            }

            updateShootSize(elNode, old, data)
            updateLocked(elNode, old, data)
        }
    })
    // console.log(store.childNodes)
    // reset shoots
    actual.forEach((data, i) => {
        if (!branch.dataShoots.has(data.name)) {
            // console.log("reset:", data.name)
            let shootEl = branch.ul.childNodes[i].childNodes[0] as HTMLElement
            if (!shootEl) {
                shootEl = store.firstElementChild as HTMLDivElement
                branch.ul.childNodes[i].appendChild(shootEl)
            }
            const elNode =
                branch.elShoots.get(shootEl.dataset.name) ||
                ({
                    shoot: shootEl
                } as ElNode)
            branch.elShoots.delete(shootEl.dataset.name)
            branch.elShoots.set(data.name, elNode)

            resetShoot(elNode, data)
            console.log("reset")
        }
    })
    // branch.ul.style.display = ""
    // console.log(store.childNodes)

    branch.dataShoots =
        mix.size === branch.dataShoots.size ? mix : new Map(actual.map(s => [s.name, s]))
}

export function updateTree(bNodes: DataNode[]) {
    updateTreeRoot(bNodes[0])
    if (!bNodes[0].content) return

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
        totalSizeVal = data.size
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

export async function rebuildTree(data: DataNode, path: string) {
    rootPath = path

    removeCanceled()
    treeBlock.innerHTML = ""
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
