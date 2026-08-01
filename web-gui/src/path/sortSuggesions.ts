// export default function sortByNeedlePosition(needle: string, list: string[]) {
export default function sortByNeedlePosition(needle: string, list: { name: string }[] | null) {
    if (!list || list?.length < 1) return []
    const re = []

    let lowNeedle = needle.toLocaleLowerCase()

    const relevant = []
    for (const e of list) {
        let i = e.name.toLocaleLowerCase().indexOf(lowNeedle) * 2 + 1
        if (i >= 0) {
            const j = e.name.indexOf(needle) * 2
            if (j >= 0) i = j
            if (relevant[i]) relevant[i].push(e)
            else relevant[i] = [e]
        }
    }

    for (const block of relevant) {
        if (block) re.push(...block)
    }

    return re
}
