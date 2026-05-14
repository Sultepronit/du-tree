import { doFetch } from "../api/fetch"
import { pathInpunt } from "../global/pathInput"
import handleBytes from "../helpers/handleBytes"
import type { Branch, Node } from "../types"

const totalSize = document.getElementById("root") as HTMLDivElement
const treeBlock = document.getElementById("tree")!

const branches = {} as Record<string, Branch>

let max = 1

function createLi(node: Node, prePath: string): string {
    return `<li><div
            class="shoot"
            data-path="${prePath}" 
            ${node.type[0] === "d" ? 'data-dirname="' + node.name + '"' : ""}
            data-size="${node.size}"
            style="--size: ${node.size}%"
        >
            <div
                class="fd-entry"
                title="path: ${prePath ? prePath + "/" : "root"}\nname: ${node.name}"
            >
                <div class="fd-type t${node.type[0]}"></div>
                <div class="fd-details">
                    <div class="fd-vizual-size"></div>
                    <div
                        class="fd-size ${node.sizeIsTemp ? "temp" : ""}"
                        title="${node.size} B"
                    >
                        ${handleBytes(node.size)}
                    </div>
                    <div class="fd-name">${node.name}</div>
                </div>
                
            </div>
    </div></li>`
}

function createBranch(node: Node, prePath: string): DocumentFragment {
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

function updateSize(node: Node, display: HTMLDivElement) {
    if (!display.classList.contains("temp") && !node.sizeIsTemp) return false

    if (node.sizeIsTemp) display.classList.add("temp")
    else display.classList.remove("temp")

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

        console.log(branch.ul.childNodes)

        const lis = branch.ul.querySelectorAll(
            // `li[data-path="${bNode.name}"]`
            `.shoot[data-path="${bNode.name}"]`
        ) as NodeListOf<HTMLLIElement>
        console.log(lis)
        lis.forEach((li, i) => {
            branch.shoots[li.dataset.dirname || i] = { li }
        })
        branches[bNode.name] = branch
    }
    const branch = branches[bNode.name]
    console.log(branch)
    for (const cNode of bNode.content) {
        // console.log(cNode)
        const shoot = branch.shoots[cNode.name]
        // console.log(shoot)

        if (!shoot.sizeDisplay) shoot.sizeDisplay = shoot.li.querySelector(".fd-size")
        const updated = updateSize(cNode, shoot.sizeDisplay)
        console.log(updated)
        if (!updated) continue

        const sizeStr = cNode.size.toString()
        if (sizeStr !== shoot.li.dataset.size) {
            shoot.li.dataset.size = sizeStr
            shoot.li.style.setProperty("--size", `${sizeStr}%`)
        }
    }

    const shoots = Object.values(branch.shoots)

    shoots.sort((a, b) => Number(b.li.dataset.size) - Number(a.li.dataset.size))
    console.log(shoots)

    // const fragment = document.createDocumentFragment()
    // shoots.forEach(e => fragment.appendChild(e.li))
    // branch.ul.appendChild(fragment)
    // console.log(branch)
    shoots.forEach((shoot, i) => {
        if (branch.ul.childNodes[i].childNodes[0] !== shoot.li) {
            branch.ul.childNodes[i].appendChild(shoot.li)
            // console.log("moved", shoot.li)
            console.log("moved")
        }
    })
}

function updateTree(bNodes: Node[]) {
    const root = bNodes[0]
    // totalSize.textContent = formatSize(root)
    console.log(root, totalSize)
    updateSize(root, totalSize)
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

export async function initTree() {
    console.time("t1")
    const path = pathInpunt.value

    const data = (await doFetch("/dir", {
        path,
        initDu: true,
        command: ["du", "-b", "--exclude=/proc", path]
        // command: ["du", "-B 1", "--exclude=/proc", path]
        // command: ["du", "-b", "--exclude=/proc", "d 5", path]
    })) as Node
    // const data = (await doFetch("/dir", { path, initDu: true })) as Node[]

    const t = setInterval(async () => {
        const update = await doFetch("/update")
        console.log(update)
        if (!update[0].sizeIsTemp) {
            clearInterval(t)
            console.timeEnd("t1")
        }
        updateTree(update)
    }, 1000)

    console.log(data)
    // totalSize.textContent = formatSize(data)
    updateSize(data, totalSize)
    // totalSize.textContent = formatSize(tree)
    // tree.content = data
    // console.log(tree)
    // buildGradually({ content: data })
    // treeBlock.innerHTML = createBranch(tree, "", totalSize)
    // treeBlock.appendChild(createBranch(tree, ""))
    treeBlock.appendChild(createBranch(data, ""))
}

treeBlock.addEventListener("click", async e => {
    const target = e.target as HTMLDivElement
    console.log(target)
    // if (!target.classList.contains("interactive")) return
    if (!target.classList.contains("td")) return
    const shoot = target.closest("div.shoot") as HTMLDivElement
    // const dataset = target?.dataset
    const dataset = shoot?.dataset

    if (!dataset.nested) {
        const prePath = dataset.path ? `${pathInpunt.value}${dataset.path}/` : pathInpunt.value
        const fullPath = prePath + dataset.dirname
        // const path = target.dataset.path
        console.log(fullPath)
        const data = await doFetch("/dir", { path: fullPath })
        // node.content = await doFetch("/dir", { path: fullPath })
        console.log(data)
        const branch = createBranch(data, dataset.path)
        if (branch) shoot.appendChild(branch)
        dataset.nested = "true"
        dataset.unfolded = "true"
        target.classList.add("unfold")
    } else {
        target.classList.toggle("unfold")
        shoot.querySelector<HTMLDivElement>(".dir-content")!.hidden =
            !target.classList.contains("unfold")
    }
})
