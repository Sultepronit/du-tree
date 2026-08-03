import formatSize from "../utils/formatSize"
import type { DataNode, ViewNode, UpdateBranch } from "../types"

const totalSize = document.getElementById("total-size") as HTMLDivElement
const totalLocked = document.getElementById("lock-widget") as HTMLDivElement
const statePannel = totalSize.parentElement
const treeBlock = document.getElementById("tree")!

const pageSize = 100

let max = 1

let canceled = false

let branches2 = {} as Record<string, UpdateBranch>

let rootPath = ""

document.addEventListener("mode", (e: CustomEvent) => {
    if (e.detail === "results") {
        treeBlock.style.opacity = "1"
        statePannel.style.opacity = "1"
    } else if (e.detail === "preparations") {
        treeBlock.style.opacity = "0.5"
        statePannel.style.opacity = "0.5"
    }
})

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

const specialTypes = {
    S: "Socket",
    p: "Pipe",
    D: "Device"
}

function genTitle(data: DataNode, path: string) {
    const title = [`Path: ${rootPath}${path}`, `Name: ${data.name}`]

    const t = data.type[0] === "L" ? data.type.slice(1) : data.type
    const st = specialTypes[t]
    if (st) title.push(`File type: ${st}`)

    if (data.linkPath) {
        title.push(
            data.type === "Lbrk"
                ? `Broken soft link to: ${data.linkPath}`
                : data.type === "Lperm-file"
                  ? `Soft link (Target hidden: permission denied).`
                  : data.type === "Lperm-target"
                    ? `Soft link to: ${data.linkPath} (Target inaccessible: permission denied).`
                    : `Soft link to: ${data.linkPath}`
        )
    } else if (data.locked) {
        title.push(...genLockedDetails(data))
    }

    if (data.nlink) {
        let msg = ` Shared inode: ${data.nlink} hard links exist.\n `
        if (data.isNeglected) {
            msg += "Size of this hard link is neglected."
        } else {
            msg += "Size of this hard link is counted, all others are neglected."
        }
        title.push(
            // ` Shared inode: ${data.nlink} hard links exist.\n Size counted once to reflect actual disk usage.`
            msg
        )
    }

    return title.join("\n")
}

const handleBytesExt = (data: DataNode) => {
    return formatSize(data.size, data.temp > 0 || data.locked !== undefined)
}

function createLi(data: DataNode, path: string): string {
    const type = data.type[0] === "L" ? `link t${data.type.slice(1)}` : `t${data.type}`

    const classes = [`shoot ${type}`]
    if (data.locked) {
        classes.push("locked")
        if (data.locked === -1) classes.push("itself")
    }
    if (data.temp) {
        classes.push("temp")
        if (data.temp === 2) classes.push("unavailable")
    }
    if (data.nlink) {
        classes.push("hardlink")
        if (data.isNeglected) classes.push("neglected")
    }

    return `<li><div
            class="${classes.join(" ")}"
            title="${genTitle(data, path)}"
            data-path="${path}" 
            data-name="${data.name}"
            style="--size: ${data.size}%"
        >
            <div class="fd-entry">
                <div class="fd-sizebar"></div>
                <div class="fd-size" title="${data.size} B">${handleBytesExt(data)}</div>
                <div class="fd-name">${data.name}</div>
            </div>
    </div></li>`
}

