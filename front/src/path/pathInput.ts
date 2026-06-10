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

let selected = null as Element
// function addSuggestions(names: string[]) {
function addSuggestions(sugg: nextDetails[]) {
    suggestions.classList.remove("hidden")
    selected = null
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

let approvedPath = null as pathHint
let isOk = false
input.addEventListener("input", async () => {
    updateAccessWidget()
    // console.log(input.value)
    if (!input.value) {
        suggestions.classList.add("hidden")
        return
    }
    // const re = await doFetch("/path", pathInpunt.value)
    approvedPath = (await doFetch("/path", { path: input.value })) as pathHint
    console.log(approvedPath)

    if (approvedPath?.current === "Permission denied") accessWidget.classList.add("locked")
    else accessWidget.classList.remove("locked")

    if (approvedPath?.current === "ok") {
        isOk = true
        pre.textContent = input.value
        input.className = "ok"
        addSuggestions(approvedPath.next)
    } else {
        isOk = false
        pre.textContent = approvedPath?.current

        let candidates = []
        if (approvedPath?.next) {
            let next = input.value.slice(approvedPath.current.length).toLocaleLowerCase()
            if (next.startsWith("/")) next = next.slice(1)
            console.log("next:", next)
            // const candidates = path.next.filter(e => `/${e}`.startsWith(next) || e.startsWith(next))
            candidates = approvedPath.next.filter(e => e.name.toLocaleLowerCase().includes(next))
            console.log(candidates)
        }

        if (candidates.length > 0) {
            addSuggestions(candidates)
        } else {
            addSuggestions(approvedPath?.next || [])
        }

        input.className = candidates.length > 0 ? "almost" : "wrong"
    }
})

function moveSelection(down: boolean) {
    if (suggestions.classList.contains("hidden")) return

    if (selected) {
        selected.classList.remove("selected")
        const next = down ? selected.nextElementSibling : selected.previousElementSibling
        if (next) {
            selected = next
        } else if (!down) {
            selected = null
            input.matches(":focus") || input.focus()
        }
    } else if (down) {
        selected = suggestions.firstElementChild
    }

    if (selected) selected.classList.add("selected")
    console.log(approvedPath.current, selected?.textContent)
}

const inputPath = () => (input.value.endsWith("/") ? input.value : input.value + "/")

// input.addEventListener("keydown", e => {
document.addEventListener("keydown", e => {
    // console.log(e.key)
    // if (e.key === "Enter" && isOk) {
    if (e.key === "Enter") {
        let path: string
        if (selected) {
            const suggName = selected.textContent
            const prePath =
                approvedPath.current === "ok"
                    ? inputPath()
                    : approvedPath.current === "/"
                      ? "/"
                      : approvedPath.current + "/"
            path = prePath + suggName
            input.value = path
        } else if (isOk) {
            // path = input.value.endsWith("/") ? input.value : input.value + "/"
            path = inputPath()
        } else {
            return
        }

        console.log("final path:", path)
        // initTree(path)
        suggestions.classList.add("hidden")
    } else if (e.key === "Escape") {
        suggestions.classList.add("hidden")
    } else if (e.key === "ArrowDown") {
        e.preventDefault()
        moveSelection(true)
    } else if (e.key === "ArrowUp") {
        e.preventDefault()
        moveSelection(false)
    }
})
