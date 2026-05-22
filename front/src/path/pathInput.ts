import { doFetch } from "../api/fetch"
import { initTree } from "../tree/buildTree"

const accessWidget = document.getElementById("access-widged")
const input = document.getElementById("path") as HTMLInputElement
const pre = document.getElementById("pre-suggestions") as HTMLDivElement
const suggestions = document.getElementById("suggestions-box") as HTMLDivElement

export async function updateAccessWidget() {
    const root = await checkUser()
    if (root) accessWidget.classList.add("root")
    else accessWidget.classList.remove("root")

    // accessWidget.className = root ? "root" : ""
}

export async function checkUser() {
    const user = await doFetch("/user")
    console.log(user?.root)
    return user?.root
}

function addSuggestions(names: string[]) {
    suggestions.classList.remove("hidden")
    const html = names
        .map(n => {
            if (n.startsWith("///")) {
                const [_, name, link] = n.split("///")
                const title = `Link to: ${link}`
                if (name.startsWith("🔒/")) {
                    const name2 = name.slice(3)
                    const title2 = title + "\nYou cannot access this dir!"
                    return `<div class="suggestion tL locked" title="${title2}">🔒${name2}</div>`
                }
                return `<div class="suggestion tL" title="${title}">${name}</div>`
            } else if (n.startsWith("/🔒")) {
                const name = n.slice(1)
                const title = "You cannot access this dir!"
                return `<div class="suggestion td locked" title="${title}">${name}</div>`
            }
            return `<div class="suggestion td">${n}</div>`
        })
        .join("")
    suggestions.innerHTML = html
}

type pathCheck = { current: string; next: string[] }
let isOk = false
input.addEventListener("input", async () => {
    updateAccessWidget()
    console.log(input.value)
    if (!input.value) return
    // const re = await doFetch("/path", pathInpunt.value)
    const path = (await doFetch("/path", { path: input.value })) as pathCheck
    console.log(path)

    if (path?.current === "Permission denied") accessWidget.classList.add("locked")
    else accessWidget.classList.remove("locked")

    /*if (!path) {
        isOk = false
        suggestions.classList.add("hidden")
        input.className = "wrong"
    } else*/ if (path?.current === "ok") {
        isOk = true
        pre.textContent = input.value
        input.className = "ok"
        addSuggestions(path.next)
    } else {
        isOk = false
        pre.textContent = path?.current

        let candidates = []
        if (path?.next) {
            let next = input.value.slice(path.current.length).toLocaleLowerCase()
            if (next.startsWith("/")) next = next.slice(1)
            console.log("next:", next)
            // const candidates = path.next.filter(e => `/${e}`.startsWith(next) || e.startsWith(next))
            candidates = path.next.filter(e => e.toLocaleLowerCase().includes(next))
            console.log(candidates)
        }

        if (candidates.length > 0) {
            addSuggestions(candidates)
        } else {
            addSuggestions(path?.next || [])
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
