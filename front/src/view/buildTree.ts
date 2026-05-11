import { doFetch } from "../api/fetch"
import { pathInpunt } from "../global/pathInput"
import handleBytes from "../helpers/handleBytes"
import type { Branch4, Node } from "../types"

const totalSize = document.getElementById("root") as HTMLDivElement
const treeBlock = document.getElementById("tree")!

const branches = {} as Record<string, Branch4>

let max = 1

// const formatSize = (node: Node) => `${node.sizeIsTemp ? "~" : ""}${handleBytes(node.size)}`

function createLi(node: Node, prePath = ""): string {
    let dirDetails = ""
    if (node.type[0] === "d") {
        // const path = pathprePath ? `${prePath}/${node.name}` : node.name
        // content = `data-path="${prePath + node.name}/"`
        dirDetails = `data-path="${prePath}" data-dirname="${node.name}"`
    }
    // console.log(data.size / max * 100);
    return `<li
    style="--size: ${node.size}%"
      ${dirDetails}
      data-size="${node.size}"
    >
        <div
            class="fd-entry"
            title="path: ${prePath || "root"}\nname: ${node.name}"
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
    </li>`
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
    const b = `${node.size} B`
    const h = handleBytes(node.size)
    // const newVal = formatSize(node)
    // if (!node.sizeIsTemp && display.textContent !== newVal)
    //     console.log(display.textContent, newVal)
    if (display.title !== b) {
        display.title = b
        display.textContent = h

        if (node.sizeIsTemp) display.classList.add("temp")
        else display.classList.remove("temp")
        // if (!node.sizeIsTemp) display.classList.remove("temp")
    }
}

function updateBranch(bNode: Node) {
    if (!bNode.content) return

    console.log(bNode)
    if (!branches[bNode.name]) {
        const branch = {
            ul: treeBlock.querySelector(`ul[data-path="${bNode.name}"]`),
            shoots: {}
        } as Branch4

        const lis = branch.ul.querySelectorAll(`li`) as NodeListOf<HTMLLIElement>
        console.log(lis)
        lis.forEach((li, i) => {
            branch.shoots[li.dataset.dirname || i] = { size: 0, li }
        })
        branches[bNode.name] = branch
    }
    const branch = branches[bNode.name]
    console.log(branch)
    for (const cNode of bNode.content) {
        // console.log(cNode)
        const shoot = branch.shoots[cNode.name]
        // console.log(shoot)
        if (!shoot.text) shoot.text = shoot.li.querySelector(".fd-size")

        const sizeStr = cNode.size.toString()
        if (sizeStr !== shoot.li.dataset.size) {
            shoot.li.dataset.size = cNode.size.toString()
            shoot.li.style.setProperty("--size", `${cNode.size}%`)
        }

        updateSize(cNode, shoot.text)
    }

    const shoots = Object.values(branch.shoots)
    console.log(shoots)

    // shoots.sort((a, b) => Number(b.size) - Number(a.size))
    shoots.sort((a, b) => Number(b.li.dataset.size) - Number(a.li.dataset.size))

    const fragment = document.createDocumentFragment()
    shoots.forEach(e => fragment.appendChild(e.li))
    branch.ul.appendChild(fragment)
    console.log(branch)
}

function updateTree(bNodes: Node[]) {
    const root = bNodes[0]
    // totalSize.textContent = formatSize(root)
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
    // const tree = {
    //     // name: path,
    //     name: "",
    //     type: "d",
    //     size: 0,
    //     sizeIsTemp: true
    // } as Node

    const data = (await doFetch("/dir", {
        path,
        initDu: true,
        // command: ["du", "-b", "--exclude=/proc", path]
        command: ["du", "-B 1", "--exclude=/proc", path]
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
    const li = target.closest("li")
    // const dataset = target?.dataset
    const dataset = li?.dataset
    // if (!dataset?.dirname) return

    // if (e.target?.classList.contains('fd-size')) {
    if (!dataset.active) {
        // const parentNode = branches.find(b => b.path === dataset.path).node
        // console.log(parentNode)
        // const node = parentNode.content.find(n => n.name === dataset.dirname)
        // console.log(node)
        const prePath = dataset.path ? `${pathInpunt.value}${dataset.path}/` : pathInpunt.value
        const fullPath = prePath + dataset.dirname
        // const path = target.dataset.path
        console.log(fullPath)
        const data = await doFetch("/dir", { path: fullPath })
        // node.content = await doFetch("/dir", { path: fullPath })
        console.log(data)
        // const node = {
        //     name: dataset.dirname,
        //     type: "d",
        //     size: 0,
        //     content: data
        // }

        // li.insertAdjacentHTML("beforeend", html)
        const branch = createBranch(data, dataset.path)
        if (branch) li.appendChild(branch)
        // li.appendChild(createBranch(node, dataset.path))
        // target.dataset.path = ""
        // delete target.dataset.path
        dataset.active = "true"
        dataset.unfolded = "true"
        target.classList.add("unfold")
        // } else if (e.dataset?.unfolded) {
    } else {
        // const li = target.closest("li")!
        // console.log(li);
        // const unfolded = JSON.parse(dataset.unfolded as string)
        // dataset.unfolded = JSON.stringify(!unfolded)
        target.classList.toggle("unfold")
        // console.log(unfolded);
        // li.querySelector<HTMLDivElement>(".dir-content")!.hidden = unfolded
        li.querySelector<HTMLDivElement>(".dir-content")!.hidden =
            !target.classList.contains("unfold")
    }
})
