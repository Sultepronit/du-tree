function round(value: number, more: boolean) {
    let decimals = 0
    if (more) {
        if (value <= 9.95) decimals = 1
        return value.toFixed(decimals)
    }

    if (value <= 9.995) decimals = 2
    else if (value < 99.95) decimals = 1
    return value.toFixed(decimals)
}

function testRound() {
    // for (let i = 9900; i < 10000; i++) {
    //     const v = i / 1000
    // for (let i = 9900; i < 10000; i++) {
    // const v = i / 100
    //     console.log(v, round(v, false))
    // }
    // for (let i = 9900; i < 10000; i++) {
    //     const v = i / 1000
    //     console.log(v, round(v, true))
    // }
    console.log(99.94, round(99.94, false))
    console.log(99.945, round(99.945, false))
    console.log(99.95, round(99.95, false))
    console.log(9.9945, round(9.9945, false))
    console.log(9.995, round(9.995, false))
    console.log(9.99501, round(9.99501, false))
}
// testRound()

export default function formatSize(bytes: number, more = false) {
    if (bytes < 1024) return `${more ? "≥" : ""}${bytes} B`

    const k = 1024
    const units = ["B ", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB"]
    let i = Math.floor(Math.log(bytes) / Math.log(k))

    let value = bytes / k ** i

    if (value >= 1000) {
        value /= k
        i++
    }

    // const rounded = Math.round(value)
    // // console.log(value, rounded, value.toFixed(2), value.toFixed(1))
    // let decimals = 0
    // if (more) {
    //     if (rounded < 10) decimals = 1
    //     return `≥${value.toFixed(decimals)} ${units[i]}`
    // }

    // // if (rounded < 10) decimals = 2
    // // else if (rounded < 100) decimals = 1
    // if (value < 9.99) decimals = 2
    // else if (value < 99.95) decimals = 1
    // console.log(value)

    // return `${value.toFixed(decimals)} ${units[i]}`
    return `${more ? "≥" : ""}${round(value, more)} ${units[i]}`
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
// console.log(handleBytes(10331750400))