export function createBranch(data: DataNode, prePath: string): DocumentFragment {
    // if (!node.content) return
    if (!data?.content) {
        const templ = document.createElement("template")
        templ.innerHTML = `<ul class="dir-content"></ul>`

        return templ.content
    }
    const path = prePath ? `${prePath}/${data.name}` : data.name

    if (data.content[0].size > max) {
        max = data.content[0].size
        document.documentElement.style.setProperty("--max-size", (max / 100).toString())
    }

    if (data.temp || data.contentCount) {
        branches2[path] = {
            dataShoots: new Map(data.content.map(s => [s.name, s])),
            pages: 1
        }
        // console.log("branches2", branches2)
    }

    const lis = data.content.map(entry => createLi(entry, path))
    if (data.contentCount) {
        // lis.push(`<li class="show-more" title="${path ? path + "/" : "Root"}">
        lis.push(`<li class="show-more">
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
    // console.log(oldNodesCount, newNodes)

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

function updateLocked(elNode: ViewNode, oldD: DataNode, newD: DataNode) {
    if (oldD.locked === newD.locked) return

    elNode.shoot.classList.add("locked")
    const details = genLockedDetails(newD).join("\n")
    if (newD.locked === -1) {
        elNode.shoot.classList.add("itself")
        elNode.shoot.title += "\n" + details
    } else {
        elNode.shoot.title = genTitle(newD, elNode.shoot.dataset.path)
    }
}

function updateShootSize(viewNode: ViewNode, oldD: DataNode | null, newD: DataNode) {
    if (oldD?.size !== newD.size) {
        viewNode.shoot.style.setProperty("--size", `${newD.size}%`)
        if (!viewNode.size) viewNode.size = viewNode.shoot.querySelector(".fd-size")
        viewNode.size.textContent = handleBytesExt(newD)
        viewNode.size.title = `${newD.size} B`
    } else if (oldD?.temp !== newD.temp || oldD?.locked !== newD.locked) {
        if (!viewNode.size) viewNode.size = viewNode.shoot.querySelector(".fd-size")
        viewNode.size.textContent = handleBytesExt(newD)
    }

    if (newD.temp) {
        viewNode.shoot.classList.add("temp")
        if (newD.temp === 2) {
            viewNode.shoot.classList.add("unavailable")
        } else {
            viewNode.shoot.classList.remove("unavailable")
        }
    } else {
        viewNode.shoot.classList.remove("temp", "unavailable")
    }
}

// function resetTitle(elNode: ViewNode, data: DataNode) {
//     elNode.shoot.title = genTitle(data, elNode.shoot.dataset.path)
// }

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
    viewNode.shoot.querySelector(".fd-name").textContent = data.name

    updateShootSize(viewNode, null, data)
    // resetTitle(viewNode, data)
    viewNode.shoot.title = genTitle(data, viewNode.shoot.dataset.path)
}

// async function updateBranch(branchUpdate: DataNode) {
function updateBranch(branchUpdate: DataNode) {
    if (!branchUpdate?.content) return // user navigates dirs before scan

    console.log("branch update:", branchUpdate)

    const branch = branches2[branchUpdate.name]
    // console.log("branch:", branch)

    const mix = new Map(branch.dataShoots)
    branchUpdate.content.forEach(s => mix.set(s.name, s))

    const actual = [...mix.values()]
        .sort((a, b) => {
            if (b.size === a.size) {
                return a.name.localeCompare(b.name)
            }
            return b.size - a.size
        })
        .slice(0, pageSize * branch.pages)
    // console.log("actual", actual)

    if (branchUpdate.name === "") {
        if (actual[0].size != max) {
            // if (actual[0].size > max) { // works bad if recalculation gives less sum
            max = actual[0].size
            document.documentElement.style.setProperty("--max-size", (max / 100).toString())
        }
    }

    if (!branch.ul) {
        branch.ul = treeBlock.querySelector(`ul[data-path="${branchUpdate.name}"]`)
        branch.viewShoots = new Map()

        const shootEls = branch.ul.querySelectorAll(
            `.shoot[data-path="${branchUpdate.name}"]`
        ) as NodeListOf<HTMLDivElement>
        // console.log(shootEls)
        shootEls.forEach(shoot => {
            branch.viewShoots.set(shoot.dataset.name, { shoot })
        })
    }

    branch.ul.style.display = "none"

    if (branch.viewShoots.size < actual.length) {
        const newNodes = actual.filter(s => !branch.dataShoots.has(s.name))
        console.log(newNodes)

        newNodes.forEach(n => branch.dataShoots.set(n.name, n))

        const lis = newNodes.map(entry => createLi(entry, branch.ul.dataset.path))
        console.log(lis)
        branch.ul.insertAdjacentHTML("beforeend", lis.join(""))
    }

    const store = new DocumentFragment()
    // update exhisting shoots
    actual.forEach((data, i) => {
        const old = branch.dataShoots.get(data.name)
        if (old) {
            // debug!
            // if (!branch.elNodes.get(data.name)) {
            //     console.log(data)
            // }
            let viewNode = branch.viewShoots.get(data.name)
            if (!viewNode) {
                const shoot = branch.ul.querySelector(
                    `.shoot[data-name="${data.name}"]`
                ) as HTMLDivElement
                // console.log(shoot)

                // there is the data node but not the shoot... for some reason...
                if (!shoot) {
                    branch.dataShoots.delete(data.name)
                    return
                }

                viewNode = { shoot }
                branch.viewShoots.set(data.name, viewNode)
            }
            const shootEl = viewNode.shoot
            const liCont = branch.ul.childNodes[i].childNodes[0]

            // if li does not contain the shoot we need
            if (liCont !== shootEl) {
                // if it contains wrong one - pull it out
                if (liCont instanceof HTMLDivElement) store.appendChild(liCont)
                // add the right one
                branch.ul.childNodes[i].appendChild(shootEl)
                // console.log("moved", data.name)
                console.log("moved")
            }

            updateShootSize(viewNode, old, data)
            updateLocked(viewNode, old, data)
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
                branch.viewShoots.get(shootEl.dataset.name) ||
                ({
                    shoot: shootEl
                } as ViewNode)
            branch.viewShoots.delete(shootEl.dataset.name)
            branch.viewShoots.set(data.name, elNode)

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
    updateTreeRoot(bNodes[0])
    if (!bNodes[0].content) return

    for (const b of bNodes) {
        updateBranch(b)
    }
}

let totalSizeVal = -7
function updateTreeRoot(data: DataNode) {
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

export async function rebuildTree(data: DataNode, path: string) {
    rootPath = path

    removeCanceled()
    treeBlock.innerHTML = ""
    max = 1
    branches2 = {}
    totalSizeVal = -7

    updateTreeRoot(data)

    treeBlock.appendChild(createBranch(data, ""))
}

// move to controls?..
export function setCanceled() {
    canceled = true
    document.body.classList.add("canceled")
    statePannel.classList.remove("temp")

    // document.documentElement.style.setProperty("--temp-dir-icon", `url("icons/folder-x.svg")`)
    // document.documentElement.style.setProperty(
    //     "--unavailable-dir-icon",
    //     `url("icons/folder-x.svg")`
    // )
    // document.documentElement.style.setProperty("--unavailable-cursor", "not-allowed")
    // statePannel.classList.add("canceled")
}

export function removeCanceled() {
    if (!canceled) return
    canceled = false
    document.body.classList.remove("canceled")

    // document.documentElement.style.removeProperty("--temp-dir-icon")
    // document.documentElement.style.removeProperty("--unavailable-dir-icon")
    // document.documentElement.style.removeProperty("--unavailable-cursor")
    // statePannel.classList.remove("canceled")
}
