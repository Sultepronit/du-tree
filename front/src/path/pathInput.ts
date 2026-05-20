import { doFetch } from "../api/fetch"
import { initTree } from "../tree/buildTree"

export const input = document.getElementById("path") as HTMLInputElement
const pre = document.getElementById("pre-suggestions") as HTMLDivElement
const suggestions = document.getElementById("suggestions-box") as HTMLDivElement

function addSuggestions(names: string[]) {
    suggestions.classList.remove("hidden")
    const html = names
        .map(n => {
            if (n.startsWith("///")) {
                const [_, name, link] = n.split("///")
                return `<div class="suggestion tL" title="${link}">${name}</div>`
            }
            return `<div class="suggestion td">${n}</div>`
        })
        .join("")
    suggestions.innerHTML = html
}

type pathCheck = { current: string; next: string[] }
let isOk = false
input.addEventListener("input", async () => {
    console.log(input.value)
    // const re = await doFetch("/path", pathInpunt.value)
    const path = (await doFetch("/path", { path: input.value })) as pathCheck
    console.log(path)
    if (!path) {
        isOk = false
        suggestions.classList.add("hidden")
        input.className = "wrong"
    } else if (path?.current === "ok") {
        isOk = true
        pre.textContent = input.value
        input.className = "ok"
        addSuggestions(path.next)
    } else {
        isOk = false
        pre.textContent = path.current
        let next = input.value.slice(path.current.length).toLocaleLowerCase()
        if (next.startsWith("/")) next = next.slice(1)
        console.log("next:", next)
        // const candidates = path.next.filter(e => `/${e}`.startsWith(next) || e.startsWith(next))
        const candidates = path.next.filter(e => e.toLocaleLowerCase().includes(next))
        console.log(candidates)

        if (candidates.length > 0) {
            addSuggestions(candidates)
        } else {
            addSuggestions(path.next)
        }

        input.className = candidates.length > 0 ? "almost" : "wrong"
    }
})

input.addEventListener("keydown", e => {
    // console.log(e.key)
    if (e.key === "Enter" && isOk) {
        const path = input.value.endsWith("/") ? input.value : input.value + "/"
        initTree(path)
        suggestions.classList.add("hidden")
    }
})
