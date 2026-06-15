export type DataNode = {
    name: string
    type: string
    size: number
    sizeIsTemp?: boolean
    locked?: number
    content?: DataNode[]
}

// export type Shoot = {
//     el: HTMLDivElement
//     sizeDisplay?: HTMLDivElement
// }

// export type Branch = {
//     ul: HTMLUListElement
//     shoots: Record<string, Shoot>
// }

export type ElNode = {
    shoot: HTMLDivElement
    size?: HTMLDivElement
}

export type UpdateBranch = {
    dataShoots: Map<string, DataNode>
    elShoots?: Map<string, ElNode>
    ul?: HTMLUListElement
}
