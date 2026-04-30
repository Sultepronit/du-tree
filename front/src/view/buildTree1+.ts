import doFetch0, { doFetch } from "../api/fetch"
import { pathInpunt } from "../global/pathInput"
import handleBytes from "../helpers/handleBytes"
import timePromise from "../helpers/timePromise"
import type { Branch, Node } from "../types"

const totalSize = document.getElementById("root") as HTMLDivElement
const treeBlock = document.getElementById("tree")!

let tree = null as Node
const branches = [] as Branch[]

let max = -1

const calcBarWidth = (size: number) => `${((size / max) * 100).toFixed(2)}%`

const displaySize = (node: Node) => `${node.sizeIsTemp ? "~" : ""}${handleBytes(node.size)}`

function createLi(node: Node, prePath = ""): string {
    // console.log(prePath)
    let content = ""
    // if (data.hasContent) {
    if (node.type[0] === "d") {
        // const path = pathprePath ? `${prePath}/${node.name}` : node.name
        // content = `data-path="${prePath + node.name}/"`
        content = `data-path="${prePath}" data-dirname="${node.name}"`
    }
    // console.log(data.size / max * 100);
    return `<li class="${content ? "nested" : ""}" data-size="${node.size}">
        <div class="fd-entry" title="path: ${prePath || "root"}\nname: ${node.name}">
            <div
                class="fd-vizual-size"
                style="width: ${calcBarWidth(node.size)}"
                data-size="${node.size}"
            ></div>
            <div class="fd-size ${content ? "interactive" : ""}" ${content}>
                ${displaySize(node)}
            </div>
            <div class="fd-name">${node.name}</div>
        </div>
    </li>`
}

function updateBranches() {
    branches.sort((a, b) => a.path.length - b.path.length)
    const rev = [...branches].reverse()
    for (const b of rev) {
        console.log(b.path)
        // if (b.node.tempSize < b.node.size) continue
        const tempSize = b.node.content.reduce((sum, entry) => sum + entry.size, 0)
        console.log(b.node.size, tempSize)
        if (b.node.size === tempSize) continue

        b.node.size = tempSize
        // const newVal = `~${handleBytes(tempSize)}`
        const newVal = displaySize(b.node)
        if (b.sizeDisplay.textContent !== newVal) b.sizeDisplay.textContent = newVal
        if (b.nodeView) {
            const str = tempSize.toString()
            b.nodeView.dataset.size = str
            b.vizualSizeDisplay.dataset.size = str
        }
    }
    console.log(branches)

    const mainBranchCont = branches[0].node.content
    mainBranchCont.sort((a, b) => b.size - a.size)
    console.log(mainBranchCont)
    if (mainBranchCont[0].size > max) {
        max = mainBranchCont[0].size
    }
    reDrawVisualSize()

    const branchViews = treeBlock.querySelectorAll("ul.dir-content")
    console.log(branchViews)
    for (const bv of branchViews) {
        const nodeViews = [...bv.children] as HTMLLIElement[]
        nodeViews.sort((a, b) => Number(b.dataset.size) - Number(a.dataset.size))
        console.log(nodeViews)
        // console.log(nodeViews[0].dataset)
        const fragment = document.createDocumentFragment()
        nodeViews.forEach(e => fragment.appendChild(e))
        bv.appendChild(fragment)
    }
}

function createBranch(
    node: Node,
    prePath: string,
    sizeDisplay: HTMLDivElement,
    nodeView = null as HTMLLIElement,
    vizualSizeDisplay = null as HTMLDivElement
): string {
    const path = prePath ? `${prePath}/${node.name}` : node.name
    branches.push({
        path,
        node,
        sizeDisplay,
        nodeView,
        vizualSizeDisplay
    })

    node.content.sort((a, b) => b.size - a.size)

    updateBranches()

    // const lis = node.content.map(entry => createLi(entry, prePath)).join("")
    const lis = node.content.map(entry => createLi(entry, path)).join("")
    return `<ul class="dir-content">${lis}</ul>`
}

function reDrawVisualSize() {
    const bars = document.querySelectorAll(".fd-vizual-size") as NodeListOf<HTMLDivElement>
    // console.log(bars)
    bars.forEach(bar => {
        const width = calcBarWidth(Number(bar.dataset.size))
        if (bar.style.width !== width) bar.style.width = width
    })
}

export async function initTree() {
    const path = pathInpunt.value
    tree = {
        // name: path,
        name: "",
        type: "d",
        size: 0,
        sizeIsTemp: true
    }
    // const data = await doFetch("/dir", { path })
    const data = await doFetch("/dir", { path, initDu: true })

    const t = setInterval(async () => {
        const update = await doFetch("/update")
        console.log(update)
        if (!update.sizeIsTemp) clearInterval(t)
        // tree.content = update
        tree = update
        treeBlock.innerHTML = createBranch(tree, "", totalSize)
    }, 1000)
    // console.log(data)
    tree.content = data
    console.log(tree)
    // buildGradually({ content: data })
    treeBlock.innerHTML = createBranch(tree, "", totalSize)
}

treeBlock.addEventListener("click", async e => {
    const target = e.target as HTMLDivElement
    console.log(target)
    const dataset = target?.dataset
    if (!dataset?.dirname) return

    const li = target.closest("li")
    // if (e.target?.classList.contains('fd-size')) {
    if (!dataset.active) {
        const parentNode = branches.find(b => b.path === dataset.path).node
        // console.log(parentNode)
        const node = parentNode.content.find(n => n.name === dataset.dirname)
        // console.log(node)
        const prePath = dataset.path ? `${pathInpunt.value}${dataset.path}/` : pathInpunt.value
        const fullPath = prePath + dataset.dirname
        // const path = target.dataset.path
        console.log(fullPath)
        // const data = await doFetch("/dir", { path })
        node.content = await doFetch("/dir", { path: fullPath })
        // console.log(data)
        console.log(node)
        // const html = createBranch(node, path)
        const html = createBranch(
            node,
            dataset.path,
            li.querySelector(".fd-size"),
            li,
            li.querySelector(".fd-vizual-size")
        )

        li.insertAdjacentHTML("beforeend", html)
        // target.dataset.path = ""
        // delete target.dataset.path
        dataset.active = "true"
        dataset.unfolded = "true"
        // } else if (e.dataset?.unfolded) {
    } else {
        // const li = target.closest("li")!
        // console.log(li);
        const unfolded = JSON.parse(dataset.unfolded as string)
        dataset.unfolded = JSON.stringify(!unfolded)
        // console.log(unfolded);
        li.querySelector<HTMLDivElement>(".dir-content")!.hidden = unfolded
    }
})
