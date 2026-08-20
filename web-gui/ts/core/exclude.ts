import { toggleShowHidden } from "./filters"

const form = document.getElementById("exclude-form") as HTMLFormElement

form.addEventListener("input", (e: InputEvent) => {
    const target = e.target as HTMLInputElement
    if (target === form.excludeset.lastElementChild) {
        const next = target.cloneNode() as HTMLInputElement
        next.value = ""
        form.excludeset.appendChild(next)
    }
})

form.addEventListener("focusout", (e: InputEvent) => {
    const target = e.target as HTMLInputElement
    if (target.type === "text" && target.value === "") {
        if (target === form.excludeset.lastElementChild) return
        target.remove()
    }
})

form.hidd.addEventListener("change", () => {
    toggleShowHidden(!form.hidd.checked)
})

const excluded = {
    get() {
        const data = new FormData(form)
        const patterns = data.getAll("patt")

        return {
            hidden: form.hidd.checked,
            patterns: patterns.slice(0, -1)
        }
    },

    set(val: { hidden?: boolean; patterns?: string[] }) {
        form.hidd.checked = !!val.hidden
        console.log(val)
        const empty = form["patt"]
        console.log(empty)
        const fragment = new DocumentFragment()
        for (const p of val.patterns) {
            const next = empty.cloneNode() as HTMLInputElement
            next.value = p
            fragment.appendChild(next)
        }
        empty.before(fragment)
    },

    disable() {
        setTimeout(() => (form.excludeset.disabled = true), 100)
    },
    enable() {
        form.excludeset.disabled = false
    },

    show(yesOrNo: boolean) {
        form.hidden = !yesOrNo
        if (yesOrNo) {
            form.hidd.focus()
        }
    }
}

export default excluded
