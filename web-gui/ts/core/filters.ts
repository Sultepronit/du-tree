import type { DataBranch, DataNode } from "../types"

const filtersForm = document.getElementById("filters") as HTMLFormElement

let filters = grabFilters()

function grabFilters() {
    const re = {} as Record<string, any>
    const moreThan = {
        value: 2,
        unit: "parent %"
    }

    if (!filtersForm["show-hidden"].checked) re.hideHidden = true
    if (filtersForm["more-than"].checked) re.moreThan = moreThan
    if (Object.keys(re).length < 1) {
        document.body.classList.add("no-filters")
        return null
    }

    document.body.classList.remove("no-filters")

    return re
}

filtersForm.addEventListener("change", () => {
    filters = grabFilters()

    document.dispatchEvent(new Event("filter-update"))
})

export function getFilters() {
    return filters
}

// export function filterBranchCont(list: DataNode[]) {
export function filterBranchCont(branch: DataBranch): DataBranch {
    // if (!filters) return branch.content
    if (!filters) return branch

    // const content = [] as DataNode[]
    // branch.filteredItems = 0
    // branch.filteredSize = 0
    const re = {
        content: [] as DataNode[],
        hiddenItems: branch.content.length,
        // hiddenSize: branch.size
        hiddenSize: 0
    }

    const moreThan = filtersForm["more-than"].checked ? branch.size * 0.02 : -1
    // console.log(moreThan)
    for (const n of branch.content) {
        re.hiddenSize += n.size

        if (filters.hideHidden && n.name.startsWith(".")) continue
        if (n.size <= moreThan) continue

        re.content.push(n)

        re.hiddenItems--
        re.hiddenSize -= n.size
    }
    console.log(re)

    return re
}
