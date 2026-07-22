import { doFetch } from "../api/fetch"
import { initTree } from "../tree/controls"

const accessWidget = document.getElementById("access-widged")
const input = document.getElementById("path") as HTMLInputElement
const pre = document.getElementById("pre-suggestions") as HTMLDivElement
const suggestions = document.getElementById("suggestions-box") as HTMLDivElement

export async function setAccessWidget(val: "root" | "nonroot" | "locked" | "unlocked") {
    // accessWidget.className = val
    if (val === "root") {
        accessWidget.classList.add("root")
    } else if (val === "nonroot") {
        accessWidget.classList.remove("root")
    } else if (val === "locked") {
        accessWidget.classList.add("locked")
    } else if (val === "unlocked") {
        accessWidget.classList.remove("locked")
    }
}

export async function checkUser() {
    const user = await doFetch("/user")
    setAccessWidget(user?.root ? "root" : "nonroot")
}

export function setPath(val: string) {
    input.value = val
}

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
function addSuggestions(sugg: nextDetails[]) {
    console.log(sugg)
    if (sugg.length === 0) {
        hideSuggesions()
        return
    }

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

function hideSuggesions() {
    suggestions.classList.add("hidden")
    selected = null
}

let approvedPath = null as pathHint
// let isOk = false
let isOk: boolean
async function handleInput() {
    checkUser()
    // console.log(input.value)
    if (!input.value) {
        hideSuggesions()
        return
    }

    approvedPath = (await doFetch("/path", { path: input.value })) as pathHint
    console.log(approvedPath)

    // if (approvedPath?.current === "Permission denied") accessWidget.classList.add("locked")
    // else accessWidget.classList.remove("locked")
    if (approvedPath?.current === "Permission denied") setAccessWidget("locked")
    else setAccessWidget("unlocked")

    if (approvedPath?.current === "ok") {
        isOk = true
        pre.textContent = input.value
        input.className = "ok"
        addSuggestions(approvedPath.next)
    } else {
        isOk = false
        pre.textContent = approvedPath?.current

        const sorted = []
        if (approvedPath?.next) {
            let next = input.value.slice(approvedPath.current.length).toLocaleLowerCase()
            if (next.startsWith("/")) next = next.slice(1)
            console.log("next:", next)

            const relevant = []
            for (const e of approvedPath.next) {
                const i = e.name.toLocaleLowerCase().indexOf(next)
                if (i >= 0) relevant[i] ? relevant[i].push(e) : (relevant[i] = [e])
            }
            // console.log(relevant)
            for (const block of relevant) {
                // console.log(block)
                if (block) sorted.push(...block)
            }
            // console.log(sorted)
        }

        console.log(approvedPath?.next)
        if (sorted.length > 0) {
            addSuggestions(sorted)
        } else {
            addSuggestions(approvedPath?.next || [])
        }
        /*} else if (approvedPath?.next?.length > 0) {
            addSuggestions(approvedPath.next)
        } else {
            console.log("no suggestions")
            hideSuggesions()
        }*/

        input.className = sorted.length > 0 ? "almost" : "wrong"
    }
}
input.addEventListener("input", handleInput)

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

    if (selected) {
        selected.classList.add("selected")
        selected.scrollIntoView({ behavior: "smooth", block: "center" })
        checkUser()
    }
    // console.log(approvedPath.current, selected?.textContent)
}

// const inputPath = () => (input.value.endsWith("/") ? input.value : input.value + "/")
function slashIt(path: string) {
    return path.endsWith("/") ? path : path + "/"
}
function handleSelection(): boolean {
    if (!selected) return false
    if (selected.classList.contains("locked")) return false

    const suggName = selected.textContent
    const prePath = approvedPath.current === "ok" ? slashIt(input.value) : slashIt(approvedPath.current)

    input.value = `${prePath}${suggName}/`
    isOk = true
    input.className = "ok"

    return true
}

document.addEventListener("keydown", async (e) => {
    // console.log(e.key)
    if (e.key === "ArrowRight") {
        if (handleSelection()) handleInput()
    } else if (e.key === "Enter") {
        // if (selected && !handleSelection()) return
        if (isOk === undefined) await handleInput()

        if (selected) {
            if (handleSelection()) handleInput()
        } else if (isOk) {
            hideSuggesions()
            initTree(slashIt(input.value))
        }
    } else if (e.key === "ArrowDown") {
        e.preventDefault()
        moveSelection(true)
    } else if (e.key === "ArrowUp") {
        e.preventDefault()
        moveSelection(false)
    } else if (e.key === "Escape") {
        hideSuggesions()
    }
})
