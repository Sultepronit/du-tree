const form = document.getElementById("exclude-form") as HTMLFormElement

let nextId = 2
form.addEventListener("input", (e: InputEvent) => {
    const target = e.target as HTMLInputElement
    if (target === form.excludeset.lastElementChild) {
        console.log("last!")
        const next = target.cloneNode() as HTMLInputElement
        next.value = ""
        next.id = `ex${nextId++}`
        form.excludeset.appendChild(next)
    }
})

// form.addEventListener("change", (e: InputEvent) => {
//     const target = e.target as HTMLInputElement
//     if (target.type === "text" && target.value === "") {
//         target.remove()
//     }
//     const data = new FormData(form)

//     const patterns = data.getAll("patt")
//     console.log(patterns.slice(0, -1))
//     console.log(form.hidd.checked)
// })

form.addEventListener("focusout", (e: InputEvent) => {
    const target = e.target as HTMLInputElement
    if (target.type === "text" && target.value === "") {
        if (target === form.excludeset.lastElementChild) return
        target.remove()
    }
})

const excluded = {
    get() {
        const data = new FormData(form)
        console.log(data)
        console.log(data.keys())
        const patterns = data.getAll("patt")
        console.log(patterns)
        return {
            hidden: form.hidd.checked,
            patterns: patterns.slice(0, -1)
        }
    },

    set(val: { hidden?: boolean; patterns?: string[] }) {
        form.hidd.checked = !!val.hidden
    },

    disable() {
        // form.excludeset.disabled = true
        // form.excludeset.readonly = true
        setTimeout(() => (form.excludeset.disabled = true), 100)
    },
    enable() {
        form.excludeset.disabled = false
        // form.excludeset.readonly = false
    },

    show(yesOrNo: boolean) {
        form.hidden = !yesOrNo
        if (yesOrNo) {
            form.hidd.focus()
        }
    }
}

export default excluded
