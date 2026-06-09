import { doFetch } from "../api/fetch"
import { initTree } from "../tree/controls"


const accessWidget = document.getElementById("access-widged")
const input = document.getElementById("path") as HTMLInputElement
const pre = document.getElementById("pre-suggestions") as HTMLDivElement
const suggestions = document.getElementById("suggestions-box") as HTMLDivElement

export async function updateAccessWidget() {
    const root = await checkUser()
    if (root) accessWidget.classList.add("root")
    else accessWidget.classList.remove("root")
}

export async function checkUser() {
    const user = await doFetch("/user")
    console.log(user?.root)
    return user?.root
}

// type pathHint = { current: string; next: string[] }
type nextDetails = {
    name: string
    link?: string
    isLocked?: true
}
type pathHint = {
    current: string
    next: nextDetails[]
}

// function addSuggestions(names: string[]) {
function addSuggestions(sugg: nextDetails[]) {
    suggestions.classList.remove("hidden")
    const html = sugg
        .map(s => {
            const classes = [] as string[]
            let title = [] as string[]

            if (s.link) {
                classes.push("link")
                title = [`Link to: ${s.link}`]
            }
            if (s.isLocked) {
                title.push("You cannot access this dir!")
                classes.push("locked")
            }

            return `<div
                class="suggestion ${classes.join(" ")}"
                ${title.length > 0 ? `title="${title.join("\n")}"` : ""}
            >${s.name}</div>`
        })
        .join("")
    suggestions.innerHTML = html
}

let isOk = false
input.addEventListener("input", async () => {
    updateAccessWidget()
    // console.log(input.value)
    if (!input.value) {
        suggestions.classList.add("hidden")
        return
    }
    // const re = await doFetch("/path", pathInpunt.value)
    const path = (await doFetch("/path", { path: input.value })) as pathHint
    console.log(path)

    if (path?.current === "Permission denied") accessWidget.classList.add("locked")
    else accessWidget.classList.remove("locked")

    if (path?.current === "ok") {
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
            candidates = path.next.filter(e => e.name.toLocaleLowerCase().includes(next))
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
    console.log(e.key)
    if (e.key === "Enter" && isOk) {
        const path = input.value.endsWith("/") ? input.value : input.value + "/"
        initTree(path)
        suggestions.classList.add("hidden")
    } else if (e.key === "Escape") {
        suggestions.classList.add("hidden")
    } else if (e.key === "ArrowDown") {
        console.log(suggestions.firstChild)
    } else if (e.key === "ArrowUp") {
        
    }
})
