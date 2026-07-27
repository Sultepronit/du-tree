import { doFetch } from "../api/fetch"
import { initTree, status } from "../tree/controls"
import sortByNeedlePosition from "./sortSuggesions"

const accessWidget = document.getElementById("access-widged")
const input = document.getElementById("path") as HTMLInputElement
const pre = document.getElementById("pre-suggestions") as HTMLDivElement
const suggestions = document.getElementById("suggestions-box") as HTMLDivElement

export async function setAccessWidget(val: "root" | "nonroot" | "locked" | "unlocked") {
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

document.addEventListener("mode", (e: CustomEvent) => {
    if (e.detail === "results") {
        input.disabled = true
    } else if (e.detail === "preparations") {
        input.disabled = false
        input.focus()
    }
})

type nextDetails = {
    name: string
    link?: string
    isLocked?: true
}
type pathHint = {
    // current: string
    inputPath: string
    workingPath?: string
    replacement?: string[]
    nextDirs?: nextDetails[]
    isLocked?: true
    isRemoved?: true
}

function slashIt(path: string) {
    return path.endsWith("/") ? path : path + "/"
}

let selected = null as Element
function addSuggestions(sugg: nextDetails[]) {
    // console.log(sugg)
    if (sugg.length === 0) {
        hideSuggesions()
        return
    }

    suggestions.parentElement.classList.remove("hidden")
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
    suggestions.parentElement.classList.add("hidden")
    selected = null
}

// let isOk: boolean
const pathIsValid = {
    _val: null,
    get(): boolean | null {
        return this._val
    },
    set(valid: boolean) {
        this._val = valid
        status.set(valid ? "ready" : "setting")
        input.className = "ok"
        input.title = `The path is valid. \nYou can start scanning the directory by pressing the Enter key.`
    }
}

let checkedPath = null as pathHint

function evaluatePath() {}

async function handleInput() {
    checkUser()
    // console.log(input.value)
    if (!input.value) {
        hideSuggesions()
        setAccessWidget("unlocked")
        return
    }

    checkedPath = (await doFetch("/path", { path: input.value })) as pathHint
    // console.log(approvedPath)

    if (checkedPath.inputPath === input.value) {
        if (checkedPath.isLocked) setAccessWidget("locked")
        else setAccessWidget("unlocked")

        if (!checkedPath.workingPath) {
            pathIsValid.set(true)
            pre.textContent = input.value
            // input.className = "ok"
            // input.title = `The path is valid. \nYou can start scanning the directory by pressing the Enter key.`
            addSuggestions(checkedPath.nextDirs)
        } else {
            // WORKING PATH CASE: the input path have some nuances
            if (!checkedPath.replacement) {
                pre.textContent = checkedPath.workingPath
                // the beggining of the path is ok, the thing is about the suggestions
                const slashedWorkingPath = slashIt(checkedPath.workingPath)
                const ending = input.value.slice(slashedWorkingPath.length)
                const sorted = sortByNeedlePosition(ending, checkedPath.nextDirs)
                console.log(ending, sorted)

                // const sorted = [] // they really are sorted!
                // if (checkedPath?.nextDirs) {
                //     let ending = input.value
                //         .slice(checkedPath.workingPath.length)
                //         .toLocaleLowerCase()

                //     const relevant = []
                //     for (const e of checkedPath.nextDirs) {
                //         const i = e.name.toLocaleLowerCase().indexOf(ending)
                //         if (i >= 0) relevant[i] ? relevant[i].push(e) : (relevant[i] = [e]) // sorting!
                //     }
                //     // console.log(relevant)
                //     for (const block of relevant) {
                //         // console.log(block)
                //         if (block) sorted.push(...block)
                //     }
                //     // console.log(sorted)
                // }

                if (sorted.length > 0) {
                    addSuggestions(sorted)
                    if (sorted[0].name === ending) {
                        pathIsValid.set(true)
                    } else {
                        input.className = "almost"
                        input.title = `Enter or select an available directory path.`
                    }
                } else {
                    addSuggestions(checkedPath?.nextDirs || [])
                    input.className = "wrong"
                    input.title = `There is no directory with path: ${input.value}.\n Please select an available one.`
                }
            }
        }
    }

    // if (checkedPath?.current === "ok") {
    // } else {
    //     // isOk = false
    //     pathIsValid.set(false)
    //     pre.textContent = checkedPath?.current

    //     // console.log(approvedPath?.next)
    // }
}
input.addEventListener("input", handleInput)

async function moveSelection(down: boolean) {
    // if (suggestions.parentElement.classList.contains("hidden")) return
    if (suggestions.parentElement.classList.contains("hidden")) {
        if (down) await handleInput()
        else return
    }

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

function select(): boolean {
    if (!selected) return false
    if (selected.classList.contains("locked")) return false

    const suggName = selected.textContent
    // const prePath =
    //     checkedPath.current === "ok" ? slashIt(input.value) : slashIt(checkedPath.current)
    const prePath = checkedPath.workingPath
        ? slashIt(checkedPath.workingPath)
        : slashIt(input.value)

    input.value = `${prePath}${suggName}/`
    // we need to check for changes!
    // input.className = "ok"
    // isOk = true
    // pathIsValid.set(true)

    return true
}

async function handlePathInput(e: KeyboardEvent) {
    if (e.key === "ArrowRight") {
        if (select()) handleInput()
    } else if (e.key === "Enter") {
        e.preventDefault()

        // if (isOk === undefined) await handleInput()
        if (pathIsValid.get() === null) await handleInput()

        if (selected) {
            if (select()) handleInput()
            // } else if (isOk) {
        } else if (pathIsValid.get() === true) {
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
}

const autoExit = document.getElementById("auto-exit") as HTMLInputElement // yeah it shouldn't be there!
document.addEventListener("keydown", async e => {
    // console.log(e.key)
    // console.log(e.code)
    if (e.ctrlKey && e.code === "KeyQ") {
        autoExit.checked = !autoExit.checked
    }
    const st = status.get()
    if (st === "scanning") return
    if (st === "done") {
        if (e.key === "Enter" && e.ctrlKey) {
            e.preventDefault()
            console.log("here we go!")
            status.set("ready")
        }

        return
    }
    handlePathInput(e)
})

suggestions.addEventListener("click", e => {
    const target = e.target as HTMLElement
    console.log(target)
    if (!target.classList.contains("suggestion")) return

    selected?.classList.remove("selected")
    selected = target

    target.classList.add("selected")
    checkUser()
})
