export default function handleBytes(bytes: number, more = false) {
    if (bytes < 1024) return `${more ? "≥" : ""}${bytes} B`

    const k = 1024
    const units = ["B ", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB"]
    let i = Math.floor(Math.log(bytes) / Math.log(k))

    let value = bytes / k ** i

    if (value >= 1000) {
        value /= k
        i++
    }

    const rounded = Math.round(value)
    let decimals = 0
    if (more) {
        if (rounded < 10) decimals = 1
        return `≥${value.toFixed(decimals)} ${units[i]}`
    }

    if (rounded < 10) decimals = 2
    else if (rounded < 100) decimals = 1
    // console.log(value)

    return `${value.toFixed(decimals)} ${units[i]}`
}
// console.log(handleBytes(999))
// console.log(handleBytes(1023))
// console.log(handleBytes(1000))
// console.log(handleBytes(1023 * 1024))
// console.log(handleBytes(1123))
// console.log(handleBytes(1900))
// console.log(handleBytes(2000))
// console.log(handleBytes(11245413))
// console.log(handleBytes(102387))
