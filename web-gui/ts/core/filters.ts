import type { DataBranch, DataNode } from "../types"

const filtersForm = document.getElementById("filters") as HTMLFormElement

let filters = grabFilters()

function grabFilters() {
    const re = {} as Record<string, any>
    const moreThan = {
        value: Number(filtersForm["more-number"].value),
        unit: "parent %"
    }

    if (!filtersForm["show-hidden"].checked) re.hideHidden = true
    if (filtersForm["more-than"].checked) re.moreThan = moreThan
    if (Object.keys(re).length < 1) {
        // document.body.classList.add("no-filters")
        return null
    }

    // document.body.classList.remove("no-filters")

    return re
}

function fireFiters() {
    filters = grabFilters()
    document.dispatchEvent(new Event("filter-update"))
}

filtersForm.addEventListener("input", e => {
    if (e.target === filtersForm["more-number"]) {
        const value = Number(filtersForm["more-number"].value)

        filtersForm["more-than"].checked = value > 0
        fireFiters()
    }
})

filtersForm.addEventListener("change", fireFiters)

export function toggleShowHidden(isAvailable: boolean) {
    if (isAvailable) {
        filtersForm["show-hidden"].disabled = false
    } else {
        filtersForm["show-hidden"].checked = false
        filtersForm["show-hidden"].disabled = true
    }
}

export function getFilters() {
    return filters
}

export function filterBranchCont(branch: DataBranch): DataBranch {
    if (!filters) return branch
    if (branch.isFiltered) return branch

    const re = {
        content: [] as DataNode[],
        hiddenItems: branch.content.length,
        hiddenSize: 0
    }

    const moreThan = filters?.moreThan?.value ? (branch.size * filters.moreThan.value) / 100 : -1
    // console.log(moreThan)
    for (const n of branch.content) {
        re.hiddenSize += n.size

        if (filters.hideHidden && n.name.startsWith(".")) continue
        if (n.size <= moreThan) continue

        re.content.push(n)

        re.hiddenItems--
        re.hiddenSize -= n.size
    }
    // console.log(re)

    return re
}
