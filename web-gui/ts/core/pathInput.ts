import { checkPath, doFetch } from "../api/fetch"
import arraysOfObjectsAreEqual from "../helpers/compareArrays"
// import { initTree, status } from "./controls"
import sortByNeedlePosition from "../utils/sortByNeedlePosition"
import type { PathDetails, PathSugg } from "../types"

const accessWidget = document.getElementById("access-widged")
const input = document.getElementById("path") as HTMLInputElement
const pre = document.getElementById("pre-suggestions") as HTMLDivElement
const suggestions = document.getElementById("suggestions-box") as HTMLDivElement

const pathIsValid = {
    _val: null,
    get(): boolean | null {
        return this._val
    },
    set(valid: boolean) {
        this._val = valid
        // status.set(valid ? "ready" : "setting")
        document.dispatchEvent(new CustomEvent("path-status", { detail: valid ? "valid" : "" }))
        if (valid) {
            // input.className = "ok"
            input.classList.add("ok")
            // input.title = `The path is valid.`
            input.title = ""
        } else {
            // input.className = "almost"
            input.classList.remove("ok")
            input.title = `Enter or select an available directory path.`
        }
    }
}

let user = "nonroot" as "root" | "nonroot"
export function setAccessWidget(val: "root" | "nonroot" | "locked" | "unlocked") {
    if (val === "root") {
        user = val
        accessWidget.classList.add("root")
        accessWidget.title = "Root user!"
    } else if (val === "nonroot") {
        user = val
        accessWidget.classList.remove("root")
        accessWidget.title = "Non-root user"
    } else if (val === "locked") {
        accessWidget.classList.add("locked")
        accessWidget.parentElement.title =
            "You do not have permission to access this directory!\n Run as root to gain access."
        accessWidget.removeAttribute("title")

        pathIsValid.set(false)
        input.classList.add("locked")
        input.removeAttribute("title")
    } else if (val === "unlocked") {
        accessWidget.classList.remove("locked")
        accessWidget.parentElement.title = ""
        setAccessWidget(user)

        input.classList.remove("locked")
    }
}

export async function checkUser() {
    const user = await doFetch("/user")
    setAccessWidget(user?.root ? "root" : "nonroot")
}

export function setPath(val: string) {
    input.value = val
}

// document.addEventListener("mode", (e: CustomEvent) => {
//     if (e.detail === "results") {
//         input.disabled = true
//     } else if (e.detail === "preparations") {
//         input.disabled = false
//         input.focus()
//     }
// })

export function disablePathInput() {
    input.disabled = true
}

export function enablePathInput() {
    input.disabled = false
    pathIsValid.set(true)
    input.focus()
}

function slashIt(path: string) {
    return path.endsWith("/") ? path : path + "/"
}

let selected = null as Element
function showSuggestions(select?: boolean) {
    if (select) selectFirst()
    suggestions.parentElement.classList.remove("hidden")
    document.addEventListener("click", selectOrHideByClick)
}

function hideSuggesions() {
    suggestions.parentElement.classList.add("hidden")
    selected?.classList.remove("selected")
    selected = null
    document.removeEventListener("click", selectOrHideByClick)
    // handleInput() // DON'T DO THIS! // And now there is no need, right?
}

let actualSugg = [] as PathSugg[]
function addSuggestions(sugg: PathSugg[], select?: boolean, prefix?: string) {
    if (!sugg || sugg.length === 0) {
        hideSuggesions()
        return
    }

    if (arraysOfObjectsAreEqual(sugg, actualSugg)) {
        showSuggestions(select)
        return
    }

    actualSugg = sugg

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
            if (s.isEmpty) {
                title.push("The directory is empty")
                classes.push("empty")
            }

            return `<div
                class="suggestion ${classes.join(" ")}"
                ${title.length > 0 ? `title="${title.join("\n")}"` : ""}
            >${prefix ? prefix + s.name : s.name}</div>`
        })
        .join("")
    suggestions.innerHTML = html

    showSuggestions(select)
}

