import formatTime from "../helpers/formatTime"
import type { DataNode } from "../types"
import formatSize from "../utils/formatSize"

export function genLockedDetails(node: DataNode) {
    const re = []
    if (node.locked === -1) {
        re.push(`\nYou have no read rights for this dir`)
    } else {
        re.push(`\nContains ${node.locked} nested dir(s) without access`)
    }
    re.push(` Run as root to get the full size.`)

    return re
}

const specialTypes = {
    S: "Socket",
    p: "Pipe",
    D: "Device"
}

// function genTitle(data: DataNode, path: string) {
export function genTitle(data: DataNode, path: string, rootPath: string) {
    const title = [`Name: ${data.name}`, `Location: ${rootPath}${path}`]

    if (data.linkPath) {
        title.push(
            data.type === "Lbrk"
                ? `Broken soft link to: ${data.linkPath}`
                : data.type === "Lperm-file"
                  ? `Soft link (Target hidden: permission denied).`
                  : data.type === "Lperm-target"
                    ? `Soft link to: ${data.linkPath} (Target inaccessible: permission denied).`
                    : `Soft link to: ${data.linkPath}`
        )
    }

    const t = data.linkPath ? data.type.slice(1) : data.type
    const st = specialTypes[t]
    if (st) title.push(`File type: ${st}`)

    title.push(
        `Last modified: ${formatTime(data.modTime)}`,
        `Scan time: ${formatTime(data.scanTime)}`
    )

    if (data.nlink) {
        let msg = `\nShared inode: ${data.nlink} hard links exist.\n`
        if (data.isNeglected) {
            msg += "Size of this hard link is neglected."
        } else {
            msg += "Size of this hard link is counted, all others are neglected."
        }
        title.push(msg)
    }

    if (data.locked) {
        title.push(...genLockedDetails(data))
    }

    return title.join("\n")
}

export function handleBytesExt(data: DataNode) {
    return formatSize(data.size, data.temp > 0 || data.locked !== undefined)
}

export function createLi(data: DataNode, path: string, rootPath: string): string {
    const type = data.type[0] === "L" ? `link t${data.type.slice(1)}` : `t${data.type}`

    const classes = [`shoot ${type}`]
    if (data.locked) {
        classes.push("locked")
        if (data.locked === -1) classes.push("itself")
    }
    if (data.temp) {
        classes.push("temp")
        if (data.temp === 2) classes.push("unavailable")
    }
    if (data.nlink) {
        classes.push("hardlink")
        if (data.isNeglected) classes.push("neglected")
    }

    return `<li><div
            class="${classes.join(" ")}"
            title="${genTitle(data, path, rootPath)}"
            data-path="${path}" 
            data-name="${data.name}"
            style="--size: ${data.size}%"
        >
            <div class="fd-entry">
                <div class="fd-sizebar"></div>
                <div class="fd-size" title="${data.size} B">${handleBytesExt(data)}</div>
                <div class="fd-name">${data.name}</div>
            </div>
    </div></li>`
}
