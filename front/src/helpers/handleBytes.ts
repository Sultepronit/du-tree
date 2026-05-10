export default function handleBytes(bytes: number) {
    // if (bytes === 0) return "0 B"
    if (bytes < 1000) return `${bytes} B`

    const k = 1024
    const sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB"]
    // const sizes = ["KB", "MB", "GB", "TB", "PB", "EB"]
    let i = Math.floor(Math.log(bytes) / Math.log(k))

    let value = bytes / k ** i

    if (value >= 1000) {
        value /= 1024
        i++
    }

    const rounded = Math.round(value)
    let decimals = 0
    if (rounded < 10) decimals = 2
    else if (rounded < 100) decimals = 1
    // console.log(value)

    return `${value.toFixed(decimals)} ${sizes[i]}`
}
// console.log(handleBytes(999))
// console.log(handleBytes(1023))
// console.log(handleBytes(1000))
// console.log(handleBytes(1023 * 1024))
// console.log(handleBytes(1123))
// console.log(handleBytes(11245413))
// console.log(handleBytes(102387))