let checkedPath = null as PathDetails
function evaluatePath(canBeValid = true) {
    if (checkedPath.isLocked) {
        setAccessWidget("locked")
        return
    } else {
        setAccessWidget("unlocked")
    }

    if (!checkedPath.workingPath) {
        pathIsValid.set(canBeValid)
        pre.textContent = input.value
        addSuggestions(checkedPath.nextDirs)
    } else {
        // WORKING PATH CASE: the input path have some nuances
        const slashedWorkingPath = slashIt(checkedPath.workingPath)
        if (!checkedPath.replacement) {
            // the beggining of the path is ok, the thing is about the suggestions
            pre.textContent = slashedWorkingPath

            const ending = input.value.slice(slashedWorkingPath.length)
            const sorted = sortByNeedlePosition(ending, checkedPath.nextDirs) as PathSugg[]
            // console.log(ending, sorted)

            if (sorted.length > 0) {
                addSuggestions(sorted, true)

                if (sorted.length === 1 && sorted[0].name === ending) {
                    if (sorted[0].isLocked) {
                        // setAccessWidget("locked")
                    } else {
                        pathIsValid.set(canBeValid)
                    }
                    hideSuggesions()
                }
            } else {
                addSuggestions(checkedPath?.nextDirs || [], true)
            }
        } else {
            // REPLACEMENT CASE
            // console.log(checkedPath)
            // console.log(checkedPath.replacement)
            pre.textContent = ""

            const improvedInput = input.value.replace(...checkedPath.replacement)
            const ending = improvedInput.slice(slashedWorkingPath.length)
            if (ending === "") {
                addSuggestions(
                    [{ name: "" }, ...(checkedPath?.nextDirs ?? [])],
                    true,
                    slashedWorkingPath
                )
                return
            }
            const sorted = sortByNeedlePosition(ending, checkedPath.nextDirs) as PathSugg[]
            // console.log(ending, sorted)

            if (sorted.length > 0) {
                addSuggestions(sorted, true, slashedWorkingPath)
            } else {
                addSuggestions(checkedPath?.nextDirs || [], true, slashedWorkingPath)
            }
        }
    }
}

async function handleInput() {
    pathIsValid.set(false)

    if (!input.value) {
        hideSuggesions()
        setAccessWidget("unlocked")
        return
    }

    if (
        input.value.startsWith(checkedPath?.inputPath) ||
        (checkedPath?.replacement && input.value.startsWith(checkedPath.replacement[0]))
    ) {
        evaluatePath(false)
    }

    // checkedPath = (await doFetch("/path", { path: input.value })) as PathDetails
    checkedPath = (await checkPath(input.value)) as PathDetails

    if (checkedPath?.inputPath === input.value) evaluatePath()
    // else new handleInput() call should have been done
}
input.addEventListener("input", handleInput)

function implementSelection(scroll = true) {
    selected.classList.add("selected")
    if (scroll) selected.scrollIntoView({ behavior: "smooth", block: "center" })
    // setAccessWidget(selected.classList.contains("locked") ? "locked" : "unlocked")
    if (selected.classList.contains("locked")) {
        setAccessWidget("locked")
    } else {
        setAccessWidget("unlocked")
        pathIsValid.set(true)
    }
}

async function moveSelection(down: boolean) {
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

    if (selected) implementSelection()
}

function selectFirst() {
    const first = suggestions.firstElementChild
    if (selected === first) {
        setAccessWidget(selected.classList.contains("locked") ? "locked" : "unlocked")
        return
    }
    if (selected) {
        selected.classList.remove("selected")
    }

    selected = first
    implementSelection()
}

function selectOrHideByClick(e: MouseEvent) {
    const target = e.target as HTMLElement
    // console.log(target)
    // console.log(target.closest("#suggestions-box"))
    if (!target.closest("#suggestions-box")) return hideSuggesions()

    if (!target.classList.contains("suggestion")) return

    selected?.classList.remove("selected")
    selected = target

    implementSelection(false)
    useSelected()
}

function useSelected() {
    if (!selected) return
    if (selected.classList.contains("locked")) return

    const suggName = selected.textContent
    const prePath = !checkedPath.workingPath
        ? slashIt(input.value)
        : checkedPath.replacement
          ? ""
          : slashIt(checkedPath.workingPath)

    input.value = `${prePath}${slashIt(suggName)}`

    handleInput()
}

export async function handlePathInput(e: KeyboardEvent) {
    if (e.key === "ArrowRight") {
        useSelected()
    } else if (e.key === "Enter") {
        e.preventDefault()

        if (pathIsValid.get() === null) await handleInput()

        if (selected) {
            useSelected()
        } else if (pathIsValid.get() === true) {
            hideSuggesions()
            // initTree(slashIt(input.value))
            document.dispatchEvent(
                new CustomEvent("scan-request", { detail: slashIt(input.value) })
            )
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

// const autoExit = document.getElementById("auto-exit") as HTMLInputElement // yeah it shouldn't be there!
// document.addEventListener("keydown", async e => {
//     // console.log(e.key)
//     // console.log(e.code)
//     if (e.ctrlKey && e.code === "KeyQ") {
//         autoExit.checked = !autoExit.checked
//     }
//     const st = status.get()
//     if (st === "scanning") return
//     if (st === "done") {
//         if (e.key === "Enter" && e.ctrlKey) {
//             e.preventDefault()
//             status.set("ready")
//         }

//         return
//     }
//     handlePathInput(e)
// })
