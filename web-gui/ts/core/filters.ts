import type { DataNode } from "../types"

const filtersForm = document.getElementById("filters") as HTMLFormElement

filtersForm.addEventListener("change", () => {
    document.dispatchEvent(new Event("filter-update"))
})

export function getFilters() {
    return {
        showHidden: filtersForm["show-hidden"].checked
    }
}

export function filterBranchCont(list: DataNode[]) {
    const filters = getFilters()

    let re = list
    if (!filters.showHidden) {
        re = list.filter(n => {
            return !n.name.startsWith(".")
        })
    }

    return re
}
