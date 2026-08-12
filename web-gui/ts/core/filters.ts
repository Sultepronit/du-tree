import type { DataBranch, DataNode } from "../types"

const filtersForm = document.getElementById("filters") as HTMLFormElement

export function getFilters() {
    return {
        showHidden: filtersForm["show-hidden"].checked
    }
}

export function filterBranchCont(list: DataNode[]) {
    const filters = getFilters()

    let re: DataNode[]
    if (!filters.showHidden) {
        re = list.filter(n => {
            return !n.name.startsWith(".")
        })
    }

    return re
}
